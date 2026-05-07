import { getScenarioHotspotDiscoveries } from "./scenarioContent.js";

export const PLAYER_TOOLTIPS = {
  explore_hotspots: {
    id: "explore_hotspots",
    title: "Zonas de interaccion",
    text: "Explora el escenario. Acercate a zonas que reaccionen.",
  },
  object_card_selected: {
    id: "object_card_selected",
    title: "Objetivo seleccionado",
    text: "Esta ventana muestra pistas, objetos y cambios descubiertos.",
  },
  find_mobile_port: {
    id: "find_mobile_port",
    title: "Terminal movil",
    text: "Para actuar sobre este objetivo, encuentra su puerto en el terminal movil.",
  },
  chip_queued: {
    id: "chip_queued",
    title: "Chip en cola",
    text: "Tu accion espera al siguiente pulso para resolverse.",
    repeatable: true,
  },
  pulse_resolving: {
    id: "pulse_resolving",
    title: "Pulso temporal",
    text: "El pulso esta resolviendo los chips preparados. Observa el resultado.",
    repeatable: true,
  },
  locker_discovery_slots: {
    id: "locker_discovery_slots",
    title: "Analisis por capas",
    text: "Algunos objetivos revelan informacion en varios pasos.",
  },
  discovery_unlocked: {
    id: "discovery_unlocked",
    title: "Nueva capa detectada",
    text: "La inspeccion ha desbloqueado una pista persistente.",
  },
  partial_fail_sparks: {
    id: "partial_fail_sparks",
    title: "Reaccion anomala",
    text: "El objetivo ha respondido, pero la accion no ha sido suficiente.",
    repeatable: true,
  },
  resonance_gained: {
    id: "resonance_gained",
    title: "Resonancia",
    text: "Las contradicciones entre realidades generan energia util.",
  },
  compare_realities: {
    id: "compare_realities",
    title: "Realidades distintas",
    text: "Si algo no encaja, otro jugador puede estar viendo una version diferente.",
  },
  fusion_started: {
    id: "fusion_started",
    title: "Fusion de Realidades",
    text: "Sincroniza tu parte desde el terminal movil.",
    repeatable: true,
  },
  fusion_completed: {
    id: "fusion_completed",
    title: "Realidad estabilizada",
    text: "Las taquillas han cambiado. Vuelve al escenario para continuar.",
  },
  module_available: {
    id: "module_available",
    title: "Modulo encontrado",
    text: "Este objeto puede activar una parte del sistema de salida.",
  },
  exit_panel_device: {
    id: "exit_panel_device",
    title: "Panel de salida",
    text: "Este dispositivo combina codigo, resonancia y objetos clave.",
  },
  exit_ready: {
    id: "exit_ready",
    title: "Salida preparada",
    text: "El sistema reconoce las condiciones necesarias para escapar.",
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
    const resonanceTooltip = pickTooltip("resonance_gained", seen);
    if (resonanceTooltip) return resonanceTooltip;
  }

  if (selectedTargetId) {
    const selectedCandidates = ["object_card_selected"];

    if (selectedTargetId === "panel_salida") {
      selectedCandidates.push("exit_panel_device");
    }

    if (selectedTargetId === "taquillas") {
      if (hasUnlockedDiscovery(selectedTargetId, gameState, scenarioId, variant)) {
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

  return pickTooltip("explore_hotspots", seen);
}
