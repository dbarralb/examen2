export const ACTION_KINDS = {
  INSPECTION: "inspection",
  INTERACTION: "interaction",
};

export const ACTION_LABELS = {
  [ACTION_KINDS.INSPECTION]: "Accion_Inspeccion",
  [ACTION_KINDS.INTERACTION]: "Accion_Interaccion",
};

export const ACTION_DESCRIPTIONS = {
  [ACTION_KINDS.INSPECTION]: "Inspeccionar una zona para obtener resonancia de anomalia.",
  [ACTION_KINDS.INTERACTION]: "Manipula un objeto para intentar arreglarlo o resolverlo.",
};

const actionKindByCardId = {
  empollon_accion_inspeccion: ACTION_KINDS.INSPECTION,
  empollon_accion_interaccion: ACTION_KINDS.INTERACTION,
  manitas_accion_inspeccion: ACTION_KINDS.INSPECTION,
  manitas_accion_interaccion: ACTION_KINDS.INTERACTION,
  guaperas_accion_inspeccion: ACTION_KINDS.INSPECTION,
  guaperas_accion_interaccion: ACTION_KINDS.INTERACTION,
  mistica_accion_inspeccion: ACTION_KINDS.INSPECTION,
  mistica_accion_interaccion: ACTION_KINDS.INTERACTION,
};

export function getActionKind(cardOrAction) {
  const explicitKind = cardOrAction?.actionKind || cardOrAction?.actionType;
  if (explicitKind) return explicitKind;

  const cardId = typeof cardOrAction === "string"
    ? cardOrAction
    : cardOrAction?.card || cardOrAction?.id;

  return actionKindByCardId[cardId] || null;
}

export function isInspectionAction(cardOrAction) {
  return getActionKind(cardOrAction) === ACTION_KINDS.INSPECTION;
}

export function isInteractionAction(cardOrAction) {
  return getActionKind(cardOrAction) === ACTION_KINDS.INTERACTION;
}

export function getActionLabel(cardOrAction) {
  const kind = getActionKind(cardOrAction);
  return ACTION_LABELS[kind] || "Accion";
}

export function getActionDescription(cardOrAction) {
  const kind = getActionKind(cardOrAction);
  return ACTION_DESCRIPTIONS[kind] || "Ejecuta una accion narrativa sobre el objeto elegido.";
}
