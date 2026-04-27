import { firebaseGet } from "./firebaseClient.js";

export const SESSION_CODE_STORAGE_KEY = "elExamen2.sessionCode";

export function normalizeSessionCode(value) {
  return (value || "").replace(/\D/g, "").slice(0, 6);
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
