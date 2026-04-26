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

// Hotspot classes: "contenedor" | "puerta" | "sensor" | "información" | "genérico"
export const targets = [
  { id: "door", label: "puerta", stateKey: "doorState", hotspotClass: "puerta", x: 82, y: 42, w: 5, h: 8 },
  { id: "panel", label: "panel", stateKey: "panelState", hotspotClass: "información", x: 66, y: 36, w: 5, h: 8 },
  { id: "sensor", label: "sensor", stateKey: "sensorState", hotspotClass: "sensor", x: 50, y: 18, w: 5, h: 8 },
  { id: "locker", label: "taquilla", stateKey: "lockerState", hotspotClass: "contenedor", x: 18, y: 42, w: 5, h: 8 },
  { id: "electrical_box", label: "cuadro electrico", stateKey: "electricalBoxState", hotspotClass: "contenedor", x: 35, y: 32, w: 5, h: 8 },
  { id: "sports_gear", label: "material deportivo", stateKey: "sportsGearState", hotspotClass: "genérico", x: 48, y: 68, w: 5, h: 8 },

  // ── Hórus (Sala 4) targets ──
  { id: "h_data_terminal", label: "terminal de datos", stateKey: "hDataTerminalState", hotspotClass: "información", x: 30, y: 30, w: 5, h: 8 },
  { id: "h_archive", label: "archivo sellado", stateKey: "hArchiveState", hotspotClass: "contenedor", x: 55, y: 45, w: 5, h: 8 },
  { id: "h_memory_node", label: "nodo de memoria", stateKey: "hMemoryNodeState", hotspotClass: "sensor", x: 40, y: 20, w: 5, h: 8 },
  { id: "h_decision_panel", label: "panel de decisión", stateKey: "hDecisionPanelState", hotspotClass: "información", x: 50, y: 35, w: 5, h: 8 },
  { id: "h_containment", label: "puerta de contención", stateKey: "hContainmentState", hotspotClass: "puerta", x: 75, y: 40, w: 5, h: 8 },
  { id: "h_relay", label: "relé de señal", stateKey: "hRelayState", hotspotClass: "sensor", x: 25, y: 55, w: 5, h: 8 },
  { id: "h_projector", label: "proyector holográfico", stateKey: "hProjectorState", hotspotClass: "información", x: 60, y: 25, w: 5, h: 8 },
  { id: "h_core_access", label: "acceso al núcleo", stateKey: "hCoreAccessState", hotspotClass: "puerta", x: 80, y: 50, w: 5, h: 8 },

  // ── Sala 5 targets ──
  { id: "s5_merge_console", label: "consola de integración", stateKey: "s5MergeConsoleState", hotspotClass: "información", x: 35, y: 30, w: 5, h: 8 },
  { id: "s5_firewall", label: "cortafuegos", stateKey: "s5FirewallState", hotspotClass: "sensor", x: 50, y: 20, w: 5, h: 8 },
  { id: "s5_exile_gate", label: "puerta de expulsión", stateKey: "s5ExileGateState", hotspotClass: "puerta", x: 70, y: 45, w: 5, h: 8 },
  { id: "s5_mask_generator", label: "generador de máscara", stateKey: "s5MaskGeneratorState", hotspotClass: "contenedor", x: 40, y: 50, w: 5, h: 8 },
  { id: "s5_exam_terminal", label: "terminal del Examen", stateKey: "s5ExamTerminalState", hotspotClass: "información", x: 55, y: 35, w: 5, h: 8 },
  { id: "s5_truth_archive", label: "archivo de verdad", stateKey: "s5TruthArchiveState", hotspotClass: "contenedor", x: 25, y: 40, w: 5, h: 8 },
  { id: "s5_final_door", label: "puerta final", stateKey: "s5FinalDoorState", hotspotClass: "puerta", x: 80, y: 42, w: 5, h: 8 },
  { id: "s5_codex_reader", label: "lector del Codex", stateKey: "s5CodexReaderState", hotspotClass: "información", x: 45, y: 60, w: 5, h: 8 },
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

// Items contained inside each hotspot object (up to 6 per target).
// type "readable" → clicking opens a content modal and marks the item as seen.
// type "usable"   → shows hand icon; can be dragged to player inventory slots.
export const targetItems = {
  door: [],
  panel: [
    { id: "panel_manual", label: "Manual técnico", type: "readable", hotspot: "panel", content: "Protocolo 7-B: secuencia de bypass en caso de emergencia. Consultar con el técnico autorizado." },
  ],
  sensor: [],
  locker: [
    { id: "locker_note", label: "Nota", type: "readable", hotspot: "locker", content: "Contenido por definir." },
    { id: "locker_lockpick", label: "Ganzúa", type: "usable", hotspot: "locker" },
  ],
  electrical_box: [
    { id: "wiring_diagram", label: "Esquema eléctrico", type: "readable", hotspot: "electrical_box", content: "Diagrama de cableado. Circuito principal: rojo+negro. Bypass: puente entre A3 y B7." },
  ],
  sports_gear: [],
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

/**
 * Returns null if the target is not a container.
 * Returns true if it's an open container, false if closed.
 */
export function getContainerOpenState(targetId, gameState) {
  const target = targets.find((t) => t.id === targetId);
  if (target?.hotspotClass !== "contenedor") return null;

  if (targetId === "locker") {
    const s = gameState.lockerState || "unknown";
    return s === "clean_open" || s === "broken_open";
  }

  // electrical_box and any future containers without a locked state are always open
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

  return getTargetState(target, gameState);
}
