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

export const SCENARIO_VARIANTS = ["A", "B", "C", "D"];
export const DEFAULT_SCENARIO_ID = "almacen";
export const DEFAULT_VARIANT = "A";

// ---------------------------------------------------------------------------
// Scenario definitions
// Add new scenarios here as the adventure is written.
// Each variant needs a label and a backgroundSrc (image path).
// ---------------------------------------------------------------------------

export const scenarios = [
  {
    id: "almacen",
    label: "Almacen",
    description: "Primer nivel: almacen del gimnasio fragmentado en realidades paralelas.",
    variants: {
      A: { label: "Almacen A", backgroundSrc: "/assets/boards/placeholder_empollon.svg" },
      B: { label: "Almacen B", backgroundSrc: "/assets/boards/placeholder_mistica.svg" },
      C: { label: "Almacen C", backgroundSrc: "/assets/boards/placeholder_manitas.svg" },
      D: { label: "Almacen D", backgroundSrc: "/assets/boards/placeholder_guaperas.svg" },
    },
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Escenario de desarrollo. Sin contenido narrativo.",
    variants: {
      A: { label: "Sandbox A", backgroundSrc: "/assets/boards/placeholder_empollon.svg" },
      B: { label: "Sandbox B", backgroundSrc: "/assets/boards/placeholder_manitas.svg" },
      C: { label: "Sandbox C", backgroundSrc: "/assets/boards/placeholder_guaperas.svg" },
      D: { label: "Sandbox D", backgroundSrc: "/assets/boards/placeholder_mistica.svg" },
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

export function getVariantLabel(scenarioId, variant) {
  const scenario = getScenario(scenarioId);
  return scenario?.variants?.[variant]?.label || `Variante ${variant}`;
}

export function getAllScenarioIds() {
  return scenarios.map((s) => s.id);
}
