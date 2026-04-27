const targetLabels = {
  door: "puerta",
  panel: "panel",
  sensor: "sensor",
  locker: "taquilla",
  electrical_box: "cuadro electrico",
  sports_gear: "material deportivo",
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

function getTargetLabel(targetId) {
  return targetLabels[targetId] || targetId || "objetivo";
}

function getRoleLabel(roleId) {
  return roleLabels[roleId] || roleId || "Jugador";
}

function formatActionLabel(action) {
  return `${getRoleLabel(action.role)} prueba ${action.card} sobre ${getTargetLabel(action.target)}.`;
}

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

export function resolveActionWithResult(context, action) {
  if (!context.metricsDelta) context.metricsDelta = {};

  const metricKey = CARD_METRIC_MAP[action.card];
  if (metricKey) {
    context.metricsDelta[metricKey] = (context.metricsDelta[metricKey] || 0) + 1;
  }

  const message = `${formatActionLabel(action)} Sandbox: accion registrada sin resolver puzzle.`;
  context.targetFeedback[action.target] = "Ultima accion sandbox: sin efecto de puzzle.";
  context.lastRoleDebug = message;
  context.actionLog.unshift(message);
  return message;
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
