export const playerRoles = [
  {
    id: "empollon",
    label: "El Empollon",
    kicker: "Interpretar sistemas",
    text: "Lee protocolos y prepara resoluciones limpias.",
    cards: "mirar_bien, consultar_apuntes",
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
    cards: "apanar, puenteo_rapido, desmontar",
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
    cards: "a_lo_bestia, empujar",
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
    cards: "y_si, esto_vibra_raro, ritual_improvisado",
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
