import { createId, getOrCreateClientId } from "./clientIdentity.js";
import { firebaseGet, firebaseGetWithEtag, firebasePatch, firebasePutIfMatch } from "./firebaseClient.js";
import { getActionLabel } from "../data/actionTypes.js";
import { buildPulseFlags, createLastRoleAction, resolveActionWithResult } from "./gameRules.js";
import { createEmptyResultOverlay, createInitialGameState, createInitialPulseState, createInitialTargetFeedback, normalizeRemoteList } from "./remoteState.js";

export const PULSE_TIMING = {
  actionExecutionSeconds: 3,
  resultDisplaySeconds: 5,
  autoMinMs: 40000,
  autoMaxMs: 120000,
};

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sortActionsByLoadedAt(a, b) {
  const aTime = a.loadedAt || a.createdAt || 0;
  const bTime = b.loadedAt || b.createdAt || 0;
  return aTime - bTime;
}

function getScheduleRange(range = {}) {
  const minMs = Number(range.minMs || PULSE_TIMING.autoMinMs);
  const maxMs = Number(range.maxMs || PULSE_TIMING.autoMaxMs);
  return {
    minMs: Math.max(10000, Math.min(minMs, maxMs)),
    maxMs: Math.max(minMs, maxMs),
  };
}

function getRandomIntervalMs(range = {}) {
  const { minMs, maxMs } = getScheduleRange(range);
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

export function createPulseSchedule(range = {}, now = Date.now()) {
  const { minMs, maxMs } = getScheduleRange(range);
  const intervalMs = getRandomIntervalMs({ minMs, maxMs });

  return {
    nextPulseAt: now + intervalMs,
    intervalMs,
    minMs,
    maxMs,
    scheduledAt: now,
    updatedAt: now,
  };
}

function mergePulseState(value) {
  const initial = createInitialPulseState();
  const schedule = { ...initial.schedule, ...(value?.schedule || {}) };
  return { ...initial, ...(value || {}), schedule };
}

function createPulseResultOverlay(message, action, now = Date.now()) {
  return {
    visible: true,
    message: message || "Accion resuelta.",
    startedAt: now,
    endsAt: now + PULSE_TIMING.resultDisplaySeconds * 1000,
    actionId: action?.id || null,
    role: action?.role || null,
    scenarioId: action?.scenarioId || null,
    variant: action?.variant || null,
  };
}

function createCurrentActionResult(action, message, now = Date.now()) {
  return {
    visible: true,
    actionId: action?.id || null,
    role: action?.role || null,
    player: action?.player || action?.role || "Jugador",
    card: action?.card || null,
    target: action?.target || null,
    message: message || "Accion resuelta.",
    startedAt: now,
    endsAt: now + PULSE_TIMING.resultDisplaySeconds * 1000,
    scenarioId: action?.scenarioId || null,
    variant: action?.variant || null,
  };
}

function estimatePulseDurationMs(actions = []) {
  return actions.reduce((total, action) => {
    const executionMs = (action.executionTimeSeconds || PULSE_TIMING.actionExecutionSeconds) * 1000;
    return total + executionMs + PULSE_TIMING.resultDisplaySeconds * 1000;
  }, 0);
}

async function acquireRemotePulseLock(nextPulseState) {
  const current = await firebaseGetWithEtag("pulseState");
  const currentPulseState = mergePulseState(current.data);

  if (currentPulseState.status && currentPulseState.status !== "idle") {
    return false;
  }

  const result = await firebasePutIfMatch("pulseState", nextPulseState, current.etag);
  return result.ok;
}

async function getReadyPulseActions(pulseStartAt) {
  const queuedActions = normalizeRemoteList(await firebaseGet("queuedActions"));
  return queuedActions
    .filter((action) => (action.status || "queued") === "queued" && (action.loadedAt || action.createdAt || 0) <= pulseStartAt)
    .sort(sortActionsByLoadedAt);
}

async function resetPulseToIdle(schedule, patch = {}) {
  const now = Date.now();
  await firebasePatch("", {
    pulseState: {
      ...createInitialPulseState(),
      mode: "auto",
      schedule: schedule || createPulseSchedule({}, now),
      updatedAt: now,
    },
    ...patch,
  });
}

export async function ensureNextPulseScheduled({ onStatus, range } = {}) {
  const current = mergePulseState(await firebaseGet("pulseState"));

  if (current.status !== "idle" || current.schedule?.nextPulseAt) {
    return current;
  }

  const now = Date.now();
  const schedule = createPulseSchedule(range || current.schedule, now);
  const nextPulseState = {
    ...current,
    mode: "auto",
    schedule,
    updatedAt: now,
  };

  await firebasePatch("pulseState", nextPulseState);
  onStatus?.("Proximo pulso automatico programado.");
  return nextPulseState;
}

export async function triggerAutoPulseIfDue({ onStatus, range } = {}) {
  const current = mergePulseState(await firebaseGet("pulseState"));

  if (current.status !== "idle") {
    return false;
  }

  if (!current.schedule?.nextPulseAt) {
    await ensureNextPulseScheduled({ onStatus, range: range || current.schedule });
    return false;
  }

  if (Date.now() < current.schedule.nextPulseAt) {
    return false;
  }

  await executePulse({ mode: "auto", onStatus, range: range || current.schedule });
  return true;
}

export async function startManualPulse({ onStatus, range } = {}) {
  await executePulse({ mode: "manual", onStatus, range });
}

export async function executePulse({ mode = "manual", onStatus, range } = {}) {
  const pulseId = createId();
  const ownerClientId = getOrCreateClientId();
  const pulseStartAt = Date.now();
  const pulseActions = await getReadyPulseActions(pulseStartAt);
  const nextSchedule = createPulseSchedule(range, pulseStartAt);
  const estimatedDurationMs = pulseActions.length > 0
    ? estimatePulseDurationMs(pulseActions)
    : PULSE_TIMING.actionExecutionSeconds * 1000;
  let pulseState = {
    ...createInitialPulseState(),
    status: "executing",
    mode,
    pulseId,
    ownerClientId,
    schedule: nextSchedule,
    pulseStartAt,
    pulseEndsAt: pulseStartAt + estimatedDurationMs,
    currentActionId: null,
    currentActionResult: null,
    interferenceVariant: Math.floor(Math.random() * 3) + 1,
    actionCount: pulseActions.length,
    actionIndex: 0,
    resultOverlay: createEmptyResultOverlay(),
    updatedAt: pulseStartAt,
  };

  const lockAcquired = await acquireRemotePulseLock(pulseState);

  if (!lockAcquired) {
    throw new Error("Otro GM o pulso remoto ya controla la cola.");
  }

  let actionLog = normalizeRemoteList(await firebaseGet("actionLog"));
  actionLog.unshift(pulseActions.length > 0
    ? `Pulso ${mode === "auto" ? "automatico" : "manual"}: ${pulseActions.length} acciones entran en ejecucion.`
    : `Pulso ${mode === "auto" ? "automatico" : "manual"} sin acciones listas: la anomalia entra en ejecucion.`
  );
  await firebasePatch("", { actionLog });
  onStatus?.(pulseActions.length > 0 ? `Pulso iniciado: ${pulseActions.length} acciones.` : "Pulso iniciado sin acciones.");

  try {
    if (pulseActions.length === 0) {
      await waitMs(PULSE_TIMING.actionExecutionSeconds * 1000);
      actionLog.unshift("Pulso sin acciones resuelto. Siguiente pulso programado.");
      await resetPulseToIdle(nextSchedule, { actionLog });
      onStatus?.("Pulso sin acciones resuelto. Siguiente pulso programado.");
      return;
    }

    const pendingItemUsage = (await firebaseGet("pendingItemUsage")) || {};
    const gameState = { ...createInitialGameState(), ...((await firebaseGet("gameState")) || {}) };
    const targetFeedback = { ...createInitialTargetFeedback(), ...((await firebaseGet("targetFeedback")) || {}) };
    const lastRoleActions = { ...((await firebaseGet("lastRoleActions")) || {}) };
    let lastRoleDebug = (await firebaseGet("lastRoleDebug")) || "Sin acciones resueltas todavia.";
    const sessionState = (await firebaseGet("sessionState")) || {};
    const playerBoards = (await firebaseGet("playerBoards")) || {};
    const context = {
      gameState,
      targetFeedback,
      actionLog,
      lastRoleDebug,
      metricsDelta: {},
      sessionState,
      playerBoards,
    };
    const pulseFlags = buildPulseFlags(pulseActions, gameState);

    for (let index = 0; index < pulseActions.length; index += 1) {
      const liveAction = { ...pulseActions[index] };
      const actionBoard = playerBoards?.[liveAction.role] || {};
      liveAction.scenarioId = liveAction.scenarioId || actionBoard.scenarioId || sessionState.scenarioId || "almacen";
      liveAction.variant = liveAction.variant || actionBoard.variant || "A";
      const itemUsage = pendingItemUsage[liveAction.role];
      if (itemUsage?.itemId && itemUsage?.targetId === liveAction.target) {
        liveAction.itemId = itemUsage.itemId;
      }

      const startedAt = Date.now();
      liveAction.status = "executing";
      liveAction.pulseId = pulseId;
      liveAction.executionStartedAt = startedAt;
      liveAction.executionEndsAt = startedAt + (liveAction.executionTimeSeconds || PULSE_TIMING.actionExecutionSeconds) * 1000;
      pulseState = {
        ...pulseState,
        currentActionId: liveAction.id,
        currentActionResult: null,
        actionIndex: index + 1,
        updatedAt: startedAt,
      };
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "ejecutando");
      actionLog.unshift(`Ejecutando ${index + 1}/${pulseActions.length}: ${getActionLabel(liveAction)} sobre ${liveAction.target}.`);

      await firebasePatch("", {
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        actionLog,
        lastRoleActions,
      });

      onStatus?.(`Ejecutando ${index + 1}/${pulseActions.length}: ${getActionLabel(liveAction)}.`);
      await waitMs((liveAction.executionTimeSeconds || PULSE_TIMING.actionExecutionSeconds) * 1000);

      const resultMessage = resolveActionWithResult(context, liveAction, pulseFlags);
      const resolvedAt = Date.now();
      lastRoleDebug = context.lastRoleDebug;
      liveAction.status = "resolved";
      liveAction.resolvedAt = resolvedAt;
      liveAction.resultMessage = resultMessage;
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "resuelta", resultMessage);
      pulseState = {
        ...pulseState,
        resultOverlay: createPulseResultOverlay(resultMessage, liveAction, resolvedAt),
        currentActionResult: createCurrentActionResult(liveAction, resultMessage, resolvedAt),
        updatedAt: resolvedAt,
      };

      await firebasePatch("", {
        gameState: context.gameState,
        targetFeedback: context.targetFeedback,
        actionLog,
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        lastRoleActions,
        lastRoleDebug,
      });

      onStatus?.(resultMessage);
      await waitMs(PULSE_TIMING.resultDisplaySeconds * 1000);

      pulseState = {
        ...pulseState,
        resultOverlay: createEmptyResultOverlay(),
        currentActionResult: null,
        updatedAt: Date.now(),
      };
      await firebasePatch("", { pulseState });
    }

    const resolvedActionDeletes = pulseActions.reduce((deletes, action) => {
      deletes[`queuedActions/${action.id}`] = null;
      return deletes;
    }, {});
    actionLog.unshift("Pulso resuelto. Las acciones tardias esperan al siguiente.");

    await resetPulseToIdle(nextSchedule, {
      gameState: context.gameState,
      targetFeedback: context.targetFeedback,
      actionLog,
      ...resolvedActionDeletes,
      pendingItemUsage: {},
      lastRoleActions,
      lastRoleDebug,
    });
    onStatus?.("Pulso resuelto. Siguiente pulso programado.");
  } catch (error) {
    await resetPulseToIdle(nextSchedule);
    throw error;
  }
}
