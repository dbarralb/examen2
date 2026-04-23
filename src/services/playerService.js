import { createId, getOrCreateClientId } from "./clientIdentity.js";
import { firebasePatch } from "./firebaseClient.js";
import { createLastRoleAction } from "./gameRules.js";
import { getStoredPlayerName } from "./lobbyService.js";
import { getStoredSessionCode } from "./sessionAccess.js";

export function getPlayerName() {
  const storedName = getStoredPlayerName();

  if (storedName) {
    return storedName;
  }

  return `Jugador ${getOrCreateClientId().slice(-4).toUpperCase()}`;
}

export function findQueuedActionForCurrentPlayer(queuedActions, roleId) {
  const clientId = getOrCreateClientId();
  const playerName = getPlayerName();

  return queuedActions.find((action) => {
    const sameClient = action.clientId ? action.clientId === clientId : action.player === playerName;
    return sameClient && action.role === roleId && ["queued", "executing"].includes(action.status || "queued");
  });
}

export function createPendingAction({ card, targetId, roleId }) {
  const now = Date.now();
  const loadTimeSeconds = card.loadTimeSeconds || 5;

  return {
    id: createId(),
    clientId: getOrCreateClientId(),
    sessionCode: getStoredSessionCode(),
    player: getPlayerName(),
    role: roleId,
    card: card.id,
    target: targetId,
    status: "pendingLoad",
    createdAt: now,
    loadStartedAt: now,
    endsAt: now + loadTimeSeconds * 1000,
    durationMs: loadTimeSeconds * 1000,
    loadTimeSeconds,
    executionTimeSeconds: card.executionTimeSeconds || 3,
  };
}

export async function enqueueLoadedAction(pendingAction) {
  const action = {
    ...pendingAction,
    status: "queued",
    loadedAt: Date.now(),
  };
  delete action.endsAt;
  delete action.durationMs;

  const lastRoleAction = createLastRoleAction(action, "esperando pulso");
  await firebasePatch("", {
    [`queuedActions/${action.id}`]: action,
    [`lastRoleActions/${action.role}`]: lastRoleAction,
  });

  return action;
}
