import { SESSION_CODE_STORAGE_KEY } from "./sessionAccess.js";

const CLIENT_ID_STORAGE_KEY = "elExamen2.clientId";

export function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function getOrCreateClientId() {
  try {
    // Derive identity from the per-tab session code so each tab is a different player
    const sessionCode = window.sessionStorage.getItem(SESSION_CODE_STORAGE_KEY);
    if (sessionCode) {
      return `player-${sessionCode}`;
    }

    // Fallback for GM or screens that don't require a session code
    const stored = window.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (stored) {
      return stored;
    }

    const created = createId();
    window.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
    return created;
  } catch (error) {
    return createId();
  }
}

export function generateSessionAccessCode() {
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}
