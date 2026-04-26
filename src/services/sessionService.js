import { rooms, getEcosForRoom, getPuzzlesForRoom, getRoom } from "../data/roomData.js";
import { saveSessionToCodex } from "./codexService.js";
import { firebasePatch } from "./firebaseClient.js";
import {
  createInitialGameStateForSala,
  createInitialPuzzleState,
  createInitialTargetFeedbackForSala,
} from "./remoteState.js";
import { computeTeamProfile } from "./teamProfile.js";

/**
 * Selects the next sala based on completed salas, current sala number, and team profile.
 *
 * Rules:
 * - Sala 4 is always Hórus (variant chosen by team profile)
 * - Sala 5 is always the final
 * - Salas 2-3 are picked from the available pool excluding already-completed ones
 *
 * Returns a room object or null if the game is over.
 */
export function selectNextSala(completedSalas, currentSalaNumber, teamMetrics) {
  const nextNumber = currentSalaNumber + 1;

  if (nextNumber > 5) return null; // game over

  const profile = computeTeamProfile(teamMetrics);

  if (nextNumber === 4) {
    // Hórus — find the variant matching the team profile
    const horusId = `horus_run_${profile}`;
    const horusRoom = rooms.find((r) => r.id === horusId);
    // Fall back to balanced if the specific variant isn't defined yet
    return horusRoom || rooms.find((r) => r.id === "horus_run_balanced") || null;
  }

  if (nextNumber === 5) {
    // Final — variant selected by Hórus decision + metrics
    // The caller should use selectSala5Variant() directly for full control;
    // here we fall back to the first available Sala 5 variant.
    const finalRoom = rooms.find((r) => r.id?.startsWith("sala5_"));
    return finalRoom || null;
  }

  // Salas 2-3: pick from pool, excluding completed
  const completedIds = new Set(completedSalas);
  const candidates = rooms.filter(
    (r) => r.salaNumber === nextNumber && !completedIds.has(r.id),
  );

  if (candidates.length > 0) return candidates[0];

  // Fallback: any sala with the right number
  const fallback = rooms.find((r) => r.salaNumber === nextNumber);
  return fallback || null;
}

/**
 * Completes the current sala and transitions to the next one.
 * Resets sala-scoped state (gameState, puzzleState, ecoState, inventories).
 * Preserves teamMetrics and cardUsage across salas.
 *
 * Returns { nextSala, gameOver } — nextSala is the room definition or null.
 */
export async function completeSala(currentSessionState, teamMetrics) {
  const { salaId, completedSalas = [], horusDecision } = currentSessionState;
  const currentRoom = rooms.find((r) => r.id === salaId);
  const currentNumber = currentRoom?.salaNumber || 1;

  // Use specific Sala 5 variant selection when transitioning from Sala 4
  let nextSala;
  if (currentNumber === 4) {
    nextSala = selectSala5Variant(horusDecision, teamMetrics, currentSessionState);
  } else {
    nextSala = selectNextSala(completedSalas, currentNumber, teamMetrics);
  }
  const gameOver = !nextSala;

  const nextSalaId = nextSala?.id || salaId;
  const nextPuzzles = getPuzzlesForRoom(nextSalaId);
  const nextEcos = getEcosForRoom(nextSalaId);

  const nextEcoState = {};
  for (const eco of nextEcos) {
    nextEcoState[eco.id] = { discovered: false, discoveredAt: null };
  }

  const patch = {
    // Advance session
    "sessionState/salaId": nextSalaId,
    "sessionState/zoneId": "inicio",
    "sessionState/completedSalas": [...completedSalas, salaId],
    "sessionState/availableOutputs": [],
    // Reset sala-scoped state
    gameState: createInitialGameStateForSala(nextSalaId),
    targetFeedback: createInitialTargetFeedbackForSala(nextSalaId),
    puzzleState: createInitialPuzzleState(nextPuzzles),
    ecoState: nextEcoState,
    // Reset inventories per sala
    itemSeenState: {},
    playerInventories: {},
    pendingItemUsage: {},
    // Clear action queue
    queuedActions: null,
    lastRoleActions: {},
    // Keep: teamMetrics, cardUsage (not overwritten)
  };

  if (gameOver) {
    patch["sessionState/gameOver"] = true;
  }

  await firebasePatch("", patch);

  // Save session summary to Codex (localStorage) on game completion
  if (gameOver) {
    const allSalas = [...completedSalas, salaId];
    const ecosDiscovered = Object.entries(currentSessionState)
      .filter(([, v]) => v?.discovered)
      .map(([k]) => k);
    saveSessionToCodex(allSalas, null, ecosDiscovered);
  }

  return { nextSala, gameOver };
}

/**
 * Selects the Sala 5 variant based on the Hórus decision and team metrics.
 *
 * Priority rule: "El Examen" variant is selected if ALL of:
 *   - ecoCount >= 4
 *   - forceCount <= 2
 *   - contradictionsFound is true (stored in sessionState)
 *
 * Otherwise, the variant matching the Hórus decision is used:
 *   - "integration" → sala5_integracion
 *   - "rejection"   → sala5_rechazo
 *   - "deception"   → sala5_engano
 */
export function selectSala5Variant(horusDecision, teamMetrics, sessionFlags = {}) {
  // Check "El Examen" priority conditions
  const meetsExam =
    (teamMetrics.ecoCount || 0) >= 4 &&
    (teamMetrics.forceCount || 0) <= 2 &&
    sessionFlags.contradictionsFound === true;

  if (meetsExam) {
    const examRoom = rooms.find((r) => r.id === "sala5_el_examen");
    if (examRoom) return examRoom;
  }

  // Fall back to decision-based variant
  const decisionMap = {
    integration: "sala5_integracion",
    rejection: "sala5_rechazo",
    deception: "sala5_engano",
  };

  const variantId = decisionMap[horusDecision] || "sala5_integracion";
  return rooms.find((r) => r.id === variantId) || rooms.find((r) => r.id === "sala5_integracion");
}

/**
 * Records the Hórus decision (integration/rejection/deception) to Firebase.
 */
export async function saveHorusDecision(decision) {
  await firebasePatch("sessionState", {
    horusDecision: decision,
  });
}
