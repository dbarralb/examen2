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
    salaId: "sala1_el_cierre",
    zoneId: "inicio",
    completedSalas: [],
    availableOutputs: [],
    horusRunId: null,
    sala5VariantId: null,
  };
}

export function createInitialTeamMetrics() {
  return {
    forceCount: 0,
    analysisCount: 0,
    repairCount: 0,
    ecoCount: 0,
    obedienceCount: 0,
    defyCount: 0,
  };
}

export function createInitialPuzzleState(puzzles = []) {
  const state = {};
  for (const puzzle of puzzles) {
    state[puzzle.id] = { solved: false, solvedAt: null };
  }
  return state;
}

/**
 * Returns the initial gameState for a given sala.
 * Each sala defines its own targets and state keys.
 * Currently only Sala 1 has explicit state; future salas will add cases here.
 */
export function createInitialHorusGameState() {
  return {
    hDataTerminalState: "idle",
    hArchiveState: "sealed",
    hMemoryNodeState: "dormant",
    hDecisionPanelState: "locked",
    hContainmentState: "sealed",
    hRelayState: "unstable",
    hProjectorState: "off",
    hCoreAccessState: "locked",
  };
}

export function createInitialSala5GameState() {
  return {
    s5MergeConsoleState: "idle",
    s5FirewallState: "active",
    s5ExileGateState: "sealed",
    s5MaskGeneratorState: "idle",
    s5ExamTerminalState: "idle",
    s5TruthArchiveState: "sealed",
    s5FinalDoorState: "locked",
    s5CodexReaderState: "idle",
  };
}

export function createInitialGameStateForSala(salaId) {
  if (salaId === "sala1_el_cierre") return createInitialGameState();
  if (salaId?.startsWith("horus_run_")) return createInitialHorusGameState();
  if (salaId?.startsWith("sala5_")) return createInitialSala5GameState();
  return {};
}

export function createInitialHorusTargetFeedback() {
  return {
    h_data_terminal: "Terminal inactiva. Esperando interacción.",
    h_archive: "Archivo sellado. Necesita autorización.",
    h_memory_node: "Nodo en reposo. Señal débil.",
    h_decision_panel: "Panel bloqueado. Requiere datos previos.",
    h_containment: "Puerta de contención sellada.",
    h_relay: "Relé inestable. Señal intermitente.",
    h_projector: "Proyector apagado.",
    h_core_access: "Acceso al núcleo denegado.",
  };
}

export function createInitialSala5TargetFeedback() {
  return {
    s5_merge_console: "Consola en espera.",
    s5_firewall: "Cortafuegos activo. Bloqueando accesos.",
    s5_exile_gate: "Puerta de expulsión sellada.",
    s5_mask_generator: "Generador apagado.",
    s5_exam_terminal: "Terminal en espera.",
    s5_truth_archive: "Archivo sellado.",
    s5_final_door: "Puerta final cerrada.",
    s5_codex_reader: "Lector inactivo.",
  };
}

/** Returns the initial targetFeedback for a given sala. */
export function createInitialTargetFeedbackForSala(salaId) {
  if (salaId === "sala1_el_cierre") return createInitialTargetFeedback();
  if (salaId?.startsWith("horus_run_")) return createInitialHorusTargetFeedback();
  if (salaId?.startsWith("sala5_")) return createInitialSala5TargetFeedback();
  return {};
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
    ...createInitialInventoryState(),
    sessionState: createInitialSessionState(),
    puzzleState: {},
    ecoState: {},
    teamMetrics: createInitialTeamMetrics(),
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
