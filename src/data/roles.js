export const playerRoles = [
  {
    id: "empollon",
    label: "El Empollon",
    kicker: "Interpretar sistemas",
    text: "Lee protocolos y prepara resoluciones limpias.",
    cards: "Accion_Inspeccion, Accion_Interaccion",
    status: "info",
    lobby: {
      idleImage: "/assets/Lobby/Characters/Empollon_Idle.png",
      selectedImage: "/assets/Lobby/Characters/Empollon_Selected.png",
    },
  },
  {
    id: "manitas",
    label: "La Manitas",
    kicker: "Manipular mecanismos",
    text: "Trastea, desmonta y puentea objetos tecnicos.",
    cards: "Accion_Inspeccion, Accion_Interaccion",
    status: "warning",
    lobby: {
      idleImage: "/assets/Lobby/Characters/Manitas_Idle.png",
      selectedImage: "/assets/Lobby/Characters/Manitas_Selected.png",
    },
  },
  {
    id: "guaperas",
    label: "El Guaperas",
    kicker: "Forzar progreso",
    text: "Empuja, revienta y desbloquea avances con riesgo.",
    cards: "Accion_Inspeccion, Accion_Interaccion",
    status: "danger",
    lobby: {
      idleImage: "/assets/Lobby/Characters/Guaperas_Idle.png",
      selectedImage: "/assets/Lobby/Characters/Guaperas_Selected.png",
    },
  },
  {
    id: "mistica",
    label: "La Mistica",
    kicker: "Logica rara util",
    text: "Encuentra patrones absurdos y soluciones alternativas.",
    cards: "Accion_Inspeccion, Accion_Interaccion",
    status: "muted",
    lobby: {
      idleImage: "/assets/Lobby/Characters/Mistica_Idle.png",
      selectedImage: "/assets/Lobby/Characters/Mistica_Selected.png",
    },
  },
];

export const lobbyRoleOrder = ["guaperas", "empollon", "mistica", "manitas"];

export function normalizeRoleId(roleId) {
  return roleId;
}

export function getRole(roleId) {
  const normalizedRoleId = normalizeRoleId(roleId);
  return playerRoles.find((role) => role.id === normalizedRoleId) || playerRoles[0];
}

export function getLobbyRoles() {
  return lobbyRoleOrder.map((roleId) => getRole(roleId));
}
