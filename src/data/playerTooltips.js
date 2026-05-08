import { getScenarioHotspotDiscoveries } from "./scenarioContent.js";

export const PLAYER_TOOLTIPS = {
  explore_hotspots: {
    id: "explore_hotspots",
    title: "Almacén cerrado",
    text: "Conexión activa. Estáis en el almacén junto al gimnasio. La puerta tiene un cierre eléctrico y no responde. Explorad el espacio: algo aquí puede ayudaros a salir.",
    hint: "Acércate a las zonas del almacén para activarlas. Cuando una zona reaccione podrás inspeccionarla o interactuar con ella.",
  },
  guide_icon_hint: {
    id: "guide_icon_hint",
    title: "El sistema te acompaña",
    text: "El sistema irá enviándote mensajes según avancéis. Puedes consultarlos en cualquier momento desde el icono de guía en el panel lateral.",
    hint: "Icono lateral de guía → historial de todos los mensajes recibidos en esta partida.",
  },
  object_card_selected: {
    id: "object_card_selected",
    title: "Algo ha llamado tu atención",
    text: "Observa bien lo que tienes delante. Esta zona puede esconder más de lo que parece. Comparte lo que ves con el grupo.",
    hint: "Esta ventana muestra pistas, objetos y cambios que se vayan descubriendo en la zona seleccionada.",
  },
  find_mobile_port: {
    id: "find_mobile_port",
    title: "Usa el terminal",
    text: "Para intervenir aquí necesitas el dispositivo. Busca el puerto de este objetivo en el terminal: desde ahí podéis actuar sobre la anomalía.",
    hint: "Abre el terminal móvil (icono lateral) y localiza el puerto de esta zona para ejecutar una acción sobre ella.",
  },
  chip_queued: {
    id: "chip_queued",
    title: "Acción en marcha",
    text: "Has puesto algo en movimiento. La anomalía aún no ha respondido. Espera el próximo pulso para ver qué ocurre.",
    hint: "Tu acción está en cola. Se resolverá cuando el supervisor active el siguiente pulso de anomalía.",
    repeatable: true,
  },
  pulse_resolving: {
    id: "pulse_resolving",
    title: "Onda de anomalía",
    text: "Algo se mueve en el espacio. La onda está procesando lo que habéis hecho. Quietos: observad.",
    hint: "El pulso de anomalía está resolviendo los chips en cola. Los efectos aparecerán al terminar.",
    repeatable: true,
  },
  locker_discovery_slots: {
    id: "locker_discovery_slots",
    title: "Cierre inestable",
    text: "La taquilla no se comporta igual para todos. Su cerradura parece existir en dos estados a la vez. Antes de abrirla, el grupo necesita estabilizar esa contradicción.",
    hint: "La taquilla tiene capas de descubrimiento pendientes. Usa Revelación para acumular carga y desbloquearlas antes de intentar la fusión.",
  },
  locker_ready_to_fuse: {
    id: "locker_ready_to_fuse",
    title: "Energía suficiente",
    text: "La tensión entre realidades ha acumulado suficiente energía. Podéis iniciar la fusión desde el terminal de la taquilla. Es cosa vuestra.",
    hint: "La resonancia compartida supera el umbral. Activa la fusión desde el terminal móvil en el puerto de taquillas. El supervisor solo observa.",
  },
  locker_open_with_key: {
    id: "locker_open_with_key",
    title: "Una sola realidad",
    text: "El cierre ya existe en una única versión. La llave debería funcionar ahora. Úsala sobre la taquilla.",
    hint: "La taquilla está en estado estabilizado. Arrastra la llave sobre ella con una acción de Alteración para abrirla.",
  },
  discovery_unlocked: {
    id: "discovery_unlocked",
    title: "Capa oculta visible",
    text: "La inspección ha revelado algo que no estaba ahí antes. O que siempre estuvo, pero nadie podía verlo.",
    hint: "Se ha desbloqueado un nuevo descubrimiento en esta zona. Consulta la ventana de zona para ver la pista persistente.",
  },
  partial_fail_sparks: {
    id: "partial_fail_sparks",
    title: "Reacción incompleta",
    text: "El espacio ha respondido, pero algo falta. Más carga, más resonancia, o que alguien más intervenga desde su realidad.",
    hint: "La acción no alcanzó la carga necesaria. La energía acumulada queda guardada: otra acción sobre la misma zona continuará desde donde se quedó.",
    repeatable: true,
  },
  ambient_resonance_collect: {
    id: "ambient_resonance_collect",
    title: "Cúmulo detectado",
    text: "La inestabilidad del almacén suelta energía que se pierde por el espacio. Si la recogéis a tiempo, puede usarse para conectaros a los sistemas del lugar. Así funciona el internet de las cosas.",
    hint: "Mantén el cursor sobre un cúmulo luminoso 0,5 s para recogerlo. Suma +1 de resonancia compartida al grupo.",
  },
  resonance_gained: {
    id: "resonance_gained",
    title: "Contradicción detectada",
    text: "Eso que no cuadra tiene valor. Cuando dos realidades difieren, la tensión entre ellas genera energía que el grupo puede aprovechar.",
    hint: "Has ganado resonancia compartida. Este recurso se acumula para todo el grupo y se consume en las fusiones de realidad.",
  },
  compare_realities: {
    id: "compare_realities",
    title: "¿Veis lo mismo?",
    text: "Este objeto puede tener un aspecto distinto según quién lo mire. Antes de actuar, preguntad al grupo qué están viendo ellos.",
    hint: "Cada jugador puede ver una variante diferente de este objeto. Comparad por voz o chat antes de decidir qué acción aplicar.",
  },
  fusion_started: {
    id: "fusion_started",
    title: "Sincronización activa",
    text: "La fusión ha comenzado. Cada jugador debe confirmar su parte desde el terminal. La realidad no se estabiliza sola.",
    hint: "La sincronización activa requiere que las variantes A y B confirmen su parte en el terminal móvil. Cuando ambas confirmen, el objeto se fusionará.",
    repeatable: true,
  },
  fusion_completed: {
    id: "fusion_completed",
    title: "El espacio ha cambiado",
    text: "Algo en el almacén acaba de desplazarse. Volvéis al escenario: lo que antes no era posible ahora puede serlo.",
    hint: "La sincronización activa se ha completado. El objeto afectado pasa a estado estabilizado y admite nuevas interacciones.",
  },
  module_available: {
    id: "module_available",
    title: "Pieza del sistema",
    text: "Esto no está aquí por casualidad. Parece diseñado para encajar en algún punto del mecanismo de salida. Lleváoslo.",
    hint: "Has encontrado un módulo de sincronización. Llévalo al control de la puerta para activar su siguiente estado.",
  },
  exit_panel_device: {
    id: "exit_panel_device",
    title: "Control de la puerta",
    text: "Este es el mecanismo que gestiona el cierre eléctrico. Necesita el código correcto, energía acumulada y algún componente físico. Todo a la vez.",
    hint: "El control de la puerta combina: código numérico reconstruido, resonancia acumulada y el módulo físico. Interactúa con él desde el terminal cuando tengas los tres.",
  },
  exit_ready: {
    id: "exit_ready",
    title: "La puerta puede abrirse",
    text: "El sistema reconoce las condiciones. La salida está preparada. Solo falta que alguien la active.",
    hint: "Todas las condiciones de escape están satisfechas. Usa una acción de Alteración sobre el control de la puerta para activar la salida.",
    repeatable: true,
  },
};

