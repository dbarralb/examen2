// --- Layer 1: Background tiles ---

export const backgroundTiles = {
  columns: 3,
  rows: 2,
  // Total map: 1826 x 1080. Each tile ~609 x 540.
  tiles: [
    { id: "tile_0_0", col: 0, row: 0, src: null },
    { id: "tile_1_0", col: 1, row: 0, src: null },
    { id: "tile_2_0", col: 2, row: 0, src: null },
    { id: "tile_0_1", col: 0, row: 1, src: null },
    { id: "tile_1_1", col: 1, row: 1, src: null },
    { id: "tile_2_1", col: 2, row: 1, src: null },
  ],
};

// --- Layer 2: Structural map (rooms, walls, doors, passages) ---

export const rooms = [
  {
    id: "gymnasium",
    label: "Gimnasio",
    boundaryPath: "M 10,10 L 90,10 L 90,90 L 10,90 Z",
    stateKey: null,
  },
];

export const structures = [
  {
    id: "main_door",
    type: "door",
    label: "Puerta principal",
    svgPath: "M 80,40 L 85,40 L 85,50 L 80,50 Z",
    stateKey: "doorState",
    visibleWhen: null,
    appearances: {
      closed: { stroke: "#ff4444", fill: "rgba(255,68,68,0.2)" },
      clean_open: { stroke: "#44ff44", fill: "rgba(68,255,68,0.15)", dashArray: "2,2" },
      forced_open: { stroke: "#ffaa00", fill: "rgba(255,170,0,0.15)", dashArray: "1,1" },
    },
  },
];

// --- Layer 3: Marks / traces ---

export const markDefinitions = [
  {
    id: "alarm_active_mark",
    type: "danger",
    label: "Alarma activa",
    x: 50,
    y: 8,
    icon: "mark_danger",
    visibleWhen: (gameState) => gameState.alarmState === "on",
    animation: "pulse",
  },
  {
    id: "panel_hint_mark",
    type: "discovery",
    label: "Panel analizado",
    x: 68,
    y: 34,
    icon: "mark_discovery",
    visibleWhen: (gameState) => gameState.panelHintKnown === true,
    animation: null,
  },
  {
    id: "hidden_route_mark",
    type: "clue",
    label: "Ruta oculta",
    x: 44,
    y: 76,
    icon: "mark_clue",
    visibleWhen: (gameState) => gameState.hiddenRouteFlag === true,
    animation: "glow",
  },
];
