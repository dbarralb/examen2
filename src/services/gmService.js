import { firebaseGet, firebaseGetWithEtag, firebasePatch, firebasePut, firebasePutIfMatch } from "./firebaseClient.js";
import { generateSessionAccessCode, getOrCreateClientId, createId } from "./clientIdentity.js";
import { buildInitialRemoteState } from "./remoteState.js";
import { storeSessionCode } from "./sessionAccess.js";

export async function getRemoteState() {
  const remoteState = await firebaseGet("");

  if (remoteState) {
    return remoteState;
  }

  const initialState = buildInitialRemoteState("role_select");
  await firebasePut("", initialState);
  return initialState;
}

export async function startGame() {
  const now = Date.now();
  const accessCode = generateSessionAccessCode();
  const gameTimer = {
    status: "idle",
    startedAt: null,
    elapsedBeforeStartMs: 0,
  };
  const remoteState = await getRemoteState();
  const nextLog = [
    `GM abre el lobby. Codigo de sesion: ${accessCode}. ${new Date().toLocaleTimeString()}`,
    ...normalizeActionLog(remoteState.actionLog),
  ];

  storeSessionCode(accessCode);
  await firebasePatch("session", {
    status: "role_select",
    accessCode,
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

export async function resetGame() {
  const initialState = buildInitialRemoteState("role_select");
  initialState.actionLog = [
    `GM resetea la partida. Volvemos a seleccion de rol. ${new Date().toLocaleTimeString()}`,
    "Sistema listo. Selecciona carta y target para encolar una accion.",
  ];

  await firebasePut("", initialState);
  return initialState;
}

export async function forceStartDebugGame() {
  const remoteState = await getRemoteState();
  const lobby = remoteState.lobby || {};
  const readyClaims = Object.values(lobby.roleClaims || {}).filter(Boolean);

  if (remoteState.session?.status === "in_game") {
    return getRemoteState();
  }

  if (readyClaims.length < 1) {
    throw new Error("Necesitas al menos un jugador con rol confirmado.");
  }

  const now = Date.now();
  const { data: session, etag } = await firebaseGetWithEtag("session");
  const result = await firebasePutIfMatch("session", {
    ...(session || {}),
    status: "in_game",
    gameTimer: {
      status: "running",
      startedAt: now,
      elapsedBeforeStartMs: 0,
    },
    debugForcedStart: true,
    debugForcedStartAt: now,
    updatedAt: now,
  }, etag);

  if (!result.ok) {
    throw new Error("La sesion cambio durante el forzado. Reintentalo.");
  }

  await firebasePut("actionLog", [
    `DEBUG GM fuerza inicio con ${readyClaims.length} jugador(es). ${new Date().toLocaleTimeString()}`,
    ...normalizeActionLog(remoteState.actionLog),
  ]);

  return getRemoteState();
}

export async function enqueueDebugRandomActions(queuedActions, allCards, allTargets, allRoles) {
  const rolesWithActions = new Set(queuedActions.map((a) => a.role));
  const rolesWithout = allRoles.filter((r) => !rolesWithActions.has(r.id));

  if (rolesWithout.length === 0) {
    return 0;
  }

  const now = Date.now();
  const patches = {};

  for (const role of rolesWithout) {
    const roleCards = allCards.filter((c) => c.roles.includes(role.id));

    if (!roleCards.length) {
      continue;
    }

    const card = roleCards[Math.floor(Math.random() * roleCards.length)];
    const target = allTargets[Math.floor(Math.random() * allTargets.length)];
    const id = createId();
    patches[`queuedActions/${id}`] = { id, card: card.id, role: role.id, target: target.id, status: "queued", loadedAt: now };
    patches[`lastRoleActions/${role.id}`] = { card: card.id, role: role.id, target: target.id, text: "esperando pulso", createdAt: now };
  }

  await firebasePatch("", patches);
  return rolesWithout.length;
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
