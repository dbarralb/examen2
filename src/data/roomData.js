// ---------------------------------------------------------------------------
// roomData.js — compatibility stub
//
// The room/zone system has been replaced by the scenario/variant architecture
// in scenarioData.js. This file is kept only so existing imports don't break.
//
// Do NOT add new rooms or zones here — use scenarioData.js instead.
// ---------------------------------------------------------------------------

export const SANDBOX_ROOM_ID = "sandbox";
export const SANDBOX_START_ZONE_ID = "all";

/** @deprecated Use scenarioData.js */
export const SALA1_ROOM_ID = "sandbox";

export function getRoom() {
  return { id: "sandbox", label: "Sandbox", zones: [] };
}

export function getZone() {
  return null;
}

export function getZonesForRoom() {
  return [];
}

export function getPuzzlesForRoom() {
  return [];
}

export function getEcosForRoom() {
  return [];
}
