import { createId, getOrCreateClientId } from "./clientIdentity.js";
import { firebasePatch, firebasePut } from "./firebaseClient.js";
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

export function createPendingAction({ card, targetId, roleId, minigame = null }) {
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
    status: "charging",
    createdAt: now,
    loadStartedAt: now,
    endsAt: now + loadTimeSeconds * 1000,
    durationMs: loadTimeSeconds * 1000,
    loadTimeSeconds,
    executionTimeSeconds: card.executionTimeSeconds || 3,
    minigame,
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
  delete action.minigame;
  delete action.targetStateSignature;

  const lastRoleAction = createLastRoleAction(action, "esperando pulso");
  await firebasePatch("", {
    [`queuedActions/${action.id}`]: action,
    [`lastRoleActions/${action.role}`]: lastRoleAction,
  });

  return action;
}

export async function sendPlayerChatMessage(role, text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return null;
  }

  const message = {
    id: createId(),
    clientId: getOrCreateClientId(),
    sessionCode: getStoredSessionCode(),
    author: role.label,
    role: role.id,
    text: trimmedText,
    createdAt: Date.now(),
  };

  await firebasePut(`chatMessages/${message.id}`, message);
  return message;
}

function createMirrorPendingAction(pendingAction) {
  if (!pendingAction) {
    return null;
  }

  return {
    id: pendingAction.id,
    player: pendingAction.player,
    role: pendingAction.role,
    card: pendingAction.card,
    target: pendingAction.target,
    status: pendingAction.status,
    loadStartedAt: pendingAction.loadStartedAt,
    endsAt: pendingAction.endsAt,
    minigameStatus: pendingAction.minigame?.status || null,
    minigameResult: pendingAction.minigame?.result || null,
  };
}

export async function markItemSeen(itemId) {
  await firebasePatch("", {
    [`itemSeenState/${itemId}/seen`]: true,
  });
}

export async function pickUpItem(roleId, itemId, slotIndex) {
  await firebasePatch("", {
    [`playerInventories/${roleId}/slots/${slotIndex}`]: { itemId },
    [`itemSeenState/${itemId}/seen`]: true,
    [`itemSeenState/${itemId}/pickedUp`]: true,
  });
}

export async function dropItemFromInventory(roleId, slotIndex) {
  await firebasePatch("", {
    [`playerInventories/${roleId}/slots/${slotIndex}`]: null,
  });
}

export async function setPendingItemUsage(roleId, itemId, targetId) {
  await firebasePatch("", {
    [`pendingItemUsage/${roleId}`]: { itemId, targetId, createdAt: Date.now() },
  });
}

export async function incrementCardUsage(roleId, cardId, currentCount) {
  await firebasePatch("", {
    [`cardUsage/${roleId}/${cardId}`]: currentCount + 1,
  });
}

export async function clearPendingItemUsage(roleId) {
  await firebasePatch("", {
    [`pendingItemUsage/${roleId}`]: null,
  });
}

export async function updatePlayerZone(roleId, zoneId) {
  await firebasePatch("", {
    [`playerZones/${roleId}`]: zoneId,
  });
}

export async function updatePlayerView(role, viewState) {
  const now = Date.now();
  const view = {
    clientId: getOrCreateClientId(),
    sessionCode: getStoredSessionCode(),
    playerName: getPlayerName(),
    role: role.id,
    selectedTargetId: viewState.selectedTargetId || null,
    selectedCardId: viewState.selectedCardId || "",
    camera: viewState.camera || null,
    pendingAction: createMirrorPendingAction(viewState.pendingAction),
    updatedAt: now,
  };

  await firebasePatch("", {
    [`playerViews/${role.id}`]: view,
  });

  return view;
}
