import { getEcosForRoom, getPuzzlesForRoom } from "../data/roomData.js";

const targetLabels = {
  door: "puerta",
  panel: "panel",
  sensor: "sensor",
  locker: "taquilla",
  electrical_box: "cuadro eléctrico",
  sports_gear: "material deportivo",
};

const roleLabels = {
  empollon: "El Empollón",
  manitas: "La Manitas",
  guaperas: "El guaperas",
  bruto: "El guaperas",
  mistica: "La Mística",
  gm: "Game Master",
};

// Maps each action card to the team metric it increments when used.
const CARD_METRIC_MAP = {
  a_lo_bestia: "forceCount",
  empujar: "forceCount",
  mirar_bien: "analysisCount",
  consultar_apuntes: "analysisCount",
  apanar: "repairCount",
  puenteo_rapido: "repairCount",
  desmontar: "repairCount",
  y_si: "analysisCount",
  esto_vibra_raro: "analysisCount",
  ritual_improvisado: "analysisCount",
};

function getTargetLabel(targetId) {
  return targetLabels[targetId] || targetId;
}

function getRoleLabel(roleId) {
  return roleLabels[roleId] || roleId;
}

function emit(context, message) {
  context.actionLog.unshift(message);
}

function setTargetFeedback(context, targetId, message, action) {
  context.targetFeedback[targetId] = message;

  if (action && ["empollon", "mistica"].includes(action.role)) {
    context.lastRoleDebug = `${getRoleLabel(action.role)} hizo ${action.card} sobre ${getTargetLabel(action.target)}: ${message}`;
  }
}

export function buildPulseFlags(actions, state) {
  const flags = {
    panelSolved: ["understood", "tampered"].includes(state.panelState),
    panelUnderstood: state.panelState === "understood",
    sensorSolved: ["fooled", "disabled"].includes(state.sensorState),
    cleanLockerOpened: state.lockerState === "clean_open",
    doorPrepared: Boolean(state.doorPrepared),
    sensorPatternDetected: Boolean(state.sensorPatternDetected),
    lockerPrepared: Boolean(state.lockerPrepared),
  };

  actions.forEach((action) => {
    if (["mirar_bien", "consultar_apuntes"].includes(action.card) && action.target === "panel") {
      flags.panelSolved = true;
      flags.panelUnderstood = true;
    }

    if (action.card === "puenteo_rapido" && action.target === "panel") {
      flags.panelSolved = true;
    }

    if (action.card === "desmontar" && action.target === "sensor") {
      flags.sensorSolved = true;
    }

    if (["esto_vibra_raro", "ritual_improvisado"].includes(action.card) && action.target === "sensor") {
      flags.sensorPatternDetected = true;
    }

    if (action.card === "y_si" && action.target === "sensor" && (flags.sensorPatternDetected || state.sensorPatternDetected)) {
      flags.sensorSolved = true;
    }

    if (action.card === "mirar_bien" && action.target === "door") {
      flags.doorPrepared = true;
    }

    if (action.card === "apanar" && action.target === "locker") {
      flags.lockerPrepared = true;
    }

    if (action.card === "y_si" && action.target === "locker") {
      flags.cleanLockerOpened = true;
    }
  });

  actions.forEach((action) => {
    if (action.card === "a_lo_bestia" && action.target === "locker" && flags.lockerPrepared) {
      flags.cleanLockerOpened = true;
    }
  });

  return flags;
}

// Resolves item+action or item-only combos. Returns a result message or null if no combo matched.
export function resolveItemCombo(context, action, pulseFlags) {
  if (!action.itemId) return null;
  // Future combos: e.g. { itemId: "locker_lockpick", card: "empujar", target: "door" }
  // Add entries here as new items and interactions are defined.
  return null;
}

