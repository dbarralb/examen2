export const boardHotspots = [
  { id: "hotspot_1", label: "Hotspot1", x: 20, y: 38, w: 9, h: 9, hotspotClass: "generico" },
  { id: "hotspot_2", label: "Hotspot2", x: 48, y: 38, w: 9, h: 9, hotspotClass: "generico" },
  { id: "hotspot_3", label: "Hotspot3", x: 76, y: 38, w: 9, h: 9, hotspotClass: "generico" },
];

export const playerBoardSrc = {
  empollon: "/assets/boards/placeholder_empollon.svg",
  manitas:  "/assets/boards/placeholder_manitas.svg",
  guaperas: "/assets/boards/placeholder_guaperas.svg",
  mistica:  "/assets/boards/placeholder_mistica.svg",
};

export const cards = [
  { id: "mirar_bien", label: "mirar_bien", roles: ["empollon"], image: "/assets/Pantalla de juego/Actions/mirar_bien.png" },
  { id: "consultar_apuntes", label: "consultar_apuntes", roles: ["empollon"], image: "/assets/Pantalla de juego/Actions/consultar_apuntes.png" },
  { id: "apanar", label: "apanar", roles: ["manitas"], image: "/assets/Pantalla de juego/Actions/apanar.png" },
  { id: "puenteo_rapido", label: "puenteo_rapido", roles: ["manitas"], image: "/assets/Pantalla de juego/Actions/puenteo_rapido.png" },
  { id: "desmontar", label: "desmontar", roles: ["manitas"], image: "/assets/Pantalla de juego/Actions/desmontar.png" },
  { id: "a_lo_bestia", label: "a_lo_bestia", roles: ["guaperas"], image: "/assets/Pantalla de juego/Actions/a_lo_bestia.png" },
  { id: "empujar", label: "empujar", roles: ["guaperas"], image: "/assets/Pantalla de juego/Actions/empujar.png" },
  { id: "y_si", label: "y_si", roles: ["mistica"], image: "/assets/Pantalla de juego/Actions/y_si.png" },
  { id: "esto_vibra_raro", label: "esto_vibra_raro", roles: ["mistica"], image: "/assets/Pantalla de juego/Actions/esto_vibra_raro.png" },
  { id: "ritual_improvisado", label: "ritual_improvisado", roles: ["mistica"], image: "/assets/Pantalla de juego/Actions/ritual_improvisado.png" },
];

