export const playerRoles = [
  {
    id: "empollon",
    label: "El Empollón",
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
    id: "bruto",
    label: "El Bruto",
    kicker: "Forzar progreso",
    text: "Empuja, revienta y desbloquea avances con riesgo.",
    cards: "a_lo_bestia, empujar",
    status: "danger",
    lobby: {
      idleImage: "/assets/Lobby/Characters/Bruto_Idle.png",
      selectedImage: "/assets/Lobby/Characters/Bruto_Selected.png",
    },
  },
  {
    id: "mistica",
    label: "La Mística",
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

export const lobbyRoleOrder = ["bruto", "empollon", "mistica", "manitas"];

export function getRole(roleId) {
  return playerRoles.find((role) => role.id === roleId) || playerRoles[0];
}

export function getLobbyRoles() {
  return lobbyRoleOrder.map((roleId) => getRole(roleId));
}