function resolveAction(context, action, pulseFlags) {
  const { gameState } = context;
  const previousPanelState = gameState.panelState;
  const panelSolved = pulseFlags.panelSolved || ["understood", "tampered"].includes(gameState.panelState);
  const sensorSolved = pulseFlags.sensorSolved || ["fooled", "disabled"].includes(gameState.sensorState);
  const doorPrepared = pulseFlags.doorPrepared || gameState.doorPrepared;
  const lockerPrepared = pulseFlags.lockerPrepared || gameState.lockerPrepared;
  const sensorPatternDetected = pulseFlags.sensorPatternDetected || gameState.sensorPatternDetected;

  if (action.card === "mirar_bien" && action.target === "panel") {
    gameState.panelState = "understood";
    gameState.panelHintKnown = true;
    setTargetFeedback(context, "panel", "El Empollón interpreta el protocolo 7-B.", action);
    emit(context, "El Empollón interpreta el protocolo 7-B.");
    return;
  }

  if (action.card === "consultar_apuntes" && action.target === "panel") {
    gameState.panelState = "understood";
    gameState.panelHintKnown = true;
    setTargetFeedback(context, "panel", "Los apuntes explican el bloqueo digital y la redundancia física.", action);
    emit(context, "Los apuntes revelan la redundancia física del sistema.");
    return;
  }

  if (action.card === "puenteo_rapido" && action.target === "panel") {
    gameState.panelState = "tampered";
    setTargetFeedback(context, "panel", "Bypass temporal aplicado por La Manitas.", action);
    emit(context, "La Manitas fuerza un bypass temporal del panel.");

    if (previousPanelState !== "understood" && !pulseFlags.panelUnderstood) {
      gameState.alarmState = "on";
      setTargetFeedback(context, "panel", "Bypass inseguro: alerta secundaria activada.", action);
      emit(context, "El bypass activa una alerta secundaria por manipulación insegura.");
    } else if (pulseFlags.panelUnderstood) {
      emit(context, "La lectura del equipo convierte el bypass en una maniobra coordinada.");
    }
    return;
  }

  if (action.card === "apanar" && action.target === "locker") {
    gameState.lockerPrepared = true;
    setTargetFeedback(context, "locker", "Cerradura aflojada. Lista para abrir sin destrozar.", action);
    emit(context, "La Manitas afloja la cerradura de la taquilla.");
    return;
  }

  if (action.card === "a_lo_bestia" && action.target === "locker") {
    if (lockerPrepared) {
      gameState.lockerState = "clean_open";
      gameState.noteState = "complete";
      setTargetFeedback(context, "locker", "La coordinación del pulso abre la taquilla limpia.", action);
      emit(context, "La taquilla se abre limpia gracias a la preparación del pulso.");
    } else {
      gameState.lockerState = "broken_open";
      gameState.noteState = "partial";
      setTargetFeedback(context, "locker", "Taquilla reventada. La nota aparece rota.", action);
      emit(context, "La taquilla se revienta. La nota aparece rota.");
    }
    return;
  }

  if (action.card === "y_si" && action.target === "locker") {
    gameState.lockerState = "clean_open";
    gameState.noteState = "complete";
    setTargetFeedback(context, "locker", "La Mística usa una secuencia absurda de golpecitos. Funciona.", action);
    emit(context, "La Mística prueba una secuencia absurda de golpecitos y la taquilla cede.");
    return;
  }

  if (action.card === "esto_vibra_raro" && action.target === "sensor") {
    gameState.sensorPatternDetected = true;
    setTargetFeedback(context, "sensor", "La Mística detecta un patrón raro en la vibración del sensor.", action);
    emit(context, "La Mística detecta que el sensor responde a un patrón extraño.");
    return;
  }

  if (action.card === "y_si" && action.target === "sensor") {
    if (sensorPatternDetected) {
      gameState.sensorState = "fooled";
      gameState.sensorTrickedThisPulse = true;
      setTargetFeedback(context, "sensor", "La Mística engaña el sensor con una interacción absurda.", action);
      emit(context, "La Mística engaña el sensor con una interacción absurda pero efectiva.");
    } else {
      setTargetFeedback(context, "sensor", "La Mística prueba algo raro, pero aún falta entender el patrón.", action);
      emit(context, "La Mística prueba algo raro, pero el sensor no cae tan fácil.");
    }
    return;
  }

  if (action.card === "ritual_improvisado" && action.target === "sensor") {
    gameState.sensorPatternDetected = true;
    setTargetFeedback(context, "sensor", "Ritual improvisado: queda marcado un patrón sospechoso para test.", action);
    emit(context, "La Mística improvisa un ritual y deja el sensor marcado.");
    return;
  }

  if (action.card === "desmontar" && action.target === "sensor") {
    gameState.sensorState = "disabled";
    setTargetFeedback(context, "sensor", "Sensor desmontado e inutilizado.", action);
    emit(context, "La Manitas abre la carcasa del sensor y lo inutiliza.");
    return;
  }

  if (action.card === "mirar_bien" && action.target === "door") {
    gameState.doorPrepared = true;
    setTargetFeedback(context, "door", "El Empollón detecta cómo empujar sin forzar el mecanismo principal.", action);
    emit(context, "El Empollón detecta cómo empujar la puerta sin forzar el mecanismo principal.");
    return;
  }

  if (action.card === "empujar" && action.target === "door") {
    if (panelSolved && sensorSolved && doorPrepared) {
      gameState.doorState = "clean_open";
      setTargetFeedback(context, "door", "La coordinación del pulso permite abrir la puerta limpiamente.", action);
      emit(context, "La coordinación del pulso permite abrir la puerta limpiamente.");
    } else if (["fooled", "disabled"].includes(gameState.sensorState)) {
      gameState.doorState = "forced_open";
      setTargetFeedback(context, "door", "La puerta cede, pero queda registrada como apertura brusca.", action);
      emit(context, "La puerta cede, pero el sistema detecta una apertura brusca.");
    } else {
      gameState.doorState = "forced_open";
      gameState.alarmState = "on";
      setTargetFeedback(context, "door", "Puerta forzada. Alarma activada.", action);
      emit(context, "La puerta se fuerza y salta la alarma.");
    }
    return;
  }

  if (action.card === "a_lo_bestia" && action.target === "door") {
    gameState.doorState = "forced_open";
    setTargetFeedback(context, "door", "El guaperas revienta la salida de emergencia.", action);
    emit(context, "El guaperas revienta la salida de emergencia.");

    if (gameState.sensorState === "active" || gameState.panelState === "active") {
      gameState.alarmState = "on";
      setTargetFeedback(context, "door", "Salida reventada con sistemas activos. Alarma encendida.", action);
      emit(context, "La alarma del gimnasio se activa.");
    }
    return;
  }

  setTargetFeedback(context, action.target, "Accion sin regla todavia. Feedback de debug generado.", action);
  emit(context, `No hay regla MVP para ${action.card} sobre ${getTargetLabel(action.target)}.`);
}

