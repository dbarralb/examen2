import { getLobbyRoles } from "../data/roles.js";
import { normalizeRoleId } from "../data/roles.js";
import { getOrCreateClientId } from "./clientIdentity.js";
import { firebaseGet, firebaseGetWithEtag, firebasePatch, firebasePut, firebasePutIfMatch } from "./firebaseClient.js";
import { getStoredSessionCode } from "./sessionAccess.js";

export const LOBBY_COUNTDOWN_MS = 5000;
export const PLAYER_NAME_STORAGE_KEY = "elExamen2.playerName";

export function getStoredPlayerName() {
  try {
    return window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

export function storePlayerName(name) {
  try {
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, String(name || ""));
  } catch (error) {
    // Private browsing can block localStorage; Firebase remains the source of truth.
  }
}

export function createInitialLobbyState() {
  return {
    players: {},
    roleClaims: {},
    countdownStartedAt: null,
    updatedAt: Date.now(),
  };
}

export async function getLobbySnapshot() {
  const remoteState = await firebaseGet("");
  return {
    remoteState: remoteState || {},
    lobby: normalizeLobby(remoteState?.lobby),
  };
}

export function normalizeLobby(lobby) {
  return {
    players: lobby?.players || {},
    roleClaims: lobby?.roleClaims || {},
    countdownStartedAt: lobby?.countdownStartedAt || null,
    updatedAt: lobby?.updatedAt || null,
  };
}

export function getOrderedPlayers(players = {}) {
  return Object.values(players)
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.joinedAt || 0;
      const bTime = b.joinedAt || 0;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return String(a.clientId || "").localeCompare(String(b.clientId || ""));
    });
}

export function getPlayerDisplayName(player, players = {}) {
  if (!player) {
    return "";
  }

  if (player.customName) {
    return player.customName;
  }

  const index = getOrderedPlayers(players).findIndex((item) => item.clientId === player.clientId);
  return `Jugador${index >= 0 ? index + 1 : 1}`;
}

export function getOwnLobbyPlayer(lobby) {
  const clientId = getOrCreateClientId();
  return lobby?.players?.[clientId] || null;
}

export function getClaimForRole(lobby, roleId) {
  const normalizedRoleId = normalizeRoleId(roleId);
  const legacyRoleId = normalizedRoleId === "guaperas" ? "bruto" : null;
  return lobby?.roleClaims?.[normalizedRoleId] || (legacyRoleId ? lobby?.roleClaims?.[legacyRoleId] : null) || null;
}

export function isRoleClaimedByOther(lobby, roleId) {
  const claim = getClaimForRole(lobby, roleId);
  return Boolean(claim && claim.clientId !== getOrCreateClientId());
}

export function getReadyClaims(lobby) {
  return getLobbyRoles().map((role) => getClaimForRole(lobby, role.id)).filter(Boolean);
}

export function areAllRolesClaimed(lobby) {
  return getReadyClaims(lobby).length === getLobbyRoles().length;
}

export function getCountdownRemainingMs(lobby, now = Date.now()) {
  if (!areAllRolesClaimed(lobby) || !lobby.countdownStartedAt) {
    return null;
  }

  return Math.max(0, LOBBY_COUNTDOWN_MS - (now - lobby.countdownStartedAt));
}

export async function touchLobbyPlayer() {
  const clientId = getOrCreateClientId();
  const now = Date.now();
  const existing = await firebaseGet(`lobby/players/${clientId}`);

  await firebasePatch(`lobby/players/${clientId}`, {
    clientId,
    sessionCode: getStoredSessionCode(),
    status: existing?.status || "selecting",
    previewRole: existing?.previewRole || null,
    confirmedRole: existing?.confirmedRole || null,
    joinedAt: existing?.joinedAt || now,
    lastSeenAt: now,
  });

  return getLobbySnapshot();
}

export async function updatePlayerName(name) {
  const clientId = getOrCreateClientId();
  const trimmedName = String(name || "").trim().slice(0, 24);

  storePlayerName(trimmedName);
  const snapshot = await getLobbySnapshot();
  const displayName = trimmedName || getPlayerDisplayName(snapshot.lobby.players[clientId], snapshot.lobby.players);
  const ownClaimEntry = Object.entries(snapshot.lobby.roleClaims).find(([, claim]) => claim?.clientId === clientId);

  await firebasePatch(`lobby/players/${clientId}`, {
    customName: trimmedName || null,
    lastSeenAt: Date.now(),
  });

  if (ownClaimEntry) {
    await firebasePatch(`lobby/roleClaims/${ownClaimEntry[0]}`, {
      name: displayName,
    });
  }
}