export const targets = [
  // --- Sandbox ---
  { id: "door", label: "puerta", stateKey: "doorState", hotspotClass: "puerta", x: 82, y: 42, w: 5, h: 8 },
  { id: "panel", label: "panel", stateKey: "panelState", hotspotClass: "informacion", x: 66, y: 36, w: 5, h: 8 },
  { id: "sensor", label: "sensor", stateKey: "sensorState", hotspotClass: "sensor", x: 50, y: 18, w: 5, h: 8 },
  { id: "locker", label: "taquilla", stateKey: "lockerState", hotspotClass: "contenedor", x: 18, y: 42, w: 5, h: 8 },
  { id: "electrical_box", label: "cuadro electrico", stateKey: "electricalBoxState", hotspotClass: "contenedor", x: 35, y: 32, w: 5, h: 8 },
  { id: "sports_gear", label: "material deportivo", stateKey: "sportsGearState", hotspotClass: "generico", x: 48, y: 68, w: 5, h: 8 },
  // --- Sala 1: Despacho del Profesor ---
  // hotspotId means state is read from gameState.hotspotStates[hotspotId]
  { id: "window", label: "ventana", hotspotId: "window", hotspotClass: "puerta", x: 10, y: 20, w: 6, h: 10 },
  { id: "desk", label: "escritorio", hotspotId: "desk", hotspotClass: "contenedor", x: 42, y: 52, w: 10, h: 8 },
  { id: "paper_bin", label: "papelera", hotspotId: "paper_bin", hotspotClass: "contenedor", x: 58, y: 72, w: 5, h: 7 },
  {
    id: "security_panel",
    label: "panel de seguridad",
    hotspotId: "security_panel",
    hotspotClass: "dispositivo",
    x: 74, y: 32, w: 6, h: 9,
    deviceConfig: {
      deviceName: "PANEL-SYS-TEMA",
      bootLines: [
        "Localizando interfaz de seguridad...",
        "Protocolo de acceso: CIFRADO",
        "Bypass de certificado en curso...",
        "Interceptando señal de control  ▒▒▒▒▒▒▒▒▒▒",
        "Interceptando señal de control  █████▒▒▒▒▒",
        "Interceptando señal de control  ██████████",
        "Sistema de autenticación: expuesto.",
        "Consola de comandos disponible.",
        "Advertencia: cada intento fallido queda registrado.",
      ],
      commands: [
        {
          name: "seguridad",
          description: "Acceder al menú de control del sistema de seguridad.",
        },
        {
          name: "status",
          description: "Estado del sistema láser y la vitrina.",
          response: ["LASER-7: ACTIVO", "Acceso a vitrina: BLOQUEADO", "Intentos de autenticación: registrando."],
        },
      ],
    },
  },
  { id: "laser_grid", label: "cuadrícula láser", hotspotId: "laser_grid", hotspotClass: "sensor", x: 52, y: 28, w: 7, h: 9 },
  { id: "showcase", label: "vitrina", hotspotId: "showcase", hotspotClass: "contenedor", x: 68, y: 48, w: 8, h: 12 },
  { id: "camera", label: "cámara de vigilancia", hotspotId: "camera", hotspotClass: "sensor", x: 82, y: 14, w: 5, h: 7 },
  { id: "armored_door", label: "puerta acorazada", hotspotId: "armored_door", hotspotClass: "puerta", x: 85, y: 42, w: 6, h: 14 },
];

export const objectImages = {
  panel: {
    active: "/assets/objects/panel_active.png",
    understood: "/assets/objects/panel_understood.png",
    tampered: "/assets/objects/panel_tampered.png",
  },
  sensor: {
    active: "/assets/objects/sensor_active.png",
    pattern_detected: "/assets/objects/sensor_pattern_detected.png",
    fooled: "/assets/objects/sensor_fooled.png",
    disabled: "/assets/objects/sensor_disabled.png",
  },
  locker: {
    closed: "/assets/objects/locker_closed.png",
    clean_open_complete: "/assets/objects/locker_clean_open_note_complete.png",
    broken_open_partial: "/assets/objects/locker_broken_open_note_partial.png",
  },
  electrical_box: {
    idle: "/assets/objects/electrical_box_idle.png",
  },
  sports_gear: {
    idle: "/assets/objects/sports_gear_idle.png",
  },
  alarm: {
    on: "/assets/objects/alarm_active_overlay.png",
  },
};

export const targetItems = {
  // --- Sandbox ---
  door: [],
  panel: [
    { id: "panel_note", label: "Nota sandbox", type: "readable", hotspot: "panel", content: "Placeholder de contenido. Sustituir cuando el puzzle este definido." },
  ],
  sensor: [],
  locker: [
    { id: "locker_note", label: "Nota sandbox", type: "readable", hotspot: "locker", content: "Placeholder de contenido. Sustituir cuando el puzzle este definido." },
    { id: "locker_tool", label: "Objeto sandbox", type: "usable", hotspot: "locker" },
  ],
  electrical_box: [
    { id: "wiring_diagram", label: "Esquema sandbox", type: "readable", hotspot: "electrical_box", content: "Placeholder de contenido. Sustituir cuando el puzzle este definido." },
  ],
  sports_gear: [],
  // --- Sala 1: Despacho del Profesor ---
  window: [],
  desk: [
    {
      id: "laser_week_note",
      label: "Nota semanal del sistema láser",
      type: "readable",
      hotspot: "desk",
      content: "La clave del sistema láser cambia cada semana. Semana 3: 7391.",
      grantsDiscovery: ["laser_code_known"],
    },
    {
      id: "blank_exam_copy",
      label: "Copia del examen en blanco",
      type: "usable",
      hotspot: "desk",
      description: "Una copia sin rellenar, idéntica en formato al examen original.",
      grantsFlagOnPickup: "copyInInventory",
    },
  ],
  paper_bin: [
    {
      id: "crumpled_password_postit",
      label: "Post-it arrugado",
      type: "readable",
      hotspot: "paper_bin",
      content: "Arrugado y difícil de leer. Solo se distingue el final: ...91.",
      grantsDiscovery: ["laser_code_partial_confirmed"],
    },
  ],
  security_panel: [],
  laser_grid: [],
  showcase: [
    {
      id: "original_exam",
      label: "Examen original",
      type: "usable",
      hotspot: "showcase",
      description: "El examen de ciencias con las respuestas preparadas.",
      requiresState: { showcase: ["open", "broken"] },
      grantsFlagOnPickup: "examStolen",
    },
  ],
  camera: [],
  armored_door: [],
};

