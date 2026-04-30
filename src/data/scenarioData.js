// ---------------------------------------------------------------------------
// Scenario + Variant architecture
//
// A SCENARIO is a narrative setting (e.g. "Almacén", "Laboratorio").
// A VARIANT (A, B, C, D) is a parallel version of that setting — same
// physical layout, different look, content, or state. The GM assigns one
// variant per player, so players in the same scenario may experience
// different realities simultaneously.
//
// Default: "sandbox" — blank scenario used for development and testing.
// ---------------------------------------------------------------------------

import almacenA from "../../assets/Pantalla de juego/maps/almacen_A.png";

export const SCENARIO_VARIANTS = ["A", "B", "C", "D"];
export const DEFAULT_SCENARIO_ID = "almacen";
export const DEFAULT_VARIANT = "A";

// ---------------------------------------------------------------------------
// Scenario definitions
// Add new scenarios here as the adventure is written.
// Each variant needs a label, backgroundSrc (image URL), and imageAspect
// (width / height ratio — used so SceneMap can handle panoramic layouts).
// ---------------------------------------------------------------------------

export const scenarios = [
  {
    id: "almacen",
    label: "Almacen",
    description: "Primer nivel: almacen del gimnasio fragmentado en realidades paralelas.",
    variants: {
      A: { label: "Almacen A", backgroundSrc: almacenA, imageAspect: 4096 / 1536 },
      B: { label: "Almacen B", backgroundSrc: null, imageAspect: null },
      C: { label: "Almacen C", backgroundSrc: null, imageAspect: null },
      D: { label: "Almacen D", backgroundSrc: null, imageAspect: null },
    },
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Escenario de desarrollo. Sin contenido narrativo.",
    variants: {
      A: { label: "Sandbox A", backgroundSrc: null, imageAspect: null },
      B: { label: "Sandbox B", backgroundSrc: null, imageAspect: null },
      C: { label: "Sandbox C", backgroundSrc: null, imageAspect: null },
      D: { label: "Sandbox D", backgroundSrc: null, imageAspect: null },
    },
  },
];

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getScenario(scenarioId = DEFAULT_SCENARIO_ID) {
  return scenarios.find((s) => s.id === scenarioId) || scenarios[0];
}

export function getVariantBackground(scenarioId, variant) {
  const scenario = getScenario(scenarioId);
  return scenario?.variants?.[variant]?.backgroundSrc || null;
}

export function getVariantImageAspect(scenarioId, variant) {
  const scenario = getScenario(scenarioId);
  return scenario?.variants?.[variant]?.imageAspect || null;
}

export function getVariantLabel(scenarioId, variant) {
  const scenario = getScenario(scenarioId);
  return scenario?.variants?.[variant]?.label || `Variante ${variant}`;
}

export function getAllScenarioIds() {
  return scenarios.map((s) => s.id);
}
