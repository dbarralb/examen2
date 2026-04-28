// Sandbox room used while the puzzle design is being reworked.
// Keep this file intentionally small: zones only decide which hotspots are visible.

export const SANDBOX_ROOM_ID = "sandbox";
export const SANDBOX_START_ZONE_ID = "all";

export const SALA1_ROOM_ID = "room_01_professor_office";
export const SALA1_START_ZONE_ID = "window_entry";

export const rooms = [
  {
    id: SANDBOX_ROOM_ID,
    label: "Sandbox",
    salaNumber: 0,
    narrative: "Sala limpia para probar el loop de acciones sin reglas de puzzle.",
    zones: [
      { id: "all", label: "Todos", targetIds: ["door", "panel", "sensor", "locker", "electrical_box", "sports_gear"] },
      { id: "access", label: "Acceso", targetIds: ["door", "panel", "sensor"] },
      { id: "storage", label: "Almacen", targetIds: ["locker", "electrical_box", "sports_gear"] },
    ],
    puzzles: [],
    ecos: [],
  },
  {
    id: SALA1_ROOM_ID,
    label: "Despacho del Profesor",
    salaNumber: 1,
    narrative: "Los alumnos deben robar el examen de ciencias de la vitrina protegida por láseres.",
    zones: [
      {
        id: "window_entry",
        label: "Entrada por la ventana",
        role: "context",
        targetIds: ["window"],
      },
      {
        id: "armored_door_zone",
        label: "Puerta acorazada",
        role: "exit",
        targetIds: ["armored_door", "security_panel"],
      },
      {
        id: "desk_zone",
        label: "Escritorio del profesor",
        role: "clue_source",
        targetIds: ["desk", "paper_bin"],
      },
      {
        id: "showcase_zone",
        label: "Vitrina con sistema láser",
        role: "main_objective",
        targetIds: ["showcase", "laser_grid"],
      },
      {
        id: "camera_zone",
        label: "Cámara de vigilancia",
        role: "secondary_system",
        targetIds: ["camera"],
      },
    ],
    puzzles: ["steal_exam"],
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
