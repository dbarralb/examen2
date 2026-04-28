// ---------------------------------------------------------------------------
// gameRules.js — generic game resolution engine
//
// This module handles:
//   1. Alarm system   — noise accumulation, level escalation (0-3)
//   2. GM recommendations — surface suggested scene effects per alarm level
//   3. Action resolver — processes queued actions during a pulse
//
// NOTE: All scenario-specific puzzle logic (hotspot outcomes, flag mutations,
// discoveries) lives OUTSIDE this file. It is injected per-scenario when
// the adventure content is written.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Alarm system
// ---------------------------------------------------------------------------

/** Alarm level thresholds based on accumulated noise. */
export const alarmEffects = {
  0: { description: "normal",    modifiers: [] },
  1: { description: "sospecha",  modifiers: ["increaseFeedback", "minorDelay"] },
  2: { description: "alarma",    modifiers: ["lockRandomObject", "increaseCameraSpeed"] },
  3: { description: "contencion",modifiers: ["lockExitTemporarily", "increaseSystemInterference"] },
};

/** Derive alarm level from accumulated noise. */
export function updateAlarmLevel(alarmState) {
  const noise = alarmState?.noise ?? 0;
  if (noise >= 4) return 3;
  if (noise >= 2) return 2;
  if (noise >= 1) return 1;
  return 0;
}

/** No-op: GM controls scene changes explicitly via gmSceneControl. */
export function applyAlarmEffects(_gameState) {}

/** Add noise to the shared alarm state and recalculate level. */
export function applyNoiseToAlarm(gameState, noiseValue, trigger = null) {
  if (!gameState.alarmState || typeof gameState.alarmState !== "object") {
    gameState.alarmState = { level: 0, noise: 0, triggers: [] };
  }

  gameState.alarmState.noise = (gameState.alarmState.noise || 0) + noiseValue;

  if (trigger) {
    gameState.alarmState.triggers = [...(gameState.alarmState.triggers || []), trigger];
  }

  gameState.alarmState.level = updateAlarmLevel(gameState.alarmState);
}

// ---------------------------------------------------------------------------
// 2. GM recommendations
// ---------------------------------------------------------------------------

/**
 * Returns a list of suggested scene effects based on the current alarm level.
 * These are advisory — the GM decides what to activate from the panel.
 */
export function getAlarmRecommendations(gameState) {
  const level = gameState.alarmState?.level ?? 0;
  const recommendations = [];

  if (level >= 1) {
    recommendations.push({
      id: "suggest_minor_suspicion",
      label: "Activar sospecha leve",
      reason: "Ruido detectado en el escenario",
      possibleSceneEffects: ["camera_tracking", "system_interference"],
    });
  }

  if (level >= 2) {
    recommendations.push({
      id: "suggest_action_delay",
      label: "Aumentar tiempo de carga de acciones",
      reason: "Alarma activa",
      possibleSceneEffects: ["increase_action_load_time"],
    });
    recommendations.push({
      id: "suggest_red_light",
      label: "Activar luz roja de alarma",
      reason: "Tensión alta — presión visual para jugadores",
      possibleSceneEffects: ["red_light_overlay"],
    });
    recommendations.push({
      id: "suggest_lock",
      label: "Bloquear elemento temporalmente",
      reason: "Contención parcial",
      possibleSceneEffects: ["door_temporarily_locked"],
    });
  }

  if (level >= 3) {
    recommendations.push({
      id: "suggest_containment",
      label: "Activar modo contención",
      reason: "Alarma máxima",
      possibleSceneEffects: ["containment_mode"],
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// 3. Pulse helpers
// ---------------------------------------------------------------------------

/** Build shared flags for the current pulse (e.g. combo detection). Blank by default. */
export function buildPulseFlags(_pulseActions, _gameState) {
  return {};
}

/** Resolve an item-card combo. Returns null until scenario logic is wired. */
export function resolveItemCombo() {
  return null;
}

/** Check if the scenario puzzle is complete. Returns [] until scenario is defined. */
export function checkPuzzleCompletion() {
  return [];
}

// ---------------------------------------------------------------------------
// 4. Action resolver
// ---------------------------------------------------------------------------

/**
 * resolveActionWithResult — main entry point called by pulseService for each action.
 *
 * Mutates context.gameState, context.targetFeedback, and context.actionLog.
 * Returns the human-readable result message string.
 *
 * Scenario-specific logic (puzzle mutations, flag changes, noise generation)
 * should be injected here when adventure content is written.
 */
export function resolveActionWithResult(context, action) {
  if (!context.metricsDelta) context.metricsDelta = {};

  // Default generic result — no puzzle logic yet
  const message = `${action.role} usa ${action.card} sobre ${action.target}. Sin efecto de puzzle definido.`;
  const feedback = "Acción registrada. Sin efecto de puzzle.";

  context.targetFeedback[action.target] = feedback;
  context.lastRoleDebug = message;
  context.actionLog.unshift(message);

  return message;
}

/** Create a standardised lastRoleAction entry for Firebase. */
export function createLastRoleAction(action, status, message = "") {
  return {
    player: action.player,
    role: action.role,
    card: action.card,
    target: action.target,
    status,
    message,
    updatedAt: Date.now(),
  };
}
