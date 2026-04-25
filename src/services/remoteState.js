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
    doorState: "closed",
    panelState: "active",
    sensorState: "active",
    lockerState: "closed",
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
    door: "Sin revisar.",
    panel: "Activo. Esperando lectura o manipulacion.",
    sensor: "Activo. Detectando el entorno.",
    locker: "Cerrada.",
    electrical_box: "Sin interaccion todavia.",
    sports_gear: "Material tirado por el gimnasio.",
  };
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
    actionLog: ["Sistema listo. Selecciona carta y target para encolar una accion."],
    chatMessages: [
      { id: "gm-welcome", author: "GM", text: "Bienvenidos al gimnasio.", createdAt: 1 },
      { id: "player2-dummy", author: "Jugador 2", text: "Voy a mirar el panel.", createdAt: 2 },
    ],
    lastRoleDebug: "Sin acciones resueltas todavia.",
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
