const sandboxHotspots = [
  { id: "hotspot_1", label: "Hotspot 1", x: 20, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_2", label: "Hotspot 2", x: 48, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
  { id: "hotspot_3", label: "Hotspot 3", x: 76, y: 38, w: 9, h: 9, family: "objeto", hotspotClass: "generico" },
];

const almacenHotspots = [
  {
    id: "pizarra",
    label: "Pizarra",
    x: 12,
    y: 18,
    w: 15,
    h: 16,
    family: "informacion",
    hotspotClass: "informacion",
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

const almacenItems = {
  A: {
    taquillas: [
      {
        id: "nota_plan_a",
        label: "Nota arrugada",
        type: "clue",
        content: "El plan escrito aqui no coincide del todo con la pizarra. Alguien cambio un paso.",
      },
      {
        id: "cinta_aislante",
        label: "Cinta aislante",
        type: "usable",
        content: "Cinta vieja, suficiente para sujetar un cable o marcar una posicion.",
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
  },
  B: {
    taquillas: [
      {
        id: "destornillador_corto",
        label: "Destornillador corto",
        type: "usable",
        content: "Herramienta pequena. Encaja con tornillos de panel, si alguien sabe donde aplicarla.",
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
  },
  C: {},
  D: {},
};

const almacenFeedback = {
  pizarra: "El plan para robar el examen aparece incompleto. Conviene compararlo con lo que ven otros.",
  taquillas: "Algunas puertas no coinciden entre realidades. Puede haber herramientas o pistas dentro.",
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
    hotspotsByVariant: { A: almacenHotspots, B: almacenHotspots, C: almacenHotspots, D: almacenHotspots },
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

export function getScenarioTargetStateLabel(target, gameState = {}) {
  if (!target?.id) return "-";
  return gameState.hotspotStates?.[target.id] || "idle";
}

export function getScenarioContainerOpenState(targetId, gameState = {}, scenarioId = "almacen", variant = "A") {
  const target = getScenarioTarget(targetId, scenarioId, variant);
  if (!target || target.family !== "contenedor") return null;
  const state = gameState.hotspotStates?.[targetId];
  return state !== "locked" && state !== "closed_locked";
}

export function createScenarioTargetFeedback(scenarioId = "almacen") {
  return { ...(getScenarioContent(scenarioId).feedback || {}) };
}

export function resolveScenarioDeviceCommand({ targetId, command, gameState }) {
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
  if (command.name === "intentar_salida") {
    if (flags.codigoAlmacenCompleto && flags.mecanismoFisicoLiberado) {
      return {
        patch: {
          "gameState/flags/almacenCompletado": true,
          "gameState/hotspotStates/panel_salida": "open",
        },
        lines: ["Salida desbloqueada.", "El panel acepta codigo y mecanismo fisico."],
        type: "system",
      };
    }
    return {
      lines: ["Salida denegada.", "Falta combinar codigo numerico y mecanismo fisico."],
      type: "error",
    };
  }

  return {
    lines: ["Comando sin efecto en este escenario."],
    type: "system",
  };
}

export function resolveScenarioAction(context, action) {
  const scenarioId = context.sessionState?.scenarioId || "almacen";
  if (scenarioId !== "almacen") {
    return null;
  }

  const gameState = context.gameState;
  if (!gameState.flags) gameState.flags = {};
  if (!gameState.hotspotStates) gameState.hotspotStates = {};

  let message = `${action.role} usa ${action.card} sobre ${action.target}. La informacion queda registrada.`;
  let feedback = "Accion registrada. Comparadla con las otras perspectivas.";

  if (action.target === "pizarra" && action.card === "mirar_bien") {
    gameState.flags.codigoAlmacenParcial = true;
    feedback = "La pizarra contiene una parte fiable del codigo, pero hay un paso que parece desplazado.";
    message = "El Empollon extrae una regla parcial de la pizarra.";
  }

  if (action.target === "taquillas" && ["apanar", "desmontar"].includes(action.card)) {
    gameState.flags.mecanismoFisicoLocalizado = true;
    feedback = "Las taquillas revelan que el cierre tiene una pieza fisica oculta en otra realidad.";
    message = "La Manitas localiza el mecanismo fisico asociado a la salida.";
  }

  if (action.target === "caja" && ["y_si", "esto_vibra_raro"].includes(action.card)) {
    gameState.flags.objetosDuplicadosDetectados = true;
    feedback = "La caja confirma que un duplicado puede ser falso aunque parezca identico.";
    message = "La Mistica detecta la regla de duplicados falsos.";
  }

  if (action.target === "balones" && action.card === "empujar") {
    gameState.flags.contradiccionBalones = true;
    feedback = "Al moverlos, la cantidad de balones deja de cuadrar entre realidades.";
    message = "El Guaperas fuerza una contradiccion visible en los balones.";
  }

  if (action.target === "panel_salida" && action.card === "consultar_apuntes") {
    gameState.flags.codigoAlmacenCompleto = Boolean(gameState.flags.codigoAlmacenParcial);
    feedback = gameState.flags.codigoAlmacenCompleto
      ? "El codigo queda completo, pero el cierre fisico sigue pendiente."
      : "El panel pide una secuencia que todavia no esta completa.";
    message = gameState.flags.codigoAlmacenCompleto
      ? "El Empollon completa la logica numerica del panel."
      : "El Empollon confirma que falta una pista para el codigo.";
  }

  if (action.target === "panel_salida" && ["apanar", "puenteo_rapido"].includes(action.card)) {
    gameState.flags.mecanismoFisicoLiberado = Boolean(gameState.flags.mecanismoFisicoLocalizado);
    feedback = gameState.flags.mecanismoFisicoLiberado
      ? "El cierre fisico queda liberado. Ahora falta que el codigo sea correcto."
      : "El panel tiene una parte fisica que aun no habeis localizado.";
    message = gameState.flags.mecanismoFisicoLiberado
      ? "La Manitas libera el mecanismo fisico del panel."
      : "La Manitas confirma que falta localizar el mecanismo.";
  }

  if (gameState.flags.codigoAlmacenCompleto && gameState.flags.mecanismoFisicoLiberado) {
    gameState.flags.almacenSalidaLista = true;
    gameState.hotspotStates.panel_salida = "ready";
  }

  context.targetFeedback[action.target] = feedback;
  context.lastRoleDebug = message;
  context.actionLog.unshift(message);

  return message;
}