function resolveNarrativeConsequences(context) {
  const { gameState } = context;

  if (gameState.noteState === "complete" && !gameState.noteFeedbackShown) {
    gameState.loreFlagTestRevealed = true;
    gameState.noteFeedbackShown = true;
    setTargetFeedback(context, "locker", "Nota completa: la prueba evalúa cómo colaboráis.");
    emit(context, "La nota completa revela que la prueba evalúa cómo colaboráis.");
  }

  if (gameState.noteState === "partial" && !gameState.partialNoteFeedbackShown) {
    gameState.partialNoteFeedbackShown = true;
    setTargetFeedback(context, "locker", "Fragmento legible: '...no todos... elegidos...'");
    emit(context, "Solo se puede leer un fragmento: '...no todos... elegidos...'");
  }
}

function resolveExitOutcome(context) {
  const { gameState } = context;

  if (gameState.doorState !== "clean_open") {
    return;
  }

  if (!gameState.cleanExitFeedbackShown) {
    gameState.cleanExitFeedbackShown = true;
    emit(context, "Habéis salido sin destrozar la sala.");
  }

  if (gameState.loreFlagTestRevealed && !gameState.hiddenRouteFlag) {
    gameState.hiddenRouteFlag = true;
    setTargetFeedback(context, "door", "Salida limpia + nota completa: pista oculta desbloqueada.");
    emit(context, "Se desbloquea una pista oculta hacia la verdadera prueba.");
  }
}

