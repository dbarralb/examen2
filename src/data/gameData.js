export const cards = [
  { id: "mirar_bien", label: "mirar_bien", roles: ["empollon"], image: "/assets/actions/Mirar_bien_accion.png" },
  { id: "consultar_apuntes", label: "consultar_apuntes", roles: ["empollon"], image: "/assets/actions/Consultar_apuntes_accion.png" },
  { id: "apañar", label: "apañar", roles: ["manitas"], image: "/assets/actions/apanar.png" },
  { id: "puenteo_rapido", label: "puenteo_rapido", roles: ["manitas"], image: "/assets/actions/puenteo_rapido.png" },
  { id: "desmontar", label: "desmontar", roles: ["manitas"], image: "/assets/actions/desmontar.png" },
  { id: "a_lo_bestia", label: "a_lo_bestia", roles: ["guaperas"], image: "/assets/actions/a_lo_bestia.png" },
  { id: "empujar", label: "empujar", roles: ["guaperas"], image: "/assets/actions/empujar.png" },
  { id: "y_si", label: "y_si", roles: ["mistica"], image: "/assets/actions/y_si.png" },
  { id: "esto_vibra_raro", label: "esto_vibra_raro", roles: ["mistica"], image: "/assets/actions/esto_vibra_raro.png" },
  { id: "ritual_improvisado", label: "ritual_improvisado", roles: ["mistica"], image: "/assets/actions/ritual_improvisado.png" },
];

export const targets = [
  { id: "door", label: "puerta", stateKey: "doorState", x: 82, y: 42, w: 5, h: 8 },
  { id: "panel", label: "panel", stateKey: "panelState", x: 66, y: 36, w: 5, h: 8 },
  { id: "sensor", label: "sensor", stateKey: "sensorState", x: 50, y: 18, w: 5, h: 8 },
  { id: "locker", label: "taquilla", stateKey: "lockerState", x: 18, y: 42, w: 5, h: 8 },
  { id: "electrical_box", label: "cuadro eléctrico", stateKey: "electricalBoxState", x: 35, y: 32, w: 5, h: 8 },
  { id: "sports_gear", label: "material deportivo", stateKey: "sportsGearState", x: 48, y: 68, w: 5, h: 8 },
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

export function getTargetStateLabel(target, gameState) {
  if (target.id === "locker" && gameState.noteState !== "hidden") {
    return `${getTargetState(target, gameState)} / nota: ${gameState.noteState}`;
  }

  if (target.id === "door" && gameState.doorPrepared) {
    return `${getTargetState(target, gameState)} / preparada`;
  }

  if (target.id === "sensor" && gameState.sensorPatternDetected && gameState.sensorState === "active") {
    return "active / patrón detectado";
  }

  return getTargetState(target, gameState);
}
