import { createId, getOrCreateClientId } from "./clientIdentity.js";
import { firebaseGet, firebaseGetWithEtag, firebasePatch, firebasePutIfMatch } from "./firebaseClient.js";
import { buildPulseFlags, createLastRoleAction, resolveActionWithResult } from "./gameRules.js";
import { createEmptyResultOverlay, createInitialGameState, createInitialPulseState, createInitialSessionState, createInitialTargetFeedback, createInitialTeamMetrics, normalizeRemoteList } from "./remoteState.js";

const timing = {
  actionExecutionSeconds: 3,
  pulseChargeSeconds: 10,
  resultOverlaySeconds: 5,
};

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sortActionsByLoadedAt(a, b) {
  const aTime = a.loadedAt || a.createdAt || 0;
  const bTime = b.loadedAt || b.createdAt || 0;
  return aTime - bTime;
}

function createPulseResultOverlay(message, actionId) {
  const now = Date.now();
  return {
    visible: true,
    message: message || "Accion resuelta.",
    startedAt: now,
    endsAt: now + timing.resultOverlaySeconds * 1000,
    actionId,
  };
}

async function acquireRemotePulseLock(nextPulseState) {
  const current = await firebaseGetWithEtag("pulseState");
  const currentPulseState = { ...createInitialPulseState(), ...(current.data || {}) };

  if (currentPulseState.status && currentPulseState.status !== "idle") {
    return false;
  }

  const result = await firebasePutIfMatch("pulseState", nextPulseState, current.etag);
  return result.ok;
}

