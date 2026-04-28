import { SALA1_ROOM_ID } from "../data/roomData.js";

const targetLabels = {
  // Sandbox
  door: "puerta",
  panel: "panel",
  sensor: "sensor",
  locker: "taquilla",
  electrical_box: "cuadro electrico",
  sports_gear: "material deportivo",
  // Sala 1
  window: "ventana",
  desk: "escritorio",
  paper_bin: "papelera",
  security_panel: "panel de seguridad",
  laser_grid: "cuadrícula láser",
  showcase: "vitrina",
  camera: "cámara",
  armored_door: "puerta acorazada",
};

const roleLabels = {
  empollon: "El Empollon",
  manitas: "La Manitas",
  guaperas: "El guaperas",
  bruto: "El guaperas",
  mistica: "La Mistica",
  gm: "Game Master",
};

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

// ---------------------------------------------------------------------------
// Sistema de alarma
// ---------------------------------------------------------------------------

export const alarmEffects = {
  0: { description: "normal", modifiers: [] },
  1: { description: "sospecha", modifiers: ["increaseFeedback", "minorDelay"] },
  2: { description: "alarma", modifiers: ["lockRandomObject", "increaseCameraSpeed", "restrictRepeatActions"] },
  3: { description: "contencion", modifiers: ["lockExitTemporarily", "forceAlternateGoal", "increaseSystemInterference"] },
};

export function updateAlarmLevel(alarmState) {
  const noise = alarmState?.noise ?? 0;
  if (noise >= 4) return 3;
  if (noise >= 2) return 2;
  if (noise >= 1) return 1;
  return 0;
}

export function applyAlarmEffects(_gameState) {
  // GM controls scene changes — alarm is only a metric.
  // Scene mutations are triggered explicitly from gmSceneControl, not here.
}

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
// Recomendaciones automáticas para el GM (Sala 1)
// ---------------------------------------------------------------------------

