// ---------------------------------------------------------------------------
// gameRules.js — generic game resolution engine
//
// This module handles:
//   1. Action resolver — processes queued actions during a pulse
//
// NOTE: All scenario-specific puzzle logic (hotspot outcomes, flag mutations,
// discoveries) lives OUTSIDE this file. It is injected per-scenario when
// the adventure content is written.
// ---------------------------------------------------------------------------

import { isInteractionAction } from "../data/actionTypes.js";
import { LOCKER_STATES, RESONANCE_COSTS, getScenarioScopedTargetKey, resolveScenarioAction } from "../data/scenarioContent.js";

// ---------------------------------------------------------------------------
// 1. Pulse helpers
// ---------------------------------------------------------------------------

/** Build shared flags for the current pulse (e.g. combo detection). */
export function buildPulseFlags(pulseActions = [], gameState = {}) {
  const lockerFusionActions = pulseActions.filter((action) => (
    action.target === "taquillas" && isInteractionAction(action)
  ));
  const canFuseLocker = lockerFusionActions.some((action) => {
    const scenarioId = action.scenarioId || "almacen";
    const variant = action.variant || "A";
    const scopedLockerKey = getScenarioScopedTargetKey(scenarioId, variant, "taquillas");
    const lockerState = gameState.hotspotStates?.[scopedLockerKey] || LOCKER_STATES.LOCKED;
    if (lockerState !== LOCKER_STATES.LOCKED) return false;
    const variantResonance = gameState.resonanceByVariant?.[variant] || gameState.resonance || {};
    const resonanceValue = Number(variantResonance.value || 0);
    return resonanceValue >= RESONANCE_COSTS.LOCKER_FUSION;
  });

  return { canFuseLocker };
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
export function resolveActionWithResult(context, action, pulseFlags = {}) {
  if (!context.metricsDelta) context.metricsDelta = {};

  const scenarioResult = resolveScenarioAction(context, action, pulseFlags);
  if (scenarioResult) {
    return scenarioResult;
  }

  // Default generic result when a scenario has no resolver yet.
  const message = `${action.role} usa ${action.card} sobre ${action.target}. Sin efecto de puzzle definido.`;
  const feedback = "Acción registrada. Sin efecto de puzzle.";

  context.targetFeedback[getScenarioScopedTargetKey(action.scenarioId || context.sessionState?.scenarioId || "almacen", action.variant || context.playerBoards?.[action.role]?.variant || "A", action.target)] = feedback;
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
