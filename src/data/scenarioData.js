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
import almacenB from "../../assets/Pantalla de juego/maps/almacen_B.png";
import almacenA2048Avif from "../../assets/Pantalla de juego/maps/optimized/almacen_A_2048.avif";
import almacenA3072Avif from "../../assets/Pantalla de juego/maps/optimized/almacen_A_3072.avif";
import almacenA2048Webp from "../../assets/Pantalla de juego/maps/optimized/almacen_A_2048.webp";
import almacenA3072Webp from "../../assets/Pantalla de juego/maps/optimized/almacen_A_3072.webp";
import almacenB2048Avif from "../../assets/Pantalla de juego/maps/optimized/almacen_B_2048.avif";
import almacenB3072Avif from "../../assets/Pantalla de juego/maps/optimized/almacen_B_3072.avif";
import almacenB2048Webp from "../../assets/Pantalla de juego/maps/optimized/almacen_B_2048.webp";
import almacenB3072Webp from "../../assets/Pantalla de juego/maps/optimized/almacen_B_3072.webp";

export const SCENARIO_VARIANTS = ["A", "B", "C", "D"];
export const DEFAULT_SCENARIO_ID = "almacen";
export const DEFAULT_VARIANT = "A";

function createMapBackground(src, responsive = {}) {
  const avifSrcSet = responsive.avif
    ? `${responsive.avif[2048]} 2048w, ${responsive.avif[3072]} 3072w`
    : null;
  const webpSrcSet = responsive.webp
    ? `${responsive.webp[2048]} 2048w, ${responsive.webp[3072]} 3072w`
    : null;

  return {
    src,
    srcSet: webpSrcSet,
    sources: [
      avifSrcSet ? { type: "image/avif", srcSet: avifSrcSet } : null,
      webpSrcSet ? { type: "image/webp", srcSet: webpSrcSet } : null,
    ].filter(Boolean),
    sizes: "(min-width: 1400px) 1400px, 100vw",
  };
}

const almacenABackground = createMapBackground(almacenA, {
  avif: { 2048: almacenA2048Avif, 3072: almacenA3072Avif },
  webp: { 2048: almacenA2048Webp, 3072: almacenA3072Webp },
});
const almacenBBackground = createMapBackground(almacenB, {
  avif: { 2048: almacenB2048Avif, 3072: almacenB3072Avif },
  webp: { 2048: almacenB2048Webp, 3072: almacenB3072Webp },
});

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
      A: { label: "Almacen A", backgroundSrc: almacenABackground, imageAspect: 4097 / 1536 },
      B: { label: "Almacen B", backgroundSrc: almacenBBackground, imageAspect: 4097 / 1537 },
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