/**
 * Evaluates all puzzle `solvedWhen` predicates for the active sala.
 * When a puzzle transitions from unsolved → solved:
 *   - marks it solved in `context.puzzleState`
 *   - appends its outputs to `context.availableOutputs`
 *   - emits a log message
 *
 * Returns an array of newly solved puzzle IDs (empty if none).
 */
export function checkPuzzleCompletion(context) {
  const { gameState, puzzleState, salaId } = context;
  if (!puzzleState || !salaId) return [];

  const puzzles = getPuzzlesForRoom(salaId);
  const availableOutputs = context.availableOutputs || [];
  const newlySolved = [];

  for (const puzzle of puzzles) {
    if (puzzleState[puzzle.id]?.solved) continue;

    // Check required inputs are satisfied
    const inputsSatisfied = puzzle.requiredInputs.every((input) => availableOutputs.includes(input));
    if (!inputsSatisfied) continue;

    // Check solved condition
    if (puzzle.solvedWhen(gameState)) {
      puzzleState[puzzle.id] = { solved: true, solvedAt: Date.now() };
      for (const output of puzzle.outputs) {
        if (!availableOutputs.includes(output)) {
          availableOutputs.push(output);
        }
      }
      newlySolved.push(puzzle.id);
      emit(context, `Puzzle resuelto: ${puzzle.label}`);
    }
  }

  context.availableOutputs = availableOutputs;
  return newlySolved;
}

/**
 * Evaluates eco discovery conditions for the active sala.
 * When an eco condition becomes true and it wasn't already discovered,
 * marks it in `context.ecoState` and emits a log message.
 *
 * Returns an array of newly discovered eco IDs (empty if none).
 */
export function checkEcoDiscovery(context) {
  const { gameState, puzzleState, ecoState, salaId } = context;
  if (!ecoState || !salaId) return [];

  const ecos = getEcosForRoom(salaId);
  const newlyDiscovered = [];

  for (const eco of ecos) {
    if (ecoState[eco.id]?.discovered) continue;

    if (eco.discoveredWhen(gameState, puzzleState || {})) {
      ecoState[eco.id] = { discovered: true, discoveredAt: Date.now() };
      newlyDiscovered.push(eco.id);
      emit(context, `[ECO] "${eco.text}"`);
    }
  }

  return newlyDiscovered;
}

export function resolveActionWithResult(context, action, pulseFlags) {
  if (!context.metricsDelta) context.metricsDelta = {};

  const previousFirstMessage = context.actionLog[0];
  const comboResult = resolveItemCombo(context, action, pulseFlags);
  if (comboResult) return comboResult;

  // Increment metric for this card
  const metricKey = CARD_METRIC_MAP[action.card];
  if (metricKey) {
    context.metricsDelta[metricKey] = (context.metricsDelta[metricKey] || 0) + 1;
  }

  resolveAction(context, action, pulseFlags);
  checkPuzzleCompletion(context);

  const discoveredEcos = checkEcoDiscovery(context);
  if (discoveredEcos.length > 0) {
    context.metricsDelta.ecoCount = (context.metricsDelta.ecoCount || 0) + discoveredEcos.length;
  }

  resolveNarrativeConsequences(context);
  resolveExitOutcome(context);
  return context.actionLog[0] && context.actionLog[0] !== previousFirstMessage ? context.actionLog[0] : "Acción resuelta.";
}

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
