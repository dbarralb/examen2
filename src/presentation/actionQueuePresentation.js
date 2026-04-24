import chipForceImage from "../../assets/Pantalla de juego/Chips/Chip_Fuerza.png";
import chipEngineeringImage from "../../assets/Pantalla de juego/Chips/Chip_Ingenieria.png";
import chipIntelligenceImage from "../../assets/Pantalla de juego/Chips/Chip_Inteligencia.png";
import chipMagicImage from "../../assets/Pantalla de juego/Chips/Chip_Magia.png";
import { getCard, getTarget } from "../data/gameData.js";

export const actionChipBlueprint = {
  actionTypes: {
    force: { label: "Fuerza", accentClassName: "force", chipImage: chipForceImage },
    intelligence: { label: "Inteligencia", accentClassName: "intelligence", chipImage: chipIntelligenceImage },
    magic: { label: "Magia", accentClassName: "magic", chipImage: chipMagicImage },
    engineering: { label: "Ingenieria", accentClassName: "engineering", chipImage: chipEngineeringImage },
  },
  targetFamilies: {
    door: { label: "Puerta", icon: "|>", accentClassName: "door" },
    container: { label: "Contenedor", icon: "[]", accentClassName: "container" },
    device: { label: "Dispositivo", icon: "##", accentClassName: "device" },
    sensor: { label: "Sensor", icon: "()", accentClassName: "sensor" },
    generic: { label: "Objeto", icon: "<>", accentClassName: "generic" },
  },
  statuses: {
    queued: { label: "En cola", icon: "Q", accentClassName: "queued" },
    executing: { label: "Ejecutando", icon: "X", accentClassName: "executing" },
    resolved: { label: "Resuelta", icon: "R", accentClassName: "resolved" },
  },
};

export function getActionChipType(action) {
  const roleId = action?.role || getCard(action?.card)?.roles?.[0];

  if (roleId === "guaperas") {
    return "force";
  }

  if (roleId === "empollon") {
    return "intelligence";
  }

  if (roleId === "mistica") {
    return "magic";
  }

  return "engineering";
}

export function getTargetFamily(targetId) {
  if (targetId === "door") {
    return "door";
  }

  if (targetId === "locker") {
    return "container";
  }

  if (["panel", "electrical_box"].includes(targetId)) {
    return "device";
  }

  if (targetId === "sensor") {
    return "sensor";
  }

  return "generic";
}

export function formatCardLabel(cardOrAction) {
  const card = typeof cardOrAction?.card === "string" ? getCard(cardOrAction.card) : null;
  const rawLabel = cardOrAction?.label || cardOrAction?.id || card?.label || cardOrAction?.card || "accion";
  const normalized = rawLabel.replaceAll("_", " ").trim();

  if (!normalized) {
    return "Accion";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function buildQueuedActionChipModel(action) {
  const actionType = getActionChipType(action);
  const targetFamily = getTargetFamily(action?.target);
  const status = action?.status || "queued";
  const actionBlueprint = actionChipBlueprint.actionTypes[actionType] || actionChipBlueprint.actionTypes.engineering;
  const targetBlueprint = actionChipBlueprint.targetFamilies[targetFamily] || actionChipBlueprint.targetFamilies.generic;
  const statusBlueprint = actionChipBlueprint.statuses[status] || actionChipBlueprint.statuses.queued;
  const target = getTarget(action?.target);
  const card = getCard(action?.card);

  return {
    id: action?.id || `${action?.role || "role"}-${action?.target || "target"}-${action?.loadedAt || action?.createdAt || 0}`,
    actionType,
    targetFamily,
    actionLabel: actionBlueprint.label,
    actionAccentClassName: actionBlueprint.accentClassName,
    chipImage: actionBlueprint.chipImage,
    targetIcon: targetBlueprint.icon,
    targetLabel: target?.label || targetBlueprint.label,
    targetAccentClassName: targetBlueprint.accentClassName,
    status,
    statusLabel: statusBlueprint.label,
    statusAccentClassName: statusBlueprint.accentClassName,
    statusIcon: statusBlueprint.icon,
    playerLabel: action?.player || action?.role || "Jugador",
    cardLabel: formatCardLabel(card || action),
    targetId: action?.target || "generic",
    label: `${formatCardLabel(card || action)} sobre ${target?.label || targetBlueprint.label}`,
  };
}

export function buildQueuedActionChipModels(queuedActions) {
  return queuedActions.map(buildQueuedActionChipModel);
}
