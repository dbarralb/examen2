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
    access: { label: "Acceso", icon: "|>", accentClassName: "door" },
    container: { label: "Contenedor", icon: "[]", accentClassName: "container" },
    device: { label: "Dispositivo", icon: "##", accentClassName: "device" },
    info: { label: "Informacion", icon: "i", accentClassName: "generic" },
    sensor: { label: "Sensor", icon: "()", accentClassName: "sensor" },
    generic: { label: "Objeto", icon: "<>", accentClassName: "generic" },
  },
  statuses: {
    queued: { label: "En cola", icon: "Q", accentClassName: "queued" },
    executing: { label: "Ejecutando", icon: "X", accentClassName: "executing" },
    resolved: { label: "Resuelta", icon: "R", accentClassName: "resolved" },
  },
};

export const actionInfoCopy = {
  mirar_bien: "Observa detalles y protocolos para descubrir como interactuar con seguridad.",
  consultar_apuntes: "Contrasta pistas con teoria y revela la logica oculta de un sistema.",
  apanar: "Ajusta mecanismos con precision para preparar una apertura o reparacion limpia.",
  puenteo_rapido: "Improvisa un bypass tecnico rapido con riesgo si el sistema no esta entendido.",
  desmontar: "Abre, separa o inutiliza componentes fisicos de un dispositivo.",
  a_lo_bestia: "Aplica fuerza bruta para romper bloqueos cuando la delicadeza deja de importar.",
  empujar: "Aplica presion directa para mover, abrir o forzar un objeto fisico.",
  y_si: "Prueba una solucion improbable que puede conectar patrones que nadie esperaba.",
  esto_vibra_raro: "Percibe senales extranas y detecta patrones ocultos en el entorno.",
  ritual_improvisado: "Convierte intuicion rara en una secuencia experimental de activacion.",
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
  if (targetId === "panel_salida") {
    return "device";
  }

  if (["taquillas", "caja"].includes(targetId)) {
    return "container";
  }

  if (targetId === "pizarra") {
    return "info";
  }

  if (targetId === "salida") {
    return "access";
  }

  return "generic";
}

export function formatCardLabel(cardOrAction) {
  const card = typeof cardOrAction?.card === "string" ? getCard(cardOrAction.card) : null;
  const rawLabel = cardOrAction?.label || card?.label || cardOrAction?.card || cardOrAction?.id || "accion";
  const normalized = rawLabel.replaceAll("_", " ").trim();

  if (!normalized) {
    return "Accion";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function buildActionInfoModel(card) {
  const actionType = getActionChipType({ card: card?.id });
  const actionBlueprint = actionChipBlueprint.actionTypes[actionType] || actionChipBlueprint.actionTypes.engineering;

  return {
    id: card?.id || "accion",
    cardLabel: formatCardLabel(card),
    actionLabel: actionBlueprint.label,
    description: actionInfoCopy[card?.id] || "Ejecuta una accion narrativa sobre el objeto elegido.",
  };
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
