// ---------------------------------------------------------------------------
// gameData.js — core game element definitions
//
// Contents:
//   1. Hotspot families      — semantic categories for interactive elements
//   2. Board hotspots        — 3 generic hotspots per player board (placeholders)
//   3. Player board sources  — background image path per role
//   4. Role cards            — action cards per role
//   5. Utility functions     — typed accessors used by SceneMap / PlayerScreen
//
// NOTE: All hotspot content (items, state logic, images) is intentionally
// blank. Content is defined per scenario when the adventure is written.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Hotspot families
// ---------------------------------------------------------------------------

export const hotspotFamilies = {
  acceso:      { label: "Acceso",      description: "Puntos de entrada, salida o paso." },
  contenedor:  { label: "Contenedor",  description: "Objetos que guardan o contienen elementos." },
  dispositivo: { label: "Dispositivo", description: "Sistemas electrónicos o mecánicos interactuables." },
  informacion: { label: "Información", description: "Fuentes de datos, pistas o documentos." },
  objeto:      { label: "Objeto",      description: "Elementos físicos sueltos o de uso directo." },
  sensor:      { label: "Sensor",      description: "Detectores o sistemas de vigilancia." },
};

// ---------------------------------------------------------------------------
// 2. Board hotspots  (3 per player board — positions are layout placeholders)
// ---------------------------------------------------------------------------

export const boardHotspots = [
  { id: "hotspot_1", label: "Hotspot1", x: 20, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_2", label: "Hotspot2", x: 48, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_3", label: "Hotspot3", x: 76, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
];

// Alias — kept for backwards-compat imports throughout the codebase.
export const targets = boardHotspots;

// ---------------------------------------------------------------------------
// 3. Player board background images (placeholder SVGs, one per role)
// These are overridden at runtime by the scenario variant system.
// ---------------------------------------------------------------------------

export const playerBoardSrc = {
  empollon: "/assets/boards/placeholder_empollon.svg",
  manitas:  "/assets/boards/placeholder_manitas.svg",
  guaperas: "/assets/boards/placeholder_guaperas.svg",
  mistica:  "/assets/boards/placeholder_mistica.svg",
};

// ---------------------------------------------------------------------------
// 4. Role cards (actions)
// Each card belongs to one or more roles. Image paths are asset references.
// ---------------------------------------------------------------------------

export const cards = [
  { id: "mirar_bien",         label: "mirar_bien",         roles: ["empollon"], image: "/assets/Pantalla de juego/Actions/mirar_bien.png" },
  { id: "consultar_apuntes",  label: "consultar_apuntes",  roles: ["empollon"], image: "/assets/Pantalla de juego/Actions/consultar_apuntes.png" },
  { id: "apanar",             label: "apanar",             roles: ["manitas"],  image: "/assets/Pantalla de juego/Actions/apanar.png" },
  { id: "puenteo_rapido",     label: "puenteo_rapido",     roles: ["manitas"],  image: "/assets/Pantalla de juego/Actions/puenteo_rapido.png" },
  { id: "desmontar",          label: "desmontar",          roles: ["manitas"],  image: "/assets/Pantalla de juego/Actions/desmontar.png" },
  { id: "a_lo_bestia",        label: "a_lo_bestia",        roles: ["guaperas"], image: "/assets/Pantalla de juego/Actions/a_lo_bestia.png" },
  { id: "empujar",            label: "empujar",            roles: ["guaperas"], image: "/assets/Pantalla de juego/Actions/empujar.png" },
  { id: "y_si",               label: "y_si",               roles: ["mistica"],  image: "/assets/Pantalla de juego/Actions/y_si.png" },
  { id: "esto_vibra_raro",    label: "esto_vibra_raro",    roles: ["mistica"],  image: "/assets/Pantalla de juego/Actions/esto_vibra_raro.png" },
  { id: "ritual_improvisado", label: "ritual_improvisado", roles: ["mistica"],  image: "/assets/Pantalla de juego/Actions/ritual_improvisado.png" },
];

// ---------------------------------------------------------------------------
// 5. Utility functions
// ---------------------------------------------------------------------------

/** Items contained in a hotspot. Empty until scenario defines content. */
export function getTargetItems(_targetId) {
  return [];
}

/** Find an item by ID. Returns null until scenario defines items. */
export function getItem(_itemId) {
  return null;
}

/** Find a card by ID. */
export function getCard(cardId) {
  return cards.find((card) => card.id === cardId);
}

/** Find a hotspot by ID. */
export function getTarget(targetId) {
  return boardHotspots.find((t) => t.id === targetId);
}

/**
 * Hotspot state lookup.
 * Generic hotspots have no puzzle state yet — returns "idle" as baseline.
 * When scenario logic is implemented, this reads from playerBoards or gameState.
 */
export function getTargetState(_target, _gameState) {
  return "idle";
}

/** Hotspot image. Returns empty string until scenario art is defined. */
export function getTargetImage(_target, _gameState) {
  return "";
}

/**
 * Whether a container hotspot is open/accessible.
 * All hotspots are accessible by default until a scenario adds lock logic.
 * Returns null for non-container families (no inventory grid rendered).
 */
export function getContainerOpenState(targetId, _gameState) {
  const target = boardHotspots.find((t) => t.id === targetId);
  if (!target || target.family !== "contenedor") return null;
  return true;
}

/** Short state label used in event log and GM coordinate overlay. */
export function getTargetStateLabel(target, _gameState) {
  return target?.id ? "idle" : "—";
}
