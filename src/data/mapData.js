// ---------------------------------------------------------------------------
// mapData.js — visual map layer definitions
//
// Layers:
//   1. Background tiles — optional tiled image system for the board background
//   2. Structure layer  — SVG rooms and static structural elements
//   3. Marks            — dynamic contextual indicators on the board
//
// All content here is intentionally blank / placeholder.
// Fill in per-scenario when adventure art and layout are defined.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Background tiles
// Divide the board image into a grid of tiles for progressive loading.
// Set src: null to use the single fallback image in BackgroundLayer.
// ---------------------------------------------------------------------------

export const backgroundTiles = {
  columns: 3,
  rows: 2,
  tiles: [
    { id: "tile_0_0", col: 0, row: 0, src: null },
    { id: "tile_1_0", col: 1, row: 0, src: null },
    { id: "tile_2_0", col: 2, row: 0, src: null },
    { id: "tile_0_1", col: 0, row: 1, src: null },
    { id: "tile_1_1", col: 1, row: 1, src: null },
    { id: "tile_2_1", col: 2, row: 1, src: null },
  ],
};

// ---------------------------------------------------------------------------
// 2. Structural map — rooms and static elements
// Add rooms and structures here when scenario art is available.
// ---------------------------------------------------------------------------

export const rooms = [];

export const structures = [];

// ---------------------------------------------------------------------------
// 3. Mark definitions — dynamic indicators overlaid on the board
// Each mark is shown/hidden by a visibleWhen(gameState) predicate.
// Add marks per-scenario as puzzle logic is defined.
// ---------------------------------------------------------------------------

export const markDefinitions = [
  // Example template — uncomment and fill in for each scenario mark:
  // {
  //   id: "example_mark",
  //   type: "danger" | "clue" | "discovery",
  //   label: "Label shown on hover",
  //   x: 50,   // percentage position on board
  //   y: 50,
  //   animation: "pulse" | "glow" | null,
  //   visibleWhen: (gameState) => Boolean(gameState.flags?.someFlag),
  // },
];
