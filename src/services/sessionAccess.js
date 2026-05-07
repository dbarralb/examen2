import { firebaseGet } from "./firebaseClient.js";

export const SESSION_CODE_STORAGE_KEY = "elExamen2.sessionCode";
export const GM_SESSION_CODE_STORAGE_KEY = "elExamen2.gmSessionCode";
export const GM_SESSION_ACCESS_CODE = "delfin";

export function normalizeSessionCode(value) {
  return (value || "").replace(/\D/g, "").slice(0, 6);
}

export function normalizeGmSessionCode(value) {
  return (value || "").trim().toLowerCase();
}

export function getStoredSessionCode() {
  try {
    return window.sessionStorage.getItem(SESSION_CODE_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

export function storeSessionCode(code) {
  try {
    window.sessionStorage.setItem(SESSION_CODE_STORAGE_KEY, String(code || ""));
  } catch (error) {
    // Private browsing or storage restrictions can block this; callers still show a useful error.
  }
}

export function getStoredGmSessionCode() {
  try {
    return window.sessionStorage.getItem(GM_SESSION_CODE_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

export function storeGmSessionCode(code) {
  try {
    window.sessionStorage.setItem(GM_SESSION_CODE_STORAGE_KEY, normalizeGmSessionCode(code));
  } catch (error) {
    // Private browsing or storage restrictions can block this; callers still show a useful error.
  }
}

export function hasValidStoredGmSessionCode() {
  return getStoredGmSessionCode() === GM_SESSION_ACCESS_CODE;
}

export async function getSession() {
  return firebaseGet("session");
}

export function getActiveSessionCode(session) {
  return session && session.accessCode ? String(session.accessCode) : "";
}

export function hasValidStoredSessionCode(session) {
  const stored = getStoredSessionCode();
  if (!stored) return false;
  const activeCode = getActiveSessionCode(session);
  if (activeCode && stored === activeCode) return true;
  const playerCodes = session?.playerCodes;
  if (playerCodes) {
    return Object.values(playerCodes).includes(stored);
  }
  return false;
}
