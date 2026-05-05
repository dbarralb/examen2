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

import {
  getScenarioContainerOpenState,
  getScenarioInspectionDiscovery,
  getScenarioItem,
  getScenarioTarget,
  getScenarioTargetImage,
  getScenarioTargetItems,
  getScenarioTargetStateLabel,
} from "./scenarioContent.js";
import { ACTION_DESCRIPTIONS, ACTION_KINDS, ACTION_LABELS } from "./actionTypes.js";

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
  {
    id: "empollon_accion_inspeccion",
    label: ACTION_LABELS[ACTION_KINDS.INSPECTION],
    roles: ["empollon"],
    actionKind: ACTION_KINDS.INSPECTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INSPECTION],
    image: "/assets/Pantalla de juego/Actions/mirar_bien.png",
  },
  {
    id: "empollon_accion_interaccion",
    label: ACTION_LABELS[ACTION_KINDS.INTERACTION],
    roles: ["empollon"],
    actionKind: ACTION_KINDS.INTERACTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INTERACTION],
    image: "/assets/Pantalla de juego/Actions/consultar_apuntes.png",
  },
  {
    id: "manitas_accion_inspeccion",
    label: ACTION_LABELS[ACTION_KINDS.INSPECTION],
    roles: ["manitas"],
    actionKind: ACTION_KINDS.INSPECTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INSPECTION],
    image: "/assets/Pantalla de juego/Actions/desmontar.png",
  },
  {
    id: "manitas_accion_interaccion",
    label: ACTION_LABELS[ACTION_KINDS.INTERACTION],
    roles: ["manitas"],
    actionKind: ACTION_KINDS.INTERACTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INTERACTION],
    image: "/assets/Pantalla de juego/Actions/apanar.png",
  },
  {
    id: "guaperas_accion_inspeccion",
    label: ACTION_LABELS[ACTION_KINDS.INSPECTION],
    roles: ["guaperas"],
    actionKind: ACTION_KINDS.INSPECTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INSPECTION],
    image: "/assets/Pantalla de juego/Actions/empujar.png",
  },
  {
    id: "guaperas_accion_interaccion",
    label: ACTION_LABELS[ACTION_KINDS.INTERACTION],
    roles: ["guaperas"],
    actionKind: ACTION_KINDS.INTERACTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INTERACTION],
    image: "/assets/Pantalla de juego/Actions/a_lo_bestia.png",
  },
  {
    id: "mistica_accion_inspeccion",
    label: ACTION_LABELS[ACTION_KINDS.INSPECTION],
    roles: ["mistica"],
    actionKind: ACTION_KINDS.INSPECTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INSPECTION],
    image: "/assets/Pantalla de juego/Actions/esto_vibra_raro.png",
  },
  {
    id: "mistica_accion_interaccion",
    label: ACTION_LABELS[ACTION_KINDS.INTERACTION],
    roles: ["mistica"],
    actionKind: ACTION_KINDS.INTERACTION,
    description: ACTION_DESCRIPTIONS[ACTION_KINDS.INTERACTION],
    image: "/assets/Pantalla de juego/Actions/y_si.png",
  },
];

// ---------------------------------------------------------------------------
// 5. Utility functions
// ---------------------------------------------------------------------------

/** Items contained in a hotspot. Scenario-aware when IDs are provided. */
export function getTargetItems(targetId, scenarioId = "almacen", variant = "A") {
  return getScenarioTargetItems(targetId, scenarioId, variant);
}

/** Find an item by ID. */
export function getItem(itemId, scenarioId = "almacen", variant = "A") {
  return getScenarioItem(itemId, scenarioId, variant);
}

/** Find a card by ID. */
export function getCard(cardId) {
  return cards.find((card) => card.id === cardId);
}

/** Find a hotspot by ID. */
export function getTarget(targetId) {
  return getScenarioTarget(targetId, "almacen", "A") || boardHotspots.find((t) => t.id === targetId);
}

/**
 * Hotspot state lookup.
 * Generic hotspots have no puzzle state yet — returns "idle" as baseline.
 * When scenario logic is implemented, this reads from playerBoards or gameState.
 */
export function getTargetState(target, gameState) {
  return getScenarioTargetStateLabel(target, gameState);
}

/** Hotspot image. Returns empty string until scenario art is defined. */
export function getTargetImage(target, gameState, scenarioId = "almacen", variant = "A") {
  return getScenarioTargetImage(target, gameState, scenarioId, variant);
}

/** Scenario-specific inspection detail revealed by inspection actions. */
export function getInspectionDiscovery(targetId, gameState, scenarioId = "almacen", variant = "A") {
  return getScenarioInspectionDiscovery(targetId, gameState, scenarioId, variant);
}

/**
 * Whether a container hotspot is open/accessible.
 * All hotspots are accessible by default until a scenario adds lock logic.
 * Returns null for non-container families (no inventory grid rendered).
 */
export function getContainerOpenState(targetId, gameState, scenarioId = "almacen", variant = "A") {
  return getScenarioContainerOpenState(targetId, gameState, scenarioId, variant);
}

/** Short state label used in event log and GM coordinate overlay. */
export function getTargetStateLabel(target, gameState) {
  return getScenarioTargetStateLabel(target, gameState);
}