export function getAlarmRecommendations(gameState) {
  const level = gameState.alarmState?.level ?? 0;
  const flags = gameState.flags || {};
  const recommendations = [];

  if (level >= 1) {
    recommendations.push({
      id: "suggest_minor_suspicion",
      label: "Activar sospecha leve",
      reason: "Ruido detectado en la sala",
      recommendedWhen: "alarmState.level >= 1",
      possibleSceneEffects: ["camera_tracking", "system_interference"],
    });
  }

  if (level >= 2) {
    recommendations.push({
      id: "suggest_action_delay",
      label: "Aumentar tiempo de carga de acciones",
      reason: "La sala está en alarma activa",
      recommendedWhen: "alarmState.level >= 2",
      possibleSceneEffects: ["increase_action_load_time"],
    });
    recommendations.push({
      id: "suggest_red_light",
      label: "Activar luz roja de alarma",
      reason: "Alarma activa — presión visual para jugadores",
      recommendedWhen: "alarmState.level >= 2",
      possibleSceneEffects: ["red_light_overlay"],
    });
    recommendations.push({
      id: "suggest_lock_door",
      label: "Bloquear puerta temporalmente",
      reason: "Contención parcial — dificultar salida",
      recommendedWhen: "alarmState.level >= 2",
      possibleSceneEffects: ["door_temporarily_locked"],
    });
  }

  if (level >= 3) {
    recommendations.push({
      id: "suggest_containment",
      label: "Activar modo contención",
      reason: "Alarma máxima — la sala ha activado contención completa",
      recommendedWhen: "alarmState.level >= 3",
      possibleSceneEffects: ["containment_mode"],
    });
  }

  if (flags.photographed && !flags.camera_fooled) {
    recommendations.push({
      id: "suggest_camera_consequence",
      label: "Cámara captó movimiento sospechoso",
      reason: "Vitrina forzada con cámara activa",
      recommendedWhen: "photographed && !camera_fooled",
      possibleSceneEffects: ["camera_tracking"],
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTargetLabel(targetId) {
  return targetLabels[targetId] || targetId || "objetivo";
}

function getRoleLabel(roleId) {
  return roleLabels[roleId] || roleId || "Jugador";
}

function ensureAlarmState(gameState) {
  if (!gameState.alarmState || typeof gameState.alarmState !== "object") {
    gameState.alarmState = { level: 0, noise: 0, triggers: [] };
  }
}

function addAlarmNoise(gameState, noiseValue, trigger) {
  ensureAlarmState(gameState);
  gameState.alarmState.noise = (gameState.alarmState.noise || 0) + noiseValue;
  if (trigger) {
    gameState.alarmState.triggers = [...(gameState.alarmState.triggers || []), trigger];
  }
  gameState.alarmState.level = updateAlarmLevel(gameState.alarmState);
}

function setAlarmLevel(gameState, minLevel, trigger) {
  ensureAlarmState(gameState);
  gameState.alarmState.level = Math.max(gameState.alarmState.level, minLevel);
  if (trigger) {
    gameState.alarmState.triggers = [...(gameState.alarmState.triggers || []), trigger];
  }
}

// ---------------------------------------------------------------------------
// Lógica de Sala 1 — Despacho del Profesor
// ---------------------------------------------------------------------------

// applyActionLogicSala1 mutates gameState.hotspotStates, gameState.flags,
// gameState.discoveries, and gameState.alarmState directly.
// Returns the standard result descriptor shape.
function applyActionLogicSala1(action, gameState) {
  const { card, target } = action;
  const hs = gameState.hotspotStates || {};
  const flags = gameState.flags || {};
  const disc = gameState.discoveries || {};

  // Ensure nested objects exist on gameState
  if (!gameState.hotspotStates) gameState.hotspotStates = { ...hs };
  if (!gameState.flags) gameState.flags = { ...flags };
  if (!gameState.discoveries) gameState.discoveries = { ...disc };

  const roleLabel = getRoleLabel(action.role);
  const targetLabel = getTargetLabel(target);
  let message = `${roleLabel} usa ${card} sobre ${targetLabel}.`;
  let targetFeedback = message;

  // --- EMPOLLÓN ---
  if (card === "mirar_bien") {
    if (target === "desk") {
      gameState.discoveries.laser_code_known = true;
      gameState.discoveries.blank_exam_available = true;
      message = `${roleLabel} examina meticulosamente el escritorio. Encuentra la nota del sistema láser: clave 7391. También detecta una copia del examen disponible.`;
      targetFeedback = "Escritorio revisado: clave láser encontrada (7391) y copia del examen localizada.";
    } else if (target === "security_panel") {
      gameState.discoveries.panel_understood = true;
      message = `${roleLabel} analiza el panel de seguridad. Entiende el sistema y podría guiar un puenteo.`;
      targetFeedback = "Panel analizado: un experto en electrónica podría hacer el bypass.";
    } else {
      message = `${roleLabel} mira con atención ${targetLabel}. No encuentra nada nuevo.`;
      targetFeedback = `${targetLabel} revisado sin resultado adicional.`;
    }

  } else if (card === "consultar_apuntes") {
    if (target === "laser_grid") {
      gameState.discoveries.laser_protocol_known = true;
      message = `${roleLabel} consulta sus apuntes sobre sistemas láser. Entiende la lógica del protocolo.`;
      targetFeedback = "Protocolo láser comprendido: el sistema tiene una ventana de desactivación por código.";
    } else {
      message = `${roleLabel} consulta apuntes sobre ${targetLabel}. Sin información útil en sus notas.`;
      targetFeedback = `Apuntes consultados sobre ${targetLabel}: sin datos relevantes.`;
    }

  // --- MANITAS ---
  } else if (card === "puenteo_rapido") {
    if (target === "security_panel") {
      if (gameState.discoveries?.laser_code_known || gameState.discoveries?.panel_understood) {
        gameState.hotspotStates.laser_grid = "disabled";
        gameState.hotspotStates.showcase = "laser_disabled";
        gameState.hotspotStates.security_panel = "code_success";
        gameState.flags.usedBypass = true;
        message = `${roleLabel} hace un bypass rápido del panel de seguridad aprovechando el conocimiento previo. El láser se desactiva.`;
        targetFeedback = "Bypass exitoso: cuadrícula láser desactivada. La vitrina es accesible.";
      } else {
        gameState.hotspotStates.security_panel = "code_error";
        gameState.flags.usedBypass = true;
        gameState.failedAttempts = (gameState.failedAttempts || 0) + 1;
        setAlarmLevel(gameState, 2, "bad_bypass");
        message = `${roleLabel} intenta un bypass a ciegas en el panel de seguridad. ERROR. El intento queda registrado en el sistema.`;
        targetFeedback = "Bypass fallido: sin información previa. Alarma escalando.";
      }
    } else {
      message = `${roleLabel} intenta un bypass en ${targetLabel}. No hay circuito que puentear aquí.`;
      targetFeedback = `Puenteo rápido sobre ${targetLabel}: no aplicable.`;
    }

  } else if (card === "apanar") {
    if (target === "showcase") {
      if (hs.laser_grid === "disabled" || hs.laser_grid === "unstable") {
        gameState.hotspotStates.showcase = "open";
        message = `${roleLabel} apaña la vitrina con cuidado. Se abre sin hacer ruido.`;
        targetFeedback = "Vitrina abierta con habilidad. El examen está dentro.";
      } else {
        message = `${roleLabel} intenta apanar la vitrina, pero el láser bloquea el acceso.`;
        targetFeedback = "Vitrina inaccesible: el láser sigue activo.";
      }
    } else {
      message = `${roleLabel} intenta apanar ${targetLabel}. No hay nada que apanar aquí.`;
      targetFeedback = `Apanar sobre ${targetLabel}: sin efecto.`;
    }

  } else if (card === "desmontar") {
    if (target === "laser_grid") {
      gameState.hotspotStates.laser_grid = "disabled";
      gameState.hotspotStates.showcase = "laser_disabled";
      addAlarmNoise(gameState, 1, "laser_dismantled");
      message = `${roleLabel} desmonta físicamente partes de la cuadrícula láser. Hace algo de ruido, pero el láser queda desactivado.`;
      targetFeedback = "Cuadrícula láser desmontada: vitrina accesible. Algo de ruido generado.";
    } else {
      message = `${roleLabel} intenta desmontar ${targetLabel}. No tiene sentido hacerlo aquí.`;
      targetFeedback = `Desmontar sobre ${targetLabel}: sin efecto.`;
    }

  // --- GUAPERAS ---
  } else if (card === "a_lo_bestia") {
    if (target === "showcase") {
      if (hs.laser_grid === "active" || hs.laser_grid === "locked_laser_active") {
        gameState.hotspotStates.showcase = "broken";
        gameState.hotspotStates.camera = "photographed";
        gameState.flags.usedForce = true;
        gameState.flags.photographed = true;
        setAlarmLevel(gameState, 3, "showcase_broken_with_laser_active");
        message = `${roleLabel} rompe la vitrina de un golpe con el láser activo. La cámara lo capta todo. ALARMA MÁXIMA.`;
        targetFeedback = "Vitrina rota: examen accesible pero fotografiados. Alarma máxima activada.";
      } else {
        gameState.hotspotStates.showcase = "open";
        gameState.flags.usedForce = true;
        addAlarmNoise(gameState, 1, "showcase_forced");
        message = `${roleLabel} fuerza la vitrina de golpe. Hace ruido pero con el láser desactivado no hay alarma automática.`;
        targetFeedback = "Vitrina forzada: acceso conseguido con algo de ruido.";
      }
    } else if (target === "armored_door") {
      gameState.hotspotStates.armored_door = "forced";
      gameState.flags.usedForce = true;
      addAlarmNoise(gameState, 1, "door_forced");
      message = `${roleLabel} intenta forzar la puerta acorazada. Hace mucho ruido y apenas cede.`;
      targetFeedback = "Puerta acorazada: golpeada sin éxito. Ruido generado.";
    } else {
      message = `${roleLabel} arremete contra ${targetLabel}. Nada que romper aquí de forma útil.`;
      targetFeedback = `Fuerza bruta sobre ${targetLabel}: sin efecto relevante.`;
    }

  } else if (card === "empujar") {
    if (target === "showcase") {
      if (hs.laser_grid === "disabled" || hs.laser_grid === "unstable" || hs.showcase === "laser_disabled") {
        gameState.hotspotStates.showcase = "open";
        message = `${roleLabel} empuja suavemente la vitrina. Se abre sin problema.`;
        targetFeedback = "Vitrina empujada y abierta. El examen está disponible.";
      } else {
        message = `${roleLabel} intenta empujar la vitrina pero el láser bloquea el acceso.`;
        targetFeedback = "Vitrina inaccesible: láser activo.";
      }
    } else if (target === "armored_door") {
      if (gameState.flags?.examStolen) {
        gameState.hotspotStates.armored_door = "unlocked";
        gameState.flags.completeRoom = true;
        message = `${roleLabel} empuja la puerta acorazada con determinación. Con el examen en mano, la misión está completa.`;
        targetFeedback = "¡Puerta abierta! Salida conseguida. Misión completada.";
      } else {
        message = `${roleLabel} empuja la puerta acorazada. Está bloqueada. Necesitáis el examen primero.`;
        targetFeedback = "Puerta acorazada bloqueada: conseguid el examen antes de intentar salir.";
      }
    } else {
      message = `${roleLabel} empuja ${targetLabel}. Nada útil ocurre.`;
      targetFeedback = `Empujar sobre ${targetLabel}: sin efecto.`;
    }

  // --- MÍSTICA ---
  } else if (card === "esto_vibra_raro") {
    if (target === "camera") {
      gameState.discoveries.camera_cycle_known = true;
      message = `${roleLabel} percibe el ritmo de la cámara. Intuye su patrón de rotación.`;
      targetFeedback = "Cámara estudiada: el patrón de rotación se puede predecir o manipular.";
    } else if (target === "desk") {
      gameState.discoveries.desk_has_key_clue = true;
      message = `${roleLabel} siente que hay algo importante en el escritorio. Algo con números.`;
      targetFeedback = "Vibración del escritorio: hay una clave numérica oculta aquí.";
    } else {
      message = `${roleLabel} percibe energías en ${targetLabel}. Nada concluyente.`;
      targetFeedback = `Esto vibra raro sobre ${targetLabel}: sin información concreta.`;
    }

  } else if (card === "y_si") {
    if (target === "camera") {
      if (gameState.discoveries?.camera_cycle_known) {
        gameState.hotspotStates.camera = "fooled";
        gameState.flags.camera_fooled = true;
        message = `${roleLabel} aprovecha el conocimiento del ciclo de la cámara para confundirla en el momento justo.`;
        targetFeedback = "Cámara engañada: punto ciego aprovechado. No os grabará.";
      } else {
        message = `${roleLabel} intenta confundir la cámara pero sin conocer su patrón, el intento es aleatorio.`;
        targetFeedback = "Intento de engaño a la cámara: sin éxito. Necesitáis más información sobre su ciclo.";
      }
    } else if (target === "desk") {
      gameState.discoveries.laser_code_known = true;
      message = `${roleLabel} toca los papeles del escritorio y siente el número correcto. 7391. Aparece en su mente con claridad.`;
      targetFeedback = "Intuición del escritorio: clave láser obtenida (7391).";
    } else {
      message = `${roleLabel} proyecta posibilidades sobre ${targetLabel}. Las probabilidades no se alinean.`;
      targetFeedback = `Y si... sobre ${targetLabel}: sin resultado concreto esta vez.`;
    }

  } else if (card === "ritual_improvisado") {
    if (target === "laser_grid") {
      gameState.hotspotStates.laser_grid = "unstable";
      gameState.hotspotStates.showcase = "laser_disabled";
      addAlarmNoise(gameState, 1, "ritual_laser_interference");
      message = `${roleLabel} improvisa un ritual sobre la cuadrícula láser. Los haces se vuelven inestables y se desconectan brevemente. La vitrina queda accesible.`;
      targetFeedback = "Ritual sobre láser: cuadrícula inestable. Vitrina accesible por ahora.";
    } else {
      message = `${roleLabel} realiza un ritual improvisado sobre ${targetLabel}. Las energías no responden.`;
      targetFeedback = `Ritual improvisado sobre ${targetLabel}: sin efecto esta vez.`;
    }

  } else {
    message = `${roleLabel} usa ${card} sobre ${targetLabel}. Sin efecto definido para esta combinación en Sala 1.`;
    targetFeedback = `${card} sobre ${targetLabel}: no hay regla para esta combinación.`;
  }

  return { message, targetFeedback, generatesNoise: false, noiseValue: 0, noiseTrigger: null };
}

// ---------------------------------------------------------------------------
// Evaluación de resolución de Sala 1
// ---------------------------------------------------------------------------

export function evaluateRoomResolution(gameState) {
  const flags = gameState.flags || {};
  const alarm = gameState.alarmState || { level: 0 };

  if (!flags.examStolen) {
    return { level: "incomplete", activeFlags: flags, gmNotes: ["El examen no ha sido robado todavía."] };
  }

  const gmNotes = [];

  if (flags.replacedExam && alarm.level === 0 && !flags.photographed) {
    gmNotes.push("Resolución perfecta: examen sustituido, sin alarma, sin fotografías.");
    return { level: "optimal", activeFlags: flags, gmNotes };
  }

  if (flags.usedForce) gmNotes.push("El grupo usó fuerza bruta.");
  if (flags.photographed) gmNotes.push("La cámara captó movimiento sospechoso.");
  if (alarm.level >= 2) gmNotes.push(`Alarma en nivel ${alarm.level} al completar.`);
  if (flags.usedBypass && !flags.resolvedByMainPath) gmNotes.push("Bypass usado sin comprensión previa del sistema.");
  if (!flags.replacedExam) gmNotes.push("El examen no fue sustituido por una copia.");

  return { level: "degraded", activeFlags: flags, gmNotes };
}

// ---------------------------------------------------------------------------
// Perfil de grupo (Sala 1)
// ---------------------------------------------------------------------------

export function getGroupProfile(gameState) {
  const flags = gameState.flags || {};
  const disc = gameState.discoveries || {};
  const alarm = gameState.alarmState || { level: 0, noise: 0 };

  const scores = {
    analytical: 0,
    impulsive: 0,
    technical: 0,
    chaotic: 0,
  };

  // Analytical: discoveries via reading, analysis
  if (disc.laser_code_known && flags.resolvedByMainPath) scores.analytical += 2;
  if (disc.panel_understood) scores.analytical += 1;
  if (disc.laser_protocol_known) scores.analytical += 1;
  if (disc.camera_cycle_known) scores.analytical += 1;

  // Impulsive: force, bypasses without info, high alarm
  if (flags.usedForce) scores.impulsive += 3;
  if (flags.photographed) scores.impulsive += 1;
  if (alarm.level >= 3) scores.impulsive += 2;
  if ((gameState.failedAttempts || 0) >= 2) scores.impulsive += 1;

  // Technical: clean bypasses, dismantling, repair
  if (flags.usedBypass && flags.resolvedByMainPath === false && disc.panel_understood) scores.technical += 2;
  if (flags.usedBypass) scores.technical += 1;
  if (disc.laser_protocol_known) scores.technical += 1;

  // Chaotic: ritual, camera fooling without cycle knowledge, noise
  if (flags.camera_fooled) scores.chaotic += 2;
  if (alarm.noise >= 3) scores.chaotic += 2;
  if (disc.camera_cycle_known && flags.camera_fooled) {
    scores.chaotic -= 1; // methodical trickery — more technical
    scores.technical += 1;
  }

  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  const activeFlags = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  const gmNotes = [];
  if (dominant === "impulsive") gmNotes.push("Grupo impulsivo: recomendado activar contención si el GM quiere subir presión.");
  if (dominant === "analytical") gmNotes.push("Grupo analítico: han resuelto de forma metódica. Poca palanca dramática.");
  if (dominant === "chaotic") gmNotes.push("Grupo caótico: ruido e imprevisibilidad alta. Buena oportunidad para el GM de introducir consecuencias.");
  if (dominant === "technical") gmNotes.push("Grupo técnico: han explotado el sistema de forma inteligente.");

  return { dominantProfile: dominant, profileScores: scores, activeFlags, gmNotes };
}

// ---------------------------------------------------------------------------
// Lógica sandbox (original — conservar para compatibilidad)
// ---------------------------------------------------------------------------

function applyActionLogic(action) {
  const roleLabel = roleLabels[action.role] || action.role || "Jugador";
  const targetLabel = targetLabels[action.target] || action.target || "objetivo";
  const label = `${roleLabel} prueba ${action.card} sobre ${targetLabel}.`;
  return {
    message: `${label} Sandbox: accion registrada sin resolver puzzle.`,
    targetFeedback: "Ultima accion sandbox: sin efecto de puzzle.",
    generatesNoise: false,
    noiseValue: 0,
    noiseTrigger: null,
  };
}

// ---------------------------------------------------------------------------
// Pulse helpers (stubs)
// ---------------------------------------------------------------------------

export function buildPulseFlags() {
  return {};
}

export function resolveItemCombo() {
  return null;
}

export function checkPuzzleCompletion() {
  return [];
}

export function checkEcoDiscovery() {
  return [];
}

// ---------------------------------------------------------------------------
// Action resolver
// ---------------------------------------------------------------------------

export function resolveActionWithResult(context, action) {
  if (!context.metricsDelta) context.metricsDelta = {};

  // Metricas de equipo
  const metricKey = CARD_METRIC_MAP[action.card];
  if (metricKey) {
    context.metricsDelta[metricKey] = (context.metricsDelta[metricKey] || 0) + 1;
  }

  const isSala1 = context.salaId === SALA1_ROOM_ID;
  let result;

  if (isSala1) {
    // Sala 1: action logic mutates gameState directly (hotspotStates, flags, discoveries, alarmState)
    result = applyActionLogicSala1(action, context.gameState);
  } else {
    // Sandbox: old path, noise handled separately
    result = applyActionLogic(action, context);
    if (result.generatesNoise) {
      applyNoiseToAlarm(
        context.gameState,
        result.noiseValue ?? 1,
        result.noiseTrigger ?? action.card,
      );
    }
  }

  // applyAlarmEffects is now a no-op for scene changes — GM controls those
  applyAlarmEffects(context.gameState);

  // Feedback y log
  context.targetFeedback[action.target] = result.targetFeedback;
  context.lastRoleDebug = result.message;
  context.actionLog.unshift(result.message);

  return result.message;
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
