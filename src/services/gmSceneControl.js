import { firebaseGet, firebasePatch } from "./firebaseClient.js";

// ---------------------------------------------------------------------------
// Efectos de escena disponibles para el GM
// Ninguno se activa automáticamente. El GM los detona desde su panel.
// ---------------------------------------------------------------------------

export const gmSceneEffects = [
  {
    id: "camera_tracking",
    label: "Cámara en seguimiento",
    description: "La camara empieza a seguir movimientos dentro del almacen.",
    suggestedAlarmLevel: 1,
    targetStates: { camera: "tracking" },
  },
  {
    id: "red_light_overlay",
    label: "Luz roja de alarma",
    description: "Activa overlay visual de alarma roja en la pantalla de los jugadores.",
    suggestedAlarmLevel: 2,
    sceneOverlay: "alarm_red",
  },
  {
    id: "increase_action_load_time",
    label: "Aumentar tiempo de carga",
    description: "Los jugadores tardan más en cargar acciones. Representa interferencia del sistema.",
    suggestedAlarmLevel: 2,
    timingModifier: { actionLoadTimeMultiplier: 1.25 },
  },
  {
    id: "exit_temporarily_locked",
    label: "Bloquear salida temporalmente",
    description: "La salida queda bloqueada por contencion hasta que el GM lo retire.",
    suggestedAlarmLevel: 2,
    targetStates: { panel_salida: "blocked_by_alarm" },
  },
  {
    id: "system_interference",
    label: "Interferencia del sistema",
    description: "Añade mensajes de error y glitches visuales en la UI de los jugadores.",
    suggestedAlarmLevel: 2,
    uiModifier: "system_interference",
  },
  {
    id: "containment_mode",
    label: "Modo contención",
    description: "El almacen pasa a contencion total. El objetivo puede mutar a escapar con lo conseguido.",
    suggestedAlarmLevel: 3,
    sceneVariant: "containment",
  },
];

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function normalizeSceneState(raw) {
  // Firebase strips empty arrays — always normalize to safe defaults.
  return {
    activeVariant: raw?.activeVariant || "normal",
    activeEffects: Array.isArray(raw?.activeEffects) ? raw.activeEffects : [],
    history: Array.isArray(raw?.history) ? raw.history : [],
  };
}

async function readGmSceneState() {
  const gameState = await firebaseGet("gameState");
  return normalizeSceneState(gameState?.gmSceneState);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export async function activateSceneEffect(effectId) {
  const current = await readGmSceneState();
  if (current.activeEffects.includes(effectId)) return current;

  const next = {
    ...current,
    activeEffects: [...current.activeEffects, effectId],
  };
  await firebasePatch("gameState", { gmSceneState: next });
  return next;
}

export async function clearSceneEffect(effectId) {
  const current = await readGmSceneState();
  const next = {
    ...current,
    activeEffects: current.activeEffects.filter((id) => id !== effectId),
  };
  await firebasePatch("gameState", { gmSceneState: next });
  return next;
}

export async function setSceneVariant(variantId) {
  const current = await readGmSceneState();
  const next = { ...current, activeVariant: variantId };
  await firebasePatch("gameState", { gmSceneState: next });
  return next;
}

export async function logGmIntervention(effectId, reason = "") {
  const current = await readGmSceneState();
  const entry = { effectId, reason, createdAt: Date.now() };
  const next = {
    ...current,
    history: [...(current.history || []), entry].slice(-20), // keep last 20
  };
  await firebasePatch("gameState", { gmSceneState: next });
  return next;
}

export async function toggleSceneEffect(effectId, reason = "") {
  const current = await readGmSceneState();
  if (current.activeEffects.includes(effectId)) {
    return clearSceneEffect(effectId);
  }
  await logGmIntervention(effectId, reason);
  return activateSceneEffect(effectId);
}
