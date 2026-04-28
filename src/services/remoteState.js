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
    // --- Sandbox state ---
    doorState: "idle",
    panelState: "idle",
    sensorState: "idle",
    lockerState: "idle",
    noteState: "hidden",
    alarmState: { level: 0, noise: 0, triggers: [] },
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
    // --- Sala 1: Despacho del Profesor ---
    hotspotStates: {
      window: "entered",
      desk: "unsearched",
      paper_bin: "unsearched",
      security_panel: "awaiting_code",
      laser_grid: "active",
      showcase: "locked_laser_active",
      camera: "idle",
      armored_door: "locked",
    },
    discoveries: {},
    flags: {
      copyInInventory: false,
      examStolen: false,
      replacedExam: false,
      resolvedByMainPath: false,
      usedForce: false,
      usedBypass: false,
      photographed: false,
      camera_fooled: false,
    },
    gmSceneState: {
      activeVariant: "normal",
      activeEffects: [],
      history: [],
    },
    failedAttempts: 0,
  };
}

export function createInitialTargetFeedback() {
  return {
    // --- Sandbox ---
    door: "Sandbox activo. Sin regla de puzzle asignada.",
    panel: "Sandbox activo. Sin regla de puzzle asignada.",
    sensor: "Sandbox activo. Sin regla de puzzle asignada.",
    locker: "Sandbox activo. Sin regla de puzzle asignada.",
    electrical_box: "Sandbox activo. Sin regla de puzzle asignada.",
    sports_gear: "Sandbox activo. Sin regla de puzzle asignada.",
    // --- Sala 1 ---
    window: "Habéis entrado por la ventana. Silencio total por ahora.",
    desk: "El escritorio del profesor. Papeles y notas por revisar.",
    paper_bin: "La papelera. Puede haber algo útil entre los desperdicios.",
    security_panel: "Panel del sistema de seguridad. Requiere código de 4 dígitos.",
    laser_grid: "Cuadrícula láser activa. Cualquier movimiento en la vitrina la disparará.",
    showcase: "Vitrina con el examen. Protegida por el sistema láser.",
    camera: "Cámara de vigilancia. Parece que gira periódicamente.",
    armored_door: "Puerta acorazada. Imposible forzar sin provocar alarma general.",
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
    playerBoards: {
      empollon: { hotspot_1: "idle", hotspot_2: "idle", hotspot_3: "idle" },
      manitas:  { hotspot_1: "idle", hotspot_2: "idle", hotspot_3: "idle" },
      guaperas: { hotspot_1: "idle", hotspot_2: "idle", hotspot_3: "idle" },
      mistica:  { hotspot_1: "idle", hotspot_2: "idle", hotspot_3: "idle" },
    },
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
