import { getActionLabel, isInspectionAction, isInteractionAction } from "./actionTypes.js";

export const LOCKER_STATES = {
  LOCKED: "LOCKER_LOCKED",
  FUSION: "LOCKER_FUSION",
  OPEN: "LOCKER_OPEN",
};

export const PANEL_STATES = {
  NEEDS_MODULE: "PANEL_NEEDS_MODULE",
  FUSION: "PANEL_FUSION",
  OK: "PANEL_OK",
};

export const DOOR_STATES = {
  LOCKED: "DOOR_LOCKED",
  OPEN: "DOOR_OPEN",
};

export const RESONANCE_COSTS = {
  LOCKER_FUSION: 8,
};

export const SCENARIO_ITEMS = {
  MODULE_SYNC: "MODULE_SYNC_01",
};

const sandboxHotspots = [
  { id: "hotspot_1", label: "Hotspot 1", x: 20, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_2", label: "Hotspot 2", x: 48, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_3", label: "Hotspot 3", x: 76, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
];

const almacenHotspotsBase = [
  {
    id: "pizarra",
    label: "Pizarra",
    x: 12,
    y: 18,
    w: 15,
    h: 16,
    family: "informacion",
    hotspotClass: "informacion",
    ports: [
      { id: "pizarra_info", type: "PORT_INFO", label: "Lectura" },
    ],
  },
  {
    id: "taquillas",
    label: "Taquillas",
    x: 35,
    y: 24,
    w: 14,
    h: 22,
    family: "contenedor",
    hotspotClass: "contenedor",
    ports: [
      { id: "taquillas_info", type: "PORT_INFO", label: "Lectura" },
      { id: "taquillas_mech", type: "PORT_MECH", label: "Mecanismo" },
    ],
    discoveries: [
      {
        slotKey: "slot0",
        label: "Análisis del cierre",
        chargeCost: 2,
        contentByVariant: {
          A: "El cierre tiene carcasa y arco, pero la zona de lectura esta incompleta. Hay una guia vacia donde deberia encajar un mecanismo interior.",
          B: "No ves la carcasa completa: ves el mecanismo interno. Las marcas verdes coinciden con la guia vacia de la otra realidad.",
        },
      },
      {
        slotKey: "slot1",
        label: "Fallo de mecanismo",
        chargeCost: 3,
        contentByVariant: {
          A: "La llave encaja en la guia exterior, pero el mecanismo de rotacion interior no responde. Falta la pieza que lo activa desde dentro.",
          B: "La horquilla calza en el mecanismo interior, pero sin la carcasa exterior no hay estructura para girar el cierre.",
        },
      },
    ],
  },
  {
    id: "caja",
    label: "Caja marcada",
    x: 54,
    y: 51,
    w: 12,
    h: 12,
    family: "contenedor",
    hotspotClass: "contenedor",
    ports: [
      { id: "caja_info", type: "PORT_INFO", label: "Lectura" },
      { id: "caja_mech", type: "PORT_MECH", label: "Mecanismo" },
    ],
  },
  {
    id: "balones",
    label: "Balones",
    x: 70,
    y: 55,
    w: 11,
    h: 12,
    family: "objeto",
    hotspotClass: "objeto",
    ports: [
      { id: "balones_info", type: "PORT_INFO", label: "Lectura" },
    ],
  },
  {
    id: "panel_salida",
    label: "Panel de salida",
    x: 82,
    y: 25,
    w: 10,
    h: 18,
    family: "dispositivo",
    hotspotClass: "dispositivo",
    ports: [
      { id: "panel_info", type: "PORT_INFO", label: "Diagnostico" },
      { id: "panel_mech", type: "PORT_MECH", label: "Control" },
    ],
    deviceConfig: {
      deviceName: "Panel de salida",
      bootLines: [
        "Inicializando lector de salida...",
        "Sincronizando cerradura fisica...",
        "Interferencia entre realidades detectada.",
        "Canal de mantenimiento disponible.",
      ],
      commands: [
        {
          name: "estado",
          description: "Muestra el estado visible del panel.",
          response: [
            "Salida: bloqueada.",
            "Codigo numerico: incompleto.",
            "Mecanismo fisico: sin confirmar.",
          ],
        },
        {
          name: "diagnostico",
          description: "Lista inconsistencias detectadas por el panel.",
          response: [
            "Lecturas incompatibles entre sensores.",
            "Una parte del mecanismo no existe en esta realidad.",
          ],
        },
        {
          name: "intentar_salida",
          description: "Comprueba si codigo y mecanismo fisico bastan para abrir.",
        },
      ],
    },
  },
];

const almacenHotspotsA = [
  ...almacenHotspotsBase,
  {
    id: "llave_taquilla",
    label: "Llave industrial",
    x: 24,
    y: 63,
    w: 6,
    h: 7,
    family: "objeto",
    hotspotClass: "objeto",
    ports: [
      { id: "llave_info", type: "PORT_INFO", label: "Lectura" },
    ],
    discoveries: [
      {
        slotKey: "slot0",
        label: "Análisis",
        chargeCost: 2,
        description: "El pomo de la llave coincide con el cierre exterior de la taquilla, pero el mecanismo de rotacion no encaja completamente.",
      },
    ],
  },
];

const almacenHotspotsB = [
  ...almacenHotspotsBase,
  {
    id: "horquilla",
    label: "Horquilla reforzada",
    x: 55,
    y: 68,
    w: 5,
    h: 6,
    family: "objeto",
    hotspotClass: "objeto",
    ports: [
      { id: "horquilla_info", type: "PORT_INFO", label: "Lectura" },
    ],
    discoveries: [
      {
        slotKey: "slot0",
        label: "Análisis",
        chargeCost: 2,
        description: "La forma de la horquilla calza perfectamente en el interior del mecanismo de la taquilla. Falta la pieza exterior para completar el cierre.",
      },
    ],
  },
];

const almacenItems = {
  A: {
    taquillas: [
      {
        id: SCENARIO_ITEMS.MODULE_SYNC,
        label: "Modulo de sincronizacion",
        type: "usable",
        content: "Modulo nacido de la fusion de la taquilla. El panel lo necesita para activar la salida.",
      },
      {
        id: "NOTE_PANEL_MODULE_01",
        label: "Nota del mecanismo",
        type: "clue",
        content: "El panel no abre con el codigo solo. Primero debe reconocer el modulo.",
      },
      {
        id: "HINT_BALONES_01",
        label: "Pista incompleta del codigo",
        type: "clue",
        content: "Primer digito: numero de balones correctos.",
      },
    ],
    caja: [
      {
        id: "regla_no_todo_es_real",
        label: "Etiqueta de inventario",
        type: "clue",
        content: "No todo lo que ves es real. Si se repite, desconfia.",
      },
    ],
    llave_taquilla: [
      {
        id: "llave_taquilla",
        label: "Llave de taquilla",
        type: "usable",
        content: "Llave industrial con un pomo de forma especifica. Encaja en el cierre exterior de la taquilla, pero algo falta para que funcione.",
      },
    ],
  },
  B: {
    taquillas: [
      {
        id: SCENARIO_ITEMS.MODULE_SYNC,
        label: "Modulo de sincronizacion",
        type: "usable",
        content: "Modulo nacido de la fusion de la taquilla. El panel lo necesita para activar la salida.",
      },
    ],
    caja: [
      {
        id: "fragmento_codigo_b",
        label: "Fragmento de codigo",
        type: "clue",
        content: "Dos cifras aparecen claras. Las otras parecen haber sido escritas en otra capa.",
      },
    ],
    horquilla: [
      {
        id: "horquilla",
        label: "Horquilla reforzada",
        type: "usable",
        content: "Horquilla metalica reforzada. No es de uso personal: su forma coincide con el mecanismo interior de la taquilla.",
      },
    ],
  },
  C: {},
  D: {},
};

const almacenFeedback = {
  pizarra: "El plan para robar el examen aparece incompleto. Conviene compararlo con lo que ven otros.",
  taquillas: "La taquilla no cede: A muestra un cierre claro y B sugiere una pieza mecanica que no encaja. Necesita fusion.",
  caja: "La caja introduce una regla: repetir informacion no la vuelve verdadera.",
  balones: "Los balones no mantienen la misma cantidad ni posicion cuando se comparan versiones.",
  panel_salida: "El panel combina codigo numerico y cierre fisico. Ninguna mitad basta por si sola.",
};

export const scenarioContent = {
  sandbox: {
    hotspotsByVariant: { A: sandboxHotspots, B: sandboxHotspots, C: sandboxHotspots, D: sandboxHotspots },
    itemsByVariant: {},
    feedback: {
      hotspot_1: "Sin contenido. Escenario pendiente.",
      hotspot_2: "Sin contenido. Escenario pendiente.",
      hotspot_3: "Sin contenido. Escenario pendiente.",
    },
  },
  almacen: {
    hotspotsByVariant: { A: almacenHotspotsA, B: almacenHotspotsB, C: almacenHotspotsBase, D: almacenHotspotsBase },
    itemsByVariant: almacenItems,
    feedback: almacenFeedback,
  },
};

export function getScenarioContent(scenarioId = "almacen") {
  return scenarioContent[scenarioId] || scenarioContent.sandbox;
}

export function getScenarioHotspots(scenarioId = "almacen", variant = "A") {
  const content = getScenarioContent(scenarioId);
  return content.hotspotsByVariant?.[variant] || content.hotspotsByVariant?.A || sandboxHotspots;
}

export function getScenarioHotspotOverrideKey(scenarioId = "almacen", variant = "A") {
  return `${scenarioId}_${variant}`;
}

export function getScenarioScopedTargetKey(scenarioId = "almacen", variant = "A", targetId = "") {
  return `${scenarioId}_${variant}__${targetId}`;
}

function getActionScenarioId(context, action) {
  return action?.scenarioId || context?.sessionState?.scenarioId || "almacen";
}

function getActionVariant(context, action) {
  return action?.variant || context?.playerBoards?.[action?.role]?.variant || "A";
}

function getActionScopedTargetKey(context, action) {
  return getScenarioScopedTargetKey(getActionScenarioId(context, action), getActionVariant(context, action), action?.target || "");
}

export function applyScenarioHotspotOverrides(targets = [], hotspotOverrides = {}, scenarioId = "almacen", variant = "A") {
  const saved = hotspotOverrides?.[getScenarioHotspotOverrideKey(scenarioId, variant)] || {};
  return targets.map((target) => saved[target.id] ? { ...target, ...saved[target.id] } : target);
}

export function getScenarioTarget(targetId, scenarioId = "almacen", variant = "A") {
  return getScenarioHotspots(scenarioId, variant).find((target) => target.id === targetId) || null;
}

export function getScenarioTargetItems(targetId, scenarioId = "almacen", variant = "A") {
  const itemsByTarget = getScenarioContent(scenarioId).itemsByVariant?.[variant] || {};
  return itemsByTarget[targetId] || [];
}

export function getScenarioItem(itemId, scenarioId = "almacen", variant = "A") {
  const content = getScenarioContent(scenarioId);
  const variants = variant ? [variant, "A", "B", "C", "D"] : ["A", "B", "C", "D"];
  for (const variantId of [...new Set(variants)]) {
    const targetItems = content.itemsByVariant?.[variantId] || {};
    for (const items of Object.values(targetItems)) {
      const item = items.find((candidate) => candidate.id === itemId);
      if (item) return item;
    }
  }
  return null;
}

export function getScenarioTargetImage(_target, _gameState, _scenarioId, _variant) {
  return "";
}

// Legacy stub — discoveries are now managed by getScenarioHotspotDiscoveries.
export function getScenarioInspectionDiscovery() {
  return null;
}

/**
 * Returns the discovery slots for a hotspot, with unlocked state per slot.
 * Slot keys in Firebase: `${scenarioId}_${variant}__${targetId}__${slotKey}`
 */
export function getScenarioHotspotDiscoveries(targetId, gameState = {}, scenarioId = "almacen", variant = "A") {
  const hotspot = getScenarioTarget(targetId, scenarioId, variant);
  if (!hotspot?.discoveries?.length) return [];

  return hotspot.discoveries.map((disc) => {
    const fullSlotKey = getScopedDiscoverySlotKey(scenarioId, variant, targetId, disc.slotKey);
    const legacyUnlocked = getLegacyScopedTargetKeys(scenarioId, targetId).some((legacyKey) => (
      gameState.inspectionDiscoveries?.[`${legacyKey}__${disc.slotKey}`]
    ));
    const unlocked = Boolean(gameState.inspectionDiscoveries?.[fullSlotKey] || legacyUnlocked);
    const description = disc.contentByVariant
      ? (disc.contentByVariant[variant] || disc.contentByVariant.A || "")
      : (disc.description || "");
    return {
      slotKey: disc.slotKey,
      label: disc.label || "Analisis",
      description,
      unlocked,
      chargeCost: disc.chargeCost || 0,
    };
  });
}

export function getScenarioTargetStateLabel(target, gameState = {}, scenarioId = "almacen", variant = "A") {
  if (!target?.id) return "-";
  const scopedState = gameState.hotspotStates?.[getScenarioScopedTargetKey(scenarioId, variant, target.id)];
  if (target.id === "taquillas") {
    return scopedState || LOCKER_STATES.LOCKED;
  }
  if (target.id === "panel_salida") {
    return scopedState || PANEL_STATES.NEEDS_MODULE;
  }
  return scopedState || "idle";
}

export function getScenarioContainerOpenState(targetId, gameState = {}, scenarioId = "almacen", variant = "A") {
  const target = getScenarioTarget(targetId, scenarioId, variant);
  if (!target) return null;

  // "objeto" hotspots with items are always accessible when selected
  if (target.family === "objeto") {
    const items = getScenarioTargetItems(targetId, scenarioId, variant);
    return items.length > 0 ? true : null;
  }

  if (target.family !== "contenedor") return null;
  const state = gameState.hotspotStates?.[getScenarioScopedTargetKey(scenarioId, variant, targetId)];
  if (targetId === "taquillas") {
    return state === LOCKER_STATES.OPEN;
  }
  return state !== "locked" && state !== "closed_locked";
}

export function getScenarioPulseAnomalyTargetIds(gameState = {}, scenarioId = "almacen", variant = "A") {
  if (scenarioId !== "almacen") {
    return [];
  }

  const hotspotStates = gameState.hotspotStates || {};
  const flags = gameState.flags || {};
  const lockerState = hotspotStates[getScenarioScopedTargetKey(scenarioId, variant, "taquillas")] || LOCKER_STATES.LOCKED;
  const panelState = hotspotStates[getScenarioScopedTargetKey(scenarioId, variant, "panel_salida")] || PANEL_STATES.NEEDS_MODULE;
  const targetIds = [];

  if (lockerState !== LOCKER_STATES.OPEN) {
    targetIds.push("taquillas");
  }

  if (!flags.almacenSalidaLista && panelState !== PANEL_STATES.OK) {
    targetIds.push("panel_salida");
  }

  return targetIds;
}

export function createScenarioTargetFeedback(scenarioId = "almacen") {
  return { ...(getScenarioContent(scenarioId).feedback || {}) };
}

export function resolveScenarioDeviceCommand({ targetId, command, gameState, scenarioId = "almacen", variant = "A" }) {
  if (targetId !== "panel_salida") {
    return {
      lines: ["Comando recibido.", "Este dispositivo no tiene logica especifica definida."],
      type: "system",
    };
  }

  if (command.name === "estado" || command.name === "diagnostico") {
    return {
      lines: Array.isArray(command.response) ? command.response : ["Diagnostico completado."],
      type: "system",
    };
  }

  const flags = gameState?.flags || {};
  const panelStateKey = getScenarioScopedTargetKey(scenarioId, variant, "panel_salida");
  const doorStateKey = getScenarioScopedTargetKey(scenarioId, variant, "puerta");
  if (command.name === "intentar_salida") {
    if (flags.codigoAlmacenCompleto && gameState?.hotspotStates?.[panelStateKey] === PANEL_STATES.OK) {
      const patch = {
        "gameState/flags/almacenCompletado": true,
        [`gameState/hotspotStates/${doorStateKey}`]: DOOR_STATES.OPEN,
      };
      if (scenarioId === "almacen") {
        for (const variantId of ["A", "B"]) {
          patch[`gameState/hotspotStates/${getScenarioScopedTargetKey(scenarioId, variantId, "puerta")}`] = DOOR_STATES.OPEN;
        }
      }
      return {
        patch,
        lines: ["Salida desbloqueada.", "El panel fusionado acepta el codigo y abre la puerta."],
        type: "system",
      };
    }
    return {
      lines: ["Salida denegada.", "Falta modulo, fusion del panel o codigo correcto."],
      type: "error",
    };
  }

  return {
    lines: ["Comando sin efecto en este escenario."],
    type: "system",
  };
}

// ---------------------------------------------------------------------------
// Shared resonance — single global pool for all players
// ---------------------------------------------------------------------------

export function ensureSharedResonance(gameState) {
  if (!gameState.sharedResonance || typeof gameState.sharedResonance !== "object") {
    // Migrate from legacy per-variant system if present
    const legacyA = gameState.resonanceByVariant?.A || gameState.resonance || {};
    const legacyB = gameState.resonanceByVariant?.B || {};
    const legacyValue = Math.max(Number(legacyA.value || 0), Number(legacyB.value || 0));
    const legacyDiscoveries = { ...(legacyA.discoveries || {}), ...(legacyB.discoveries || {}) };
    gameState.sharedResonance = { value: legacyValue, spent: 0, discoveries: legacyDiscoveries };
  }
  if (!gameState.sharedResonance.discoveries) gameState.sharedResonance.discoveries = {};
  gameState.sharedResonance.value = Number(gameState.sharedResonance.value || 0);
  gameState.sharedResonance.spent = Number(gameState.sharedResonance.spent || 0);
  return gameState.sharedResonance;
}

function addSharedResonanceOnce(gameState, discoveryId, amount) {
  const r = ensureSharedResonance(gameState);
  if (r.discoveries[discoveryId]) return 0;
  r.discoveries[discoveryId] = true;
  r.value += amount;
  return amount;
}

function addSharedResonance(gameState, amount) {
  const r = ensureSharedResonance(gameState);
  r.value += amount;
  return amount;
}

function consumeSharedResonance(gameState, amount) {
  const r = ensureSharedResonance(gameState);
  if (r.value < amount) return false;
  r.value -= amount;
  r.spent += amount;
  return true;
}

// ---------------------------------------------------------------------------
// Accumulated charge per hotspot
// ---------------------------------------------------------------------------

function getDiscoveryScopeVariant(scenarioId, variant, targetId) {
  if (scenarioId === "almacen" && targetId === "taquillas") {
    return "shared";
  }

  return variant || "A";
}

function getLegacyScopedTargetKeys(scenarioId, targetId) {
  if (scenarioId !== "almacen" || targetId !== "taquillas") {
    return [];
  }

  return ["A", "B"].map((variantId) => getScenarioScopedTargetKey(scenarioId, variantId, targetId));
}

export function getAccChargeKey(scenarioId, variant, targetId) {
  return getScenarioScopedTargetKey(scenarioId, getDiscoveryScopeVariant(scenarioId, variant, targetId), targetId);
}

export function getAccumulatedChargeForTarget(gameState = {}, scenarioId = "almacen", variant = "A", targetId = "") {
  const key = getAccChargeKey(scenarioId, variant, targetId);
  const current = Number(gameState.accumulatedCharge?.[key] || 0);
  const legacyTotal = getLegacyScopedTargetKeys(scenarioId, targetId)
    .reduce((total, legacyKey) => total + Number(gameState.accumulatedCharge?.[legacyKey] || 0), 0);

  return current + legacyTotal;
}

function getAccumulatedCharge(gameState, key) {
  if (!gameState.accumulatedCharge) gameState.accumulatedCharge = {};
  return Number(gameState.accumulatedCharge[key] || 0);
}

function setAccumulatedCharge(gameState, key, value) {
  if (!gameState.accumulatedCharge) gameState.accumulatedCharge = {};
  gameState.accumulatedCharge[key] = Math.max(0, value);
}

function migrateSharedDiscoveryState(gameState, scenarioId, variant, targetId) {
  if (scenarioId !== "almacen" || targetId !== "taquillas") {
    return;
  }

  if (!gameState.accumulatedCharge) gameState.accumulatedCharge = {};
  if (!gameState.inspectionDiscoveries) gameState.inspectionDiscoveries = {};

  const sharedChargeKey = getAccChargeKey(scenarioId, variant, targetId);
  const legacyChargeKeys = getLegacyScopedTargetKeys(scenarioId, targetId);
  const legacyCharge = legacyChargeKeys.reduce((total, legacyKey) => total + Number(gameState.accumulatedCharge[legacyKey] || 0), 0);
  if (legacyCharge > 0) {
    gameState.accumulatedCharge[sharedChargeKey] = Number(gameState.accumulatedCharge[sharedChargeKey] || 0) + legacyCharge;
    legacyChargeKeys.forEach((legacyKey) => {
      delete gameState.accumulatedCharge[legacyKey];
    });
  }

  const hotspotDefs = getScenarioTarget(targetId, scenarioId, variant);
  (hotspotDefs?.discoveries || []).forEach((disc) => {
    const sharedSlotKey = getScopedDiscoverySlotKey(scenarioId, variant, targetId, disc.slotKey);
    const wasUnlocked = ["A", "B"].some((legacyVariant) => (
      gameState.inspectionDiscoveries[`${getScenarioScopedTargetKey(scenarioId, legacyVariant, targetId)}__${disc.slotKey}`]
    ));
    if (wasUnlocked) {
      gameState.inspectionDiscoveries[sharedSlotKey] = true;
    }
  });
}

/** Adds charge to the hotspot accumulator without spending it. */
function applyChargeToTarget(gameState, scenarioId, variant, targetId, addedCharge, hotspotDefs) {
  if (!gameState.inspectionDiscoveries) gameState.inspectionDiscoveries = {};
  migrateSharedDiscoveryState(gameState, scenarioId, variant, targetId);
  const key = getAccChargeKey(scenarioId, variant, targetId);
  const previousAccumulated = getAccumulatedCharge(gameState, key);
  const added = Math.max(0, Number(addedCharge || 0));
  const accumulated = previousAccumulated + added;

  setAccumulatedCharge(gameState, key, accumulated);
  return { previousAccumulated, accumulated, added, discoveries: hotspotDefs?.discoveries || [] };
}

// Keep legacy stubs so nothing outside breaks during transition
function ensureResonanceState(gameState) { return ensureSharedResonance(gameState); }
function addResonanceOnce(gameState, discoveryId, amount) { return addSharedResonanceOnce(gameState, discoveryId, amount); }
function consumeResonance(gameState, amount) { return consumeSharedResonance(gameState, amount); }
function ensureVariantResonanceState(gameState) { return ensureSharedResonance(gameState); }
function addVariantResonanceOnce(gameState, _variant, discoveryId, amount) { return addSharedResonanceOnce(gameState, discoveryId, amount); }
function consumeVariantResonance(gameState, _variant, amount) { return consumeSharedResonance(gameState, amount); }

function setAlmacenStateForBothVariants(gameState, targetId, state) {
  for (const variantId of ["A", "B"]) {
    gameState.hotspotStates[getScenarioScopedTargetKey("almacen", variantId, targetId)] = state;
  }
}

function getScopedDiscoverySlotKey(scenarioId, variant, targetId, slotKey) {
  return `${getScenarioScopedTargetKey(scenarioId, getDiscoveryScopeVariant(scenarioId, variant, targetId), targetId)}__${slotKey}`;
}

function markInspectionDiscoveryUnlocked(gameState, scenarioId, variant, targetId, slotKey) {
  if (!gameState.inspectionDiscoveries) gameState.inspectionDiscoveries = {};

  const discoveryKey = getScopedDiscoverySlotKey(scenarioId, variant, targetId, slotKey);
  gameState.inspectionDiscoveries[discoveryKey] = true;

  getLegacyScopedTargetKeys(scenarioId, targetId).forEach((legacyKey) => {
    gameState.inspectionDiscoveries[`${legacyKey}__${slotKey}`] = true;
  });

  return discoveryKey;
}

export function purchaseInspectionDiscovery(gameState = {}, scenarioId = "almacen", variant = "A", targetId = "", slotKey = "") {
  if (!gameState.flags) gameState.flags = {};
  if (!gameState.inspectionDiscoveries) gameState.inspectionDiscoveries = {};
  migrateSharedDiscoveryState(gameState, scenarioId, variant, targetId);

  const hotspotDefs = getScenarioTarget(targetId, scenarioId, variant);
  const discovery = hotspotDefs?.discoveries?.find((disc) => disc.slotKey === slotKey);
  if (!discovery) {
    return { ok: false, reason: "missing_discovery" };
  }

  const discoveryKey = getScopedDiscoverySlotKey(scenarioId, variant, targetId, slotKey);
  if (gameState.inspectionDiscoveries[discoveryKey]) {
    return { ok: false, reason: "already_unlocked", discoveryKey };
  }

  const accKey = getAccChargeKey(scenarioId, variant, targetId);
  const cost = Number(discovery.chargeCost) || 0;
  const accumulated = getAccumulatedCharge(gameState, accKey);
  if (accumulated < cost) {
    return { ok: false, reason: "insufficient_charge", accumulated, cost, discoveryKey };
  }

  const remainingCharge = accumulated - cost;
  setAccumulatedCharge(gameState, accKey, remainingCharge);
  markInspectionDiscoveryUnlocked(gameState, scenarioId, variant, targetId, slotKey);

  let resonanceGained = 0;
  let feedback = `${discovery.label || "Hallazgo"} desbloqueado. Carga restante: ${remainingCharge}.`;
  let message = `Hallazgo desbloqueado en ${targetId}: ${discovery.label || slotKey}.`;

  if (scenarioId === "almacen" && targetId === "taquillas" && slotKey === "slot0") {
    resonanceGained = addSharedResonanceOnce(gameState, `contradiction_locker_mechanism_shared`, 3);
    gameState.flags.contradiccionTaquillas = true;
    feedback = resonanceGained > 0
      ? "La taquilla confirma una contradiccion entre realidades. La resonancia aumenta."
      : "La contradiccion de la taquilla ya estaba detectada.";
    message = "El grupo desbloquea el analisis del cierre de la taquilla.";
  } else if (scenarioId === "almacen" && targetId === "llave_taquilla" && slotKey === "slot0") {
    resonanceGained = addSharedResonanceOnce(gameState, `inspection_llave_taquilla_${variant}`, 2);
    feedback = "La llave industrial revela su proposito: encaja con el cierre exterior de la taquilla.";
    message = "El equipo desbloquea el analisis de la llave industrial.";
  } else if (scenarioId === "almacen" && targetId === "horquilla" && slotKey === "slot0") {
    resonanceGained = addSharedResonanceOnce(gameState, `inspection_horquilla_${variant}`, 2);
    feedback = "La horquilla reforzada encaja con el mecanismo interior de la taquilla.";
    message = "El equipo desbloquea el analisis de la horquilla.";
  }

  return {
    ok: true,
    accKey,
    cost,
    discoveryKey,
    label: discovery.label || "Hallazgo",
    remainingCharge,
    resonanceGained,
    feedback,
    message,
  };
}

export function resolveScenarioAction(context, action, pulseFlags = {}) {
  const scenarioId = context.sessionState?.scenarioId || "almacen";
  if (scenarioId !== "almacen") {
    return null;
  }

  const gameState = context.gameState;
  const actionVariant = getActionVariant(context, action);
  const actionTargetKey = getActionScopedTargetKey(context, action);
  if (!gameState.flags) gameState.flags = {};
  if (!gameState.hotspotStates) gameState.hotspotStates = {};
  if (!gameState.inspectionDiscoveries) gameState.inspectionDiscoveries = {};
  ensureVariantResonanceState(gameState, actionVariant);
  const lockerStateKey = getScenarioScopedTargetKey(scenarioId, actionVariant, "taquillas");
  const panelStateKey = getScenarioScopedTargetKey(scenarioId, actionVariant, "panel_salida");
  const doorStateKey = getScenarioScopedTargetKey(scenarioId, actionVariant, "puerta");
  gameState.hotspotStates[lockerStateKey] = gameState.hotspotStates[lockerStateKey] || LOCKER_STATES.LOCKED;
  gameState.hotspotStates[panelStateKey] = gameState.hotspotStates[panelStateKey] || PANEL_STATES.NEEDS_MODULE;
  gameState.hotspotStates[doorStateKey] = gameState.hotspotStates[doorStateKey] || DOOR_STATES.LOCKED;

  const actionLabel = getActionLabel(action);
  const isInspection = isInspectionAction(action);
  const isInteraction = isInteractionAction(action);

  let message = `${action.role} usa ${actionLabel} sobre ${action.target}. La informacion queda registrada.`;
  let feedback = "Accion registrada. Comparadla con las otras perspectivas.";

  if (action.target === "taquillas") {
    const lockerState = gameState.hotspotStates[lockerStateKey];

    if (lockerState === LOCKER_STATES.OPEN) {
      feedback = "La taquilla fusionada ya esta abierta. Su contenido puede revisarse sin forzar nada mas.";
      message = "La taquilla permanece abierta tras la fusion.";
    } else if (lockerState === LOCKER_STATES.FUSION && isInteraction && action.itemId === "llave_taquilla" && !pulseFlags.lockerFusionResolvedThisPulse) {
      setAlmacenStateForBothVariants(gameState, "taquillas", LOCKER_STATES.OPEN);
      gameState.flags.mecanismoFisicoLocalizado = true;
      gameState.flags.mecanismoFisicoLiberado = true;
      gameState.flags.moduleSyncAvailable = true;
      feedback = "La llave gira por fin: la taquilla fusionada se abre y deja ver el modulo de sincronizacion.";
      message = "La llave abre la taquilla fusionada y deja disponible el modulo de sincronizacion.";
    } else if (lockerState === LOCKER_STATES.FUSION && isInteraction && action.itemId !== "llave_taquilla") {
      feedback = "La fusion ya esta hecha. Ahora hace falta usar la llave sobre la taquilla para abrir el cierre.";
      message = "La taquilla fusionada espera la llave.";
    } else if (lockerState === LOCKER_STATES.FUSION && isInteraction) {
      feedback = "La taquilla acaba de estabilizarse en este pulso. Necesita una nueva interaccion para abrirse.";
      message = "La taquilla queda fusionada, pendiente de apertura.";
    } else if (lockerState === LOCKER_STATES.LOCKED && isInteraction) {
      const hasKey = action.itemId === "llave_taquilla";
      const hasHairpin = action.itemId === "horquilla";

      if (hasKey || hasHairpin) {
        markInspectionDiscoveryUnlocked(gameState, scenarioId, actionVariant, "taquillas", "slot1");
        context.lastVfxType = "spark_fusion_fail";
        feedback = hasKey
          ? "La llave encaja en la guia exterior, pero el mecanismo interior no responde. La anomalia temporal lo hace imposible por separado."
          : "La horquilla calza en el mecanismo interior, pero sin la carcasa exterior el cierre no cede. Algo falta en esta realidad.";
        message = hasKey
          ? "La llave activa una reaccion anomala: chispas verdes y rosas aparecen en la taquilla."
          : "La horquilla detecta la anomalia temporal: chispas verdes y rosas aparecen en la taquilla.";
      } else {
        feedback = "La taquilla no se fusiona desde el pulso. Activad la fusion desde el terminal movil de la taquilla.";
        message = "La taquilla sigue bloqueada: la fusion debe activarse desde el movil.";
      }
    } else if (isInspection) {
      const actionCharge = Number(action.charge || 0);
      const hotspotDefs = getScenarioTarget("taquillas", scenarioId, actionVariant);
      const chargeResult = applyChargeToTarget(gameState, scenarioId, actionVariant, "taquillas", actionCharge, hotspotDefs);
      feedback = `Carga de taquillas +${chargeResult.added}. Carga acumulada: ${chargeResult.accumulated}. Desbloquead hallazgos disponibles desde la carta.`;
      message = `${action.role} suma ${chargeResult.added} de carga a la taquilla (${chargeResult.accumulated} acumulada).`;
    } else {
      feedback = "La taquilla no responde a esta accion. Primero conviene inspeccionarla o estabilizar su fusion.";
      message = "La taquilla sigue bloqueada.";
    }
  }

  if (action.target === "llave_taquilla") {
    if (isInspection) {
      const actionCharge = Number(action.charge || 0);
      const hotspotDefs = getScenarioTarget("llave_taquilla", scenarioId, actionVariant);
      const chargeResult = applyChargeToTarget(gameState, scenarioId, actionVariant, "llave_taquilla", actionCharge, hotspotDefs);
      feedback = `Carga de llave +${chargeResult.added}. Carga acumulada: ${chargeResult.accumulated}. Desbloquead su analisis desde la carta.`;
      message = `${action.role} suma ${chargeResult.added} de carga a la llave (${chargeResult.accumulated} acumulada).`;
    } else {
      feedback = "La llave necesita un objetivo. Prueba a usarla sobre la taquilla con una accion de interaccion.";
      message = `${action.role} examina la llave sin objetivo claro.`;
    }
  }

  if (action.target === "horquilla") {
    if (isInspection) {
      const actionCharge = Number(action.charge || 0);
      const hotspotDefs = getScenarioTarget("horquilla", scenarioId, actionVariant);
      const chargeResult = applyChargeToTarget(gameState, scenarioId, actionVariant, "horquilla", actionCharge, hotspotDefs);
      feedback = `Carga de horquilla +${chargeResult.added}. Carga acumulada: ${chargeResult.accumulated}. Desbloquead su analisis desde la carta.`;
      message = `${action.role} suma ${chargeResult.added} de carga a la horquilla (${chargeResult.accumulated} acumulada).`;
    } else {
      feedback = "La horquilla necesita un objetivo. Prueba a usarla sobre la taquilla con una accion de interaccion.";
      message = `${action.role} examina la horquilla sin objetivo claro.`;
    }
  }

  if (action.target === "pizarra" && isInspection) {
    gameState.flags.codigoAlmacenParcial = true;
    feedback = "La pizarra contiene una parte fiable del codigo, pero hay un paso que parece desplazado.";
    message = "El grupo extrae una regla parcial de la pizarra.";
  }

  if (action.target === "caja" && isInspection) {
    const gained = addVariantResonanceOnce(gameState, actionVariant, `contradiction_box_duplicate_${actionVariant}`, 2);
    gameState.flags.objetosDuplicadosDetectados = true;
    feedback = gained > 0
      ? "La caja confirma una contradiccion: un duplicado puede ser falso aunque parezca identico. La resonancia aumenta."
      : "La caja ya habia revelado su contradiccion. La regla sigue siendo util, pero no genera mas resonancia.";
    message = gained > 0
      ? "El grupo detecta una contradiccion resonante en la caja."
      : "El grupo revisa una contradiccion ya registrada en la caja.";
  }

  if (action.target === "balones" && isInspection) {
    const gained = addVariantResonanceOnce(gameState, actionVariant, `contradiction_balls_count_${actionVariant}`, 3);
    gameState.flags.contradiccionBalones = true;
    feedback = gained > 0
      ? "Los balones dejan de cuadrar entre realidades. La contradiccion genera resonancia."
      : "La contradiccion de los balones ya esta registrada. El conteo sigue siendo una pista para el codigo.";
    message = gained > 0
      ? "El grupo detecta una contradiccion resonante en los balones."
      : "Los balones confirman una contradiccion ya detectada.";
  }

  if (action.target === "panel_salida" && isInspection) {
    if (gameState.hotspotStates[panelStateKey] === PANEL_STATES.FUSION) {
      gameState.flags.codigoAlmacenCompleto = true;
      setAlmacenStateForBothVariants(gameState, "panel_salida", PANEL_STATES.OK);
      gameState.flags.almacenSalidaLista = true;
      feedback = "El panel fusionado acepta el codigo reconstruido. La puerta ya puede abrirse.";
      message = "El grupo introduce el codigo reconstruido y el panel queda validado.";
    } else {
      gameState.flags.codigoAlmacenParcial = true;
      feedback = "El codigo empieza a reconstruirse, pero el panel aun necesita el modulo para activarse.";
      message = "El grupo obtiene parte del codigo del panel.";
    }
  }

  if (action.target === "panel_salida" && isInteraction) {
    const hasModule = action.itemId === SCENARIO_ITEMS.MODULE_SYNC || gameState.flags.moduleSyncAvailable;
    const lockerOpenInEitherReality = ["A", "B"].some((variantId) => (
      gameState.hotspotStates[getScenarioScopedTargetKey(scenarioId, variantId, "taquillas")] === LOCKER_STATES.OPEN
    ));
    if (hasModule && lockerOpenInEitherReality) {
      gameState.flags.moduleSyncInserted = true;
      setAlmacenStateForBothVariants(gameState, "panel_salida", PANEL_STATES.FUSION);
      feedback = "El modulo encaja en el panel. El panel se fusiona y queda activo para introducir el codigo.";
      message = "El grupo coloca el modulo y activa la fusion del panel.";
    } else {
      feedback = "El panel sigue bloqueado. Primero hay que abrir la taquilla fusionada y obtener el modulo.";
      message = "El panel rechaza la manipulacion porque falta el modulo.";
    }
  }

  if (gameState.flags.codigoAlmacenCompleto && gameState.hotspotStates[panelStateKey] === PANEL_STATES.OK) {
    gameState.flags.almacenSalidaLista = true;
  }

  context.targetFeedback[getActionScopedTargetKey(context, action)] = feedback;
  context.lastRoleDebug = message;
  context.actionLog.unshift(message);

  return message;
}