export async function updatePreviewRole(roleId) {
  const clientId = getOrCreateClientId();
  const normalizedRoleId = normalizeRoleId(roleId);

  await firebasePatch(`lobby/players/${clientId}`, {
    previewRole: normalizedRoleId,
    status: "selecting",
    lastSeenAt: Date.now(),
  });
}

export async function releaseOwnRoleClaim() {
  const clientId = getOrCreateClientId();
  const snapshot = await getLobbySnapshot();
  const ownClaimEntry = Object.entries(snapshot.lobby.roleClaims).find(([, claim]) => claim?.clientId === clientId);

  if (ownClaimEntry) {
    await firebasePut(`lobby/roleClaims/${ownClaimEntry[0]}`, null);
  }

  await firebasePatch(`lobby/players/${clientId}`, {
    status: "selecting",
    confirmedRole: null,
    lastSeenAt: Date.now(),
  });
  await firebasePatch("lobby", {
    countdownStartedAt: null,
    updatedAt: Date.now(),
  });
}

export async function claimRole(roleId) {
  const normalizedRoleId = normalizeRoleId(roleId);
  const clientId = getOrCreateClientId();
  const now = Date.now();
  const snapshot = await getLobbySnapshot();
  const ownPlayer = snapshot.lobby.players[clientId] || { clientId, joinedAt: now };
  const displayName = getPlayerDisplayName(ownPlayer, snapshot.lobby.players);
  storePlayerName(displayName);
  const currentClaim = getClaimForRole(snapshot.lobby, normalizedRoleId);

  if (currentClaim && currentClaim.clientId !== clientId) {
    return { ok: false, reason: "taken", claim: currentClaim };
  }

  const previousClaimEntry = Object.entries(snapshot.lobby.roleClaims).find(([claimedRoleId, claim]) => {
    return normalizeRoleId(claimedRoleId) !== normalizedRoleId && claim?.clientId === clientId;
  });

  if (previousClaimEntry) {
    await firebasePut(`lobby/roleClaims/${previousClaimEntry[0]}`, null);
  }

  if (!currentClaim) {
    const { data, etag } = await firebaseGetWithEtag(`lobby/roleClaims/${normalizedRoleId}`);

    if (data && data.clientId !== clientId) {
      return { ok: false, reason: "taken", claim: data };
    }

    const result = await firebasePutIfMatch(`lobby/roleClaims/${normalizedRoleId}`, {
      clientId,
      name: displayName,
      claimedAt: now,
      sessionCode: getStoredSessionCode(),
    }, etag);

    if (!result.ok) {
      return { ok: false, reason: "race" };
    }
  }

  await firebasePatch(`lobby/players/${clientId}`, {
    clientId,
    sessionCode: getStoredSessionCode(),
    previewRole: normalizedRoleId,
    confirmedRole: normalizedRoleId,
    status: "ready",
    readyAt: now,
    joinedAt: ownPlayer.joinedAt || now,
    lastSeenAt: now,
  });
  await firebasePatch("lobby", {
    updatedAt: now,
  });

  return { ok: true, roleId: normalizedRoleId };
}

export async function ensureLobbyCountdown(lobby) {
  if (!areAllRolesClaimed(lobby) || lobby.countdownStartedAt) {
    return;
  }

  const { data, etag } = await firebaseGetWithEtag("lobby/countdownStartedAt");

  if (data) {
    return;
  }

  await firebasePutIfMatch("lobby/countdownStartedAt", Date.now(), etag);
}

export async function tryStartGameFromLobby(lobby) {
  if (!areAllRolesClaimed(lobby) || getCountdownRemainingMs(lobby) !== 0) {
    return { ok: false };
  }

  const { data: session, etag } = await firebaseGetWithEtag("session");

  if (session?.status === "in_game") {
    return { ok: true };
  }

  const now = Date.now();
  return firebasePutIfMatch("session", {
    ...(session || {}),
    status: "in_game",
    gameTimer: {
      status: "running",
      startedAt: now,
      elapsedBeforeStartMs: 0,
    },
    updatedAt: now,
  }, etag);
}
