// ---------------------------------------------------------------------------
// remoteState.js — Firebase state shape + factory functions
//
// This module defines the initial state written to Firebase on game reset,
// and utility functions for reading state slices.
//
// What lives here:
//   - Game timer (shared, GM-controlled)
//   - Pulse state (shared, driven by pulseService)
//   - Alarm / scene state (shared, driven by gameRules + gmSceneControl)
//   - Player inventories (per-role, persisted per session)
//   - Player boards (per-role: variant, hotspot states)
//   - Session state (active scenario)
//   - Action log / chat
//
// What does NOT live here:
//   - Puzzle-specific flags or hotspot content — those are defined per scenario
//   - Puzzle-specific state from retired prototypes
// ---------------------------------------------------------------------------

import { createScenarioTargetFeedback } from "../data/scenarioContent.js";
import { DEFAULT_SCENARIO_ID } from "../data/scenarioData.js";

export function createInitialGameTimer() {
  return {
    status: "idle",
    startedAt: null,
    elapsedBeforeStartMs: 0,
  };
}

export function createEmptyResultOverlay() {
  return {
    visible: false,
    message: "",
    startedAt: null,
    endsAt: null,
    actionId: null,
    role: null,
    scenarioId: null,
    variant: null,
  };
}

export function createInitialPulseState() {
  return {
    status: "idle",
    mode: "manual",
    pulseId: null,
    ownerClientId: null,
    schedule: {
      nextPulseAt: null,
      intervalMs: null,
      minMs: 40000,
      maxMs: 120000,
      scheduledAt: null,
      updatedAt: null,
    },
    pulseStartAt: null,
    pulseEndsAt: null,
    pulseChargeStartedAt: null,
    pulseChargeEndsAt: null,
    currentActionId: null,
    currentActionResult: null,
    interferenceVariant: null,
    actionCount: 0,
    actionIndex: 0,
    resultOverlay: createEmptyResultOverlay(),
    updatedAt: Date.now(),
  };
}

/**
 * Shared game state — alarm system, scene flags, GM effects.
 * Scenario-specific puzzle state is NOT included here; it is injected
 * per scenario when the adventure content is defined.
 */
export function createInitialGameState() {
  return {
    alarmState: { level: 0, noise: 0, triggers: [] },
    discoveries: {},   // keyed by discovery ID, value: true
    flags: {},         // keyed by flag ID, value: true
    gmSceneState: {
      activeVariant: "normal",
      activeEffects: [],
      history: [],
    },
  };
}

/**
 * Target feedback — text shown to players after interacting with a hotspot.
 * Starts empty; populated by resolveActionWithResult during pulse execution.
 */
export function createInitialTargetFeedback() {
  return createScenarioTargetFeedback(DEFAULT_SCENARIO_ID);
}

/** Per-player inventory, item tracking, card usage. */
export function createInitialInventoryState() {
  return {
    itemSeenState: {},
    playerInventories: {},
    pendingItemUsage: {},
    cardUsage: {},
  };
}

/**
 * Session state — tracks which scenario is active and which have been completed.
 */
export function createInitialSessionState() {
  return {
    scenarioId: DEFAULT_SCENARIO_ID,
    completedScenarios: [],
  };
}

/**
 * Initial per-player board state.
 * variant: A | B | C | D  — assigned by GM, controls which parallel reality the player sees.
 * hotspot_1/2/3: hotspot state within the player's board (blank by default).
 */
function createInitialPlayerBoards() {
  return {
    empollon: { variant: "A", scenarioId: DEFAULT_SCENARIO_ID },
    guaperas: { variant: "A", scenarioId: DEFAULT_SCENARIO_ID },
    manitas:  { variant: "B", scenarioId: DEFAULT_SCENARIO_ID },
    mistica:  { variant: "B", scenarioId: DEFAULT_SCENARIO_ID },
  };
}

// ---------------------------------------------------------------------------
// Full initial remote state — written to Firebase on game reset
// ---------------------------------------------------------------------------

export function buildInitialRemoteState(status = "role_select") {
  return {
    session: {
      status,
      accessCode: null,
      gmClientId: null,
      gameTimer: createInitialGameTimer(),
      updatedAt: Date.now(),
    },
    gameState: createInitialGameState(),
    pulseState: createInitialPulseState(),
    targetFeedback: createInitialTargetFeedback(),
    lobby: {
      players: {},
      roleClaims: {},
      countdownStartedAt: null,
      updatedAt: Date.now(),
    },
    lastRoleActions: {},
    playerViews: {},
    playerBoards: createInitialPlayerBoards(),
    hotspotOverrides: {},
    queuedActions: null,
    actionLog: ["Sistema listo. Esperando inicio de partida."],
    chatMessages: [
      { id: "gm-welcome", author: "GM", text: "Sistema listo.", createdAt: 1 },
    ],
    lastRoleDebug: "Sin acciones resueltas todavia.",
    ...createInitialInventoryState(),
    sessionState: createInitialSessionState(),
  };
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Normalize Firebase lists (objects or arrays) into a sorted array. */
export function normalizeRemoteList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return Object.values(value).filter((item) => item !== null && item !== undefined);
  }

  return Object.values(value).sort((a, b) => {
    const aTime = a && (a.loadedAt || a.createdAt) ? a.loadedAt || a.createdAt : 0;
    const bTime = b && (b.loadedAt || b.createdAt) ? b.loadedAt || b.createdAt : 0;
    return aTime - bTime;
  });
}

/** Get elapsed game seconds from the game timer object. */
export function getGameTimerElapsedSeconds(gameTimer = createInitialGameTimer()) {
  const base = gameTimer.elapsedBeforeStartMs || 0;

  if (gameTimer.status === "running" && gameTimer.startedAt) {
    return Math.floor((base + Math.max(0, Date.now() - gameTimer.startedAt)) / 1000);
  }

  return Math.floor(base / 1000);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