export function getTargetItems(targetId) {
  return targetItems[targetId] || [];
}

export function getItem(itemId) {
  for (const items of Object.values(targetItems)) {
    const found = items.find((item) => item.id === itemId);
    if (found) return found;
  }
  return null;
}

export function getCard(cardId) {
  return cards.find((card) => card.id === cardId);
}

export function getTarget(targetId) {
  return targets.find((target) => target.id === targetId);
}

export function getTargetState(target, gameState) {
  // Sala 1 hotspots store state in gameState.hotspotStates[hotspotId]
  if (target.hotspotId) {
    return gameState.hotspotStates?.[target.hotspotId] || "unknown";
  }
  return gameState[target.stateKey] || "unknown";
}

export function getTargetImage(target, gameState) {
  const state = getTargetState(target, gameState);

  if (target.id === "sensor" && gameState.sensorPatternDetected && gameState.sensorState === "active") {
    return objectImages.sensor.pattern_detected;
  }

  if (target.id === "locker" && gameState.lockerState === "clean_open" && gameState.noteState === "complete") {
    return objectImages.locker.clean_open_complete;
  }

  if (target.id === "locker" && gameState.lockerState === "broken_open" && gameState.noteState === "partial") {
    return objectImages.locker.broken_open_partial;
  }

  return objectImages[target.id] ? objectImages[target.id][state] : "";
}

export function getContainerOpenState(targetId, gameState) {
  const target = targets.find((item) => item.id === targetId);
  if (target?.hotspotClass !== "contenedor") return null;

  // Sala 1 containers: open based on hotspotStates
  if (target.hotspotId) {
    const state = gameState.hotspotStates?.[target.hotspotId] || "unknown";
    // desk and paper_bin are always accessible for searching
    if (targetId === "desk" || targetId === "paper_bin") return true;
    // showcase opens when laser is disabled or it's broken
    if (targetId === "showcase") return state === "open" || state === "broken" || state === "laser_disabled" || state === "replaced";
    return true;
  }

  if (targetId === "locker") {
    const state = gameState.lockerState || "unknown";
    return state === "idle" || state === "clean_open" || state === "broken_open";
  }

  return true;
}

export function getTargetStateLabel(target, gameState) {
  if (target.id === "locker" && gameState.noteState !== "hidden") {
    return `${getTargetState(target, gameState)} / nota: ${gameState.noteState}`;
  }

  if (target.id === "door" && gameState.doorPrepared) {
    return `${getTargetState(target, gameState)} / preparada`;
  }

  if (target.id === "sensor" && gameState.sensorPatternDetected && gameState.sensorState === "active") {
    return "active / patron detectado";
  }

  // Sala 1: add flag info to relevant hotspot labels
  if (target.hotspotId) {
    const state = getTargetState(target, gameState);
    const flags = gameState.flags || {};
    if (target.id === "showcase" && flags.examStolen) return `${state} / examen_robado`;
    if (target.id === "security_panel" && (gameState.discoveries?.laser_code_known)) return `${state} / codigo_conocido`;
    if (target.id === "camera" && flags.camera_fooled) return `${state} / engañada`;
    return state;
  }

  return getTargetState(target, gameState);
}
