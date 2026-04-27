// Sandbox room used while the puzzle design is being reworked.
// Keep this file intentionally small: zones only decide which hotspots are visible.

export const SANDBOX_ROOM_ID = "sandbox";
export const SANDBOX_START_ZONE_ID = "all";

export const rooms = [
  {
    id: SANDBOX_ROOM_ID,
    label: "Sandbox",
    salaNumber: 1,
    narrative: "Sala limpia para probar el loop de acciones sin reglas de puzzle.",
    zones: [
      { id: "all", label: "Todos", targetIds: ["door", "panel", "sensor", "locker", "electrical_box", "sports_gear"] },
      { id: "access", label: "Acceso", targetIds: ["door", "panel", "sensor"] },
      { id: "storage", label: "Almacen", targetIds: ["locker", "electrical_box", "sports_gear"] },
    ],
    puzzles: [],
    ecos: [],
  },
];

export function getRoom(roomId = SANDBOX_ROOM_ID) {
  return rooms.find((room) => room.id === roomId) || rooms[0];
}

export function getZone(roomId = SANDBOX_ROOM_ID, zoneId = SANDBOX_START_ZONE_ID) {
  const room = getRoom(roomId);
  return room.zones.find((zone) => zone.id === zoneId) || room.zones[0] || null;
}

export function getZonesForRoom(roomId = SANDBOX_ROOM_ID) {
  return getRoom(roomId).zones || [];
}

export function getPuzzlesForRoom() {
  return [];
}

export function getEcosForRoom() {
  return [];
}
