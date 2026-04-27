import { SANDBOX_ROOM_ID, SANDBOX_START_ZONE_ID } from "../data/roomData.js";

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
  };
}

export function createInitialPulseState() {
  return {
    status: "idle",
    mode: "manual",
    pulseId: null,
    pulseStartAt: null,
    pulseChargeStartedAt: null,
    pulseChargeEndsAt: null,
    currentActionId: null,
    resultOverlay: createEmptyResultOverlay(),
    updatedAt: Date.now(),
  };
}

export function createInitialGameState() {
  return {
    doorState: "idle",
    panelState: "idle",
    sensorState: "idle",
    lockerState: "idle",
    noteState: "hidden",
    alarmState: "off",
    electricalBoxState: "idle",
    sportsGearState: "idle",
    loreFlagTestRevealed: false,
    hiddenRouteFlag: false,
    noteFeedbackShown: false,
    partialNoteFeedbackShown: false,
    cleanExitFeedbackShown: false,
    panelHintKnown: false,
    lockerPrepared: false,
    doorPrepared: false,
    sensorPatternDetected: false,
    sensorTrickedThisPulse: false,
  };
}

export function createInitialTargetFeedback() {
  return {
    door: "Sandbox activo. Sin regla de puzzle asignada.",
    panel: "Sandbox activo. Sin regla de puzzle asignada.",
    sensor: "Sandbox activo. Sin regla de puzzle asignada.",
    locker: "Sandbox activo. Sin regla de puzzle asignada.",
    electrical_box: "Sandbox activo. Sin regla de puzzle asignada.",
    sports_gear: "Sandbox activo. Sin regla de puzzle asignada.",
  };
}

export function createInitialInventoryState() {
  return {
    itemSeenState: {},
    playerInventories: {},
    pendingItemUsage: {},
    cardUsage: {},
  };
}

export function createInitialSessionState() {
  return {
    salaId: SANDBOX_ROOM_ID,
    zoneId: SANDBOX_START_ZONE_ID,
    completedSalas: [],
  };
}

export function createInitialGameStateForSala() {
  return createInitialGameState();
}

export function createInitialTargetFeedbackForSala() {
  return createInitialTargetFeedback();
}

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
    queuedActions: null,
    actionLog: ["Sistema sandbox listo. Arrastra cartas a hotspots y resuelve pulsos manuales."],
    chatMessages: [
      { id: "gm-welcome", author: "GM", text: "Sandbox listo.", createdAt: 1 },
    ],
    lastRoleDebug: "Sin acciones resueltas todavia.",
    ...createInitialInventoryState(),
    sessionState: createInitialSessionState(),
    playerZones: {},
  };
}

export function normalizeRemoteList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return Object.values(value).filter((item) => item !== null && item !== undefined);
  }

  return Object.values(value).sort((a, b) => {
    const aTime = a && (a.loadedAt || a.createdAt) ? a.loadedAt || a.createdAt : 0;
    const bTime = b && (b.loadedAt || b.createdAt) ? b.loadedAt || b.createdAt : 0;
    return aTime - bTime;
  });
}

export function getGameTimerElapsedSeconds(gameTimer = createInitialGameTimer()) {
  const base = gameTimer.elapsedBeforeStartMs || 0;

  if (gameTimer.status === "running" && gameTimer.startedAt) {
    return Math.floor((base + Math.max(0, Date.now() - gameTimer.startedAt)) / 1000);
  }

  return Math.floor(base / 1000);
}