export async function startManualPulse({ onStatus } = {}) {
  const pulseId = createId();
  const ownerClientId = getOrCreateClientId();
  const chargeMs = timing.pulseChargeSeconds * 1000;
  const now = Date.now();
  let pulseState = {
    status: "charging",
    mode: "manual",
    pulseId,
    ownerClientId,
    pulseChargeStartedAt: now,
    pulseChargeEndsAt: now + chargeMs,
    pulseStartAt: null,
    currentActionId: null,
    resultOverlay: createEmptyResultOverlay(),
    updatedAt: now,
  };

  const lockAcquired = await acquireRemotePulseLock(pulseState);

  if (!lockAcquired) {
    throw new Error("Otro GM o pulso remoto ya controla la cola.");
  }

  onStatus?.("El GM inicia un pulso. La cola se prepara.");
  let actionLog = normalizeRemoteList(await firebaseGet("actionLog"));
  actionLog.unshift("El GM inicia un pulso. La cola se prepara.");
  await firebasePatch("", { actionLog });

  try {
    await waitMs(chargeMs);

    const pulseStartAt = Date.now();
    const pendingItemUsage = (await firebaseGet("pendingItemUsage")) || {};
    const queuedActions = normalizeRemoteList(await firebaseGet("queuedActions"));
    const pulseActions = queuedActions
      .filter((action) => (action.status || "queued") === "queued" && (action.loadedAt || action.createdAt || 0) <= pulseStartAt)
      .sort(sortActionsByLoadedAt);

    if (pulseActions.length === 0) {
      pulseState = createInitialPulseState();
      actionLog.unshift("El pulso termina sin acciones listas.");
      await firebasePatch("", { pulseState, actionLog });
      onStatus?.("El pulso termina sin acciones listas.");
      return;
    }

    const gameState = { ...createInitialGameState(), ...((await firebaseGet("gameState")) || {}) };
    const targetFeedback = { ...createInitialTargetFeedback(), ...((await firebaseGet("targetFeedback")) || {}) };
    const lastRoleActions = { ...((await firebaseGet("lastRoleActions")) || {}) };
    let lastRoleDebug = (await firebaseGet("lastRoleDebug")) || "Sin acciones resueltas todavia.";
    const sessionState = { ...createInitialSessionState(), ...((await firebaseGet("sessionState")) || {}) };
    const puzzleState = (await firebaseGet("puzzleState")) || {};
    const ecoState = (await firebaseGet("ecoState")) || {};
    const teamMetrics = { ...createInitialTeamMetrics(), ...((await firebaseGet("teamMetrics")) || {}) };
    const context = {
      gameState,
      targetFeedback,
      actionLog,
      lastRoleDebug,
      puzzleState,
      ecoState,
      teamMetrics,
      metricsDelta: {},
      salaId: sessionState.salaId,
      availableOutputs: sessionState.availableOutputs || [],
    };

    pulseState = {
      ...pulseState,
      status: "executing",
      pulseStartAt,
      currentActionId: null,
      updatedAt: Date.now(),
    };

    const pulseFlags = buildPulseFlags(pulseActions, gameState);
    actionLog.unshift(`Pulso cargado: ${pulseActions.length} acciones entran en ejecucion.`);
    await firebasePatch("", { pulseState, actionLog });
    onStatus?.(`Pulso cargado: ${pulseActions.length} acciones entran en ejecucion.`);

    for (let index = 0; index < pulseActions.length; index += 1) {
      const liveAction = { ...pulseActions[index] };
      const itemUsage = pendingItemUsage[liveAction.role];
      if (itemUsage?.itemId && itemUsage?.targetId === liveAction.target) {
        liveAction.itemId = itemUsage.itemId;
      }
      const startedAt = Date.now();
      liveAction.status = "executing";
      liveAction.pulseId = pulseId;
      liveAction.executionStartedAt = startedAt;
      liveAction.executionEndsAt = startedAt + (liveAction.executionTimeSeconds || timing.actionExecutionSeconds) * 1000;
      pulseState.currentActionId = liveAction.id;
      pulseState.updatedAt = startedAt;
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "ejecutando");
      actionLog.unshift(`Ejecutando ${index + 1}/${pulseActions.length}: ${liveAction.card} sobre ${liveAction.target}.`);

      await firebasePatch("", {
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        actionLog,
        lastRoleActions,
      });

      onStatus?.(`Ejecutando ${index + 1}/${pulseActions.length}: ${liveAction.card}.`);
      await waitMs((liveAction.executionTimeSeconds || timing.actionExecutionSeconds) * 1000);

      const resultMessage = resolveActionWithResult(context, liveAction, pulseFlags);
      lastRoleDebug = context.lastRoleDebug;
      liveAction.status = "resolved";
      liveAction.resolvedAt = Date.now();
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "resuelta", resultMessage);
      pulseState.resultOverlay = createPulseResultOverlay(resultMessage, liveAction.id);
      pulseState.updatedAt = Date.now();

      await firebasePatch("", {
        gameState: context.gameState,
        targetFeedback: context.targetFeedback,
        actionLog,
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        lastRoleActions,
        lastRoleDebug,
        puzzleState: context.puzzleState,
        ecoState: context.ecoState,
        "sessionState/availableOutputs": context.availableOutputs,
      });

      onStatus?.(resultMessage);
      await waitMs(timing.resultOverlaySeconds * 1000);

      pulseState.resultOverlay = createEmptyResultOverlay();
      pulseState.updatedAt = Date.now();
      await firebasePatch("", { pulseState });
    }

    const resolvedActionDeletes = pulseActions.reduce((deletes, action) => {
      deletes[`queuedActions/${action.id}`] = null;
      return deletes;
    }, {});
    pulseState = createInitialPulseState();
    actionLog.unshift("Pulso resuelto. Las acciones tardias esperan al siguiente.");

    // Apply accumulated metric deltas
    for (const [key, delta] of Object.entries(context.metricsDelta)) {
      context.teamMetrics[key] = (context.teamMetrics[key] || 0) + delta;
    }

    await firebasePatch("", {
      gameState: context.gameState,
      targetFeedback: context.targetFeedback,
      actionLog,
      ...resolvedActionDeletes,
      pendingItemUsage: {},
      pulseState,
      lastRoleActions,
      lastRoleDebug,
      puzzleState: context.puzzleState,
      ecoState: context.ecoState,
      teamMetrics: context.teamMetrics,
      "sessionState/availableOutputs": context.availableOutputs,
    });
    onStatus?.("Pulso resuelto. Las acciones tardias esperan al siguiente.");
  } catch (error) {
    pulseState = createInitialPulseState();
    await firebasePatch("", { pulseState });
    throw error;
  }
}
