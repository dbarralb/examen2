import { firebaseGet, firebasePatch, firebasePut } from "./firebaseClient.js";
import { generateSessionAccessCode, getOrCreateClientId } from "./clientIdentity.js";
import { buildInitialRemoteState } from "./remoteState.js";
import { storeSessionCode } from "./sessionAccess.js";

export async function getRemoteState() {
  const remoteState = await firebaseGet("");

  if (remoteState) {
    return remoteState;
  }

  const initialState = buildInitialRemoteState("role_select");
  await firebasePatch("", initialState);
  return initialState;
}

export async function startGame() {
  const now = Date.now();
  const accessCode = generateSessionAccessCode();
  const playerCodes = {
    jugador1: generateSessionAccessCode(),
    jugador2: generateSessionAccessCode(),
    jugador3: generateSessionAccessCode(),
    jugador4: generateSessionAccessCode(),
  };
  const gameTimer = {
    status: "idle",
    startedAt: null,
    elapsedBeforeStartMs: 0,
  };
  const remoteState = await getRemoteState();
  const nextLog = [
    `GM abre el lobby. Codigo GM: ${accessCode}. ${new Date().toLocaleTimeString()}`,
    ...normalizeActionLog(remoteState.actionLog),
  ];

  storeSessionCode(accessCode);
  await firebasePatch("session", {
    status: "role_select",
    accessCode,
    playerCodes,
    gmClientId: getOrCreateClientId(),
    gameTimer,
    updatedAt: now,
  });
  await firebasePut("lobby", {
    players: {},
    roleClaims: {},
    countdownStartedAt: null,
    updatedAt: now,
  });
  await firebasePut("actionLog", nextLog);

  return getRemoteState();
}

export async function forceStartGameWithReadyPlayers() {
  const now = Date.now();
  const remoteState = await getRemoteState();
  const roleClaims = remoteState?.lobby?.roleClaims || {};
  const readyClaims = Object.values(roleClaims).filter(Boolean);

  if (readyClaims.length < 1) {
    throw new Error("Necesitas al menos 1 jugador preparado para iniciar.");
  }

  const session = remoteState?.session || {};
  const nextLog = [
    `GM inicia partida con ${readyClaims.length} jugador(es) preparado(s). ${new Date().toLocaleTimeString()}`,
    ...normalizeActionLog(remoteState.actionLog),
  ];

  await firebasePatch("session", {
    ...session,
    status: "in_game",
    gmClientId: session.gmClientId || getOrCreateClientId(),
    gameTimer: {
      status: "running",
      startedAt: now,
      elapsedBeforeStartMs: 0,
    },
    updatedAt: now,
  });
  await firebasePut("actionLog", nextLog);

  return getRemoteState();
}

export async function resetGame() {
  const remoteState = await getRemoteState();
  const initialState = buildInitialRemoteState("role_select");
  initialState.hotspotOverrides = remoteState?.hotspotOverrides || {};
  initialState.actionLog = [
    `GM resetea la partida. Volvemos a seleccion de rol. ${new Date().toLocaleTimeString()}`,
    "Sistema listo. Selecciona carta y target para encolar una accion.",
  ];

  await firebasePatch("", initialState);
  return initialState;
}

function normalizeActionLog(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return Object.values(value).filter(Boolean);
}