function canShowTooltip(tooltip, seenIds) {
  return Boolean(tooltip && !seenIds.has(tooltip.id));
}

function pickTooltip(id, seenIds) {
  const tooltip = PLAYER_TOOLTIPS[id];
  return canShowTooltip(tooltip, seenIds) ? tooltip : null;
}

function pickFirst(ids, seenIds) {
  for (const id of ids) {
    const tooltip = pickTooltip(id, seenIds);
    if (tooltip) return tooltip;
  }
  return null;
}

function hasUnlockedDiscovery(targetId, gameState, scenarioId, variant) {
  return getScenarioHotspotDiscoveries(targetId, gameState, scenarioId, variant)
    .some((slot) => slot.unlocked);
}

function hasDiscoverySlots(targetId, gameState, scenarioId, variant) {
  return getScenarioHotspotDiscoveries(targetId, gameState, scenarioId, variant).length > 0;
}

function getScopedTargetKey(scenarioId, variant, targetId) {
  return `${scenarioId || "almacen"}_${variant || "A"}__${targetId}`;
}

export function resolvePlayerTooltip({
  selectedTargetId,
  queuedForPlayer,
  overlayActive,
  sparkVfxActive,
  fusionSession,
  fusionVfxActive,
  gameState,
  scenarioId,
  variant,
  resonanceGainActive,
  seenIds,
}) {
  const seen = seenIds || new Set();
  const flags = gameState?.flags || {};
  const sharedResonance = gameState?.sharedResonance || gameState?.resonance || {};
  const resonanceValue = Number(sharedResonance.value || 0);

  if (fusionVfxActive) {
    return null;
  }

  if (flags.almacenSalidaLista) {
    return pickTooltip("exit_ready", seen);
  }

  if (fusionSession?.status === "pending" && ["A", "B"].includes(variant)) {
    return pickTooltip("fusion_started", seen);
  }

  if (fusionSession?.status === "success") {
    const completed = pickTooltip("fusion_completed", seen);
    if (completed) return completed;
  }

  if (overlayActive) {
    return pickTooltip("pulse_resolving", seen);
  }

  if (sparkVfxActive) {
    return pickTooltip("partial_fail_sparks", seen);
  }

  if (queuedForPlayer) {
    return pickTooltip("chip_queued", seen);
  }

  if (flags.moduleSyncAvailable) {
    const moduleTooltip = pickTooltip("module_available", seen);
    if (moduleTooltip) return moduleTooltip;
  }

  if (resonanceGainActive) {
    return pickFirst(["ambient_resonance_collect", "resonance_gained"], seen);
  }

  if (selectedTargetId) {
    const selectedCandidates = ["object_card_selected"];

    if (selectedTargetId === "panel_salida") {
      selectedCandidates.push("exit_panel_device");
    }

    if (selectedTargetId === "taquillas") {
      const lockerState = gameState?.hotspotStates?.[getScopedTargetKey(scenarioId, variant, "taquillas")];

      if (lockerState === "LOCKER_FUSION") {
        selectedCandidates.push("locker_open_with_key");
      } else if (resonanceValue >= 6 && flags.contradiccionTaquillas) {
        selectedCandidates.push("locker_ready_to_fuse");
      } else if (hasUnlockedDiscovery(selectedTargetId, gameState, scenarioId, variant)) {
        selectedCandidates.push("discovery_unlocked");
      } else if (hasDiscoverySlots(selectedTargetId, gameState, scenarioId, variant)) {
        selectedCandidates.push("locker_discovery_slots");
      }
    }

    if (selectedTargetId === "llave_taquilla" || selectedTargetId === "horquilla") {
      selectedCandidates.push("compare_realities");
    }

    selectedCandidates.push("find_mobile_port");
    return pickFirst(selectedCandidates, seen);
  }

  return pickFirst(["explore_hotspots", "guide_icon_hint"], seen);
}
