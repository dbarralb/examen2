// Room and zone definitions for each sala.
// Each zone references target IDs from gameData.js — the same targets, actions, and
// inventory system work inside every zone.
//
// Puzzles use `solvedWhen(gameState)` — pure predicates evaluated after each pulse action.
// `requiredInputs` lists output keys from other puzzles that must be solved first.
// `outputs` are flag strings made available when this puzzle is solved.

export const rooms = [
  {
    id: "sala1_el_cierre",
    label: "El Cierre",
    salaNumber: 1,
    narrative: "En el almacén del gimnasio, las linternas iluminan mochilas abiertas y caras cómplices. Es una noche cualquiera para un plan estúpido: robar un examen y salir sin hacer ruido.",
    zones: [
      { id: "inicio", label: "Almacén del gimnasio", targetIds: [] },
      { id: "z1",     label: "Vestíbulo",             targetIds: ["panel"] },
      { id: "z2",     label: "Panel de seguridad",    targetIds: ["sensor"] },
      { id: "z3",     label: "Pasillo de acceso",     targetIds: ["door"] },
      { id: "z4",     label: "Cuadro eléctrico",      targetIds: ["electrical_box", "locker"] },
      { id: "final",  label: "Puerta al instituto",   targetIds: ["sports_gear"] },
    ],
    puzzles: [
      {
        id: "p_protocol_order",
        label: "Orden del protocolo",
        zone: "z1",
        type: "local",
        targetId: "panel",
        requiredInputs: [],
        outputs: ["protocol_order"],
        solvedWhen: (gs) => gs.panelState === "understood" || gs.panelState === "tampered",
      },
      {
        id: "p_restore_energy",
        label: "Restaurar energía",
        zone: "z4",
        type: "local",
        targetId: "electrical_box",
        requiredInputs: [],
        outputs: ["energy_active"],
        solvedWhen: (gs) => gs.lockerState === "clean_open" || gs.lockerState === "broken_open",
      },
      {
        id: "p_neutralize_sensor",
        label: "Neutralizar sensor",
        zone: "z2",
        type: "connected",
        targetId: "sensor",
        requiredInputs: ["protocol_order"],
        outputs: ["system_active"],
        solvedWhen: (gs) => gs.sensorState === "fooled" || gs.sensorState === "disabled",
      },
      {
        id: "p_open_exit",
        label: "Abrir la salida",
        zone: "z3",
        type: "synthesis",
        targetId: "door",
        requiredInputs: ["protocol_order", "energy_active", "system_active"],
        outputs: ["exit_open"],
        solvedWhen: (gs) => gs.doorState === "clean_open" || gs.doorState === "forced_open",
      },
    ],
    ecos: [
      {
        id: "eco_sala1_01",
        text: "Esto ya ha pasado…",
        zone: "final",
        codexLevel: 1,
        discoveredWhen: (_gs, ps) => ps["p_open_exit"]?.solved === true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Sala 4 — Hórus (4 runs, seleccionado por teamProfile)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "horus_run_force",
    label: "Hórus — Los que fuerzan",
    salaNumber: 4,
    narrative: "La fuerza bruta os trajo aquí. Hórus os muestra lo que la fuerza no puede resolver.",
    zones: [
      { id: "inicio", label: "Cámara de contención",     targetIds: [] },
      { id: "z1",     label: "Pasillo blindado",          targetIds: ["h_containment"] },
      { id: "z2",     label: "Sala de pruebas físicas",   targetIds: ["h_relay", "h_memory_node"] },
      { id: "z3",     label: "Archivo de resistencia",    targetIds: ["h_archive", "h_projector"] },
      { id: "z4",     label: "Núcleo de decisión",        targetIds: ["h_decision_panel", "h_core_access"] },
      { id: "final",  label: "Salida de Hórus",           targetIds: ["h_data_terminal"] },
    ],
    puzzles: [
      {
        id: "ph_f_breach", label: "Forzar contención", zone: "z1", type: "local",
        targetId: "h_containment", requiredInputs: [], outputs: ["containment_breached"],
        solvedWhen: (gs) => gs.hContainmentState === "breached" || gs.hContainmentState === "bypassed",
      },
      {
        id: "ph_f_relay", label: "Estabilizar relé", zone: "z2", type: "local",
        targetId: "h_relay", requiredInputs: [], outputs: ["relay_stable"],
        solvedWhen: (gs) => gs.hRelayState === "stable",
      },
      {
        id: "ph_f_archive", label: "Descifrar archivo", zone: "z3", type: "connected",
        targetId: "h_archive", requiredInputs: ["containment_breached"], outputs: ["archive_decoded"],
        solvedWhen: (gs) => gs.hArchiveState === "decoded",
      },
      {
        id: "ph_f_decision", label: "Tomar la decisión", zone: "z4", type: "synthesis",
        targetId: "h_decision_panel", requiredInputs: ["relay_stable", "archive_decoded"], outputs: ["horus_decided"],
        solvedWhen: (gs) => gs.hDecisionPanelState === "decided",
      },
    ],
    ecos: [
      {
        id: "eco_horus_force_01", text: "La fuerza es un eco de otra cosa. Algo que Hórus ya midió.",
        zone: "z3", codexLevel: 1,
        discoveredWhen: (_gs, ps) => ps["ph_f_archive"]?.solved === true,
      },
      {
        id: "eco_horus_force_02", text: "Cada iteración repite el patrón. Vosotros lo rompisteis… a golpes.",
        zone: "final", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["ph_f_decision"]?.solved === true,
      },
    ],
  },

  {
    id: "horus_run_analysis",
    label: "Hórus — Los que analizan",
    salaNumber: 4,
    narrative: "Cada dato que recogisteis dejó una huella. Hórus os devuelve el espejo.",
    zones: [
      { id: "inicio", label: "Laboratorio de observación", targetIds: [] },
      { id: "z1",     label: "Estación de datos",          targetIds: ["h_data_terminal"] },
      { id: "z2",     label: "Cámara de patrones",         targetIds: ["h_memory_node", "h_projector"] },
      { id: "z3",     label: "Archivo cifrado",            targetIds: ["h_archive", "h_relay"] },
      { id: "z4",     label: "Núcleo de decisión",         targetIds: ["h_decision_panel", "h_core_access"] },
      { id: "final",  label: "Salida de Hórus",            targetIds: ["h_data_terminal"] },
    ],
    puzzles: [
      {
        id: "ph_a_data", label: "Extraer datos clave", zone: "z1", type: "local",
        targetId: "h_data_terminal", requiredInputs: [], outputs: ["data_extracted"],
        solvedWhen: (gs) => gs.hDataTerminalState === "extracted",
      },
      {
        id: "ph_a_pattern", label: "Reconocer el patrón", zone: "z2", type: "local",
        targetId: "h_memory_node", requiredInputs: [], outputs: ["pattern_found"],
        solvedWhen: (gs) => gs.hMemoryNodeState === "pattern_found",
      },
      {
        id: "ph_a_decrypt", label: "Descifrar archivo", zone: "z3", type: "connected",
        targetId: "h_archive", requiredInputs: ["data_extracted"], outputs: ["archive_decoded"],
        solvedWhen: (gs) => gs.hArchiveState === "decoded",
      },
      {
        id: "ph_a_decision", label: "Tomar la decisión", zone: "z4", type: "synthesis",
        targetId: "h_decision_panel", requiredInputs: ["pattern_found", "archive_decoded"], outputs: ["horus_decided"],
        solvedWhen: (gs) => gs.hDecisionPanelState === "decided",
      },
    ],
    ecos: [
      {
        id: "eco_horus_analysis_01", text: "Los datos no mienten, pero tampoco dicen la verdad completa.",
        zone: "z2", codexLevel: 1,
        discoveredWhen: (_gs, ps) => ps["ph_a_pattern"]?.solved === true,
      },
      {
        id: "eco_horus_analysis_02", text: "Hórus catalogó cada decisión. Incluso las que creíais libres.",
        zone: "final", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["ph_a_decision"]?.solved === true,
      },
    ],
  },

  {
    id: "horus_run_eco",
    label: "Hórus — Los que siguen los ecos",
    salaNumber: 4,
    narrative: "Escuchasteis lo que otros ignoraron. Hórus os muestra de dónde vienen esas voces.",
    zones: [
      { id: "inicio", label: "Cámara de resonancia",   targetIds: [] },
      { id: "z1",     label: "Galería de ecos",         targetIds: ["h_projector"] },
      { id: "z2",     label: "Nodo de memoria profunda", targetIds: ["h_memory_node", "h_relay"] },
      { id: "z3",     label: "Archivo de iteraciones",  targetIds: ["h_archive", "h_data_terminal"] },
      { id: "z4",     label: "Núcleo de decisión",      targetIds: ["h_decision_panel", "h_core_access"] },
      { id: "final",  label: "Salida de Hórus",         targetIds: ["h_projector"] },
    ],
    puzzles: [
      {
        id: "ph_e_echo", label: "Seguir el eco", zone: "z1", type: "local",
        targetId: "h_projector", requiredInputs: [], outputs: ["echo_traced"],
        solvedWhen: (gs) => gs.hProjectorState === "echo_traced",
      },
      {
        id: "ph_e_memory", label: "Activar memoria profunda", zone: "z2", type: "local",
        targetId: "h_memory_node", requiredInputs: [], outputs: ["deep_memory_active"],
        solvedWhen: (gs) => gs.hMemoryNodeState === "deep_active",
      },
      {
        id: "ph_e_iterations", label: "Leer las iteraciones", zone: "z3", type: "connected",
        targetId: "h_archive", requiredInputs: ["echo_traced"], outputs: ["iterations_read"],
        solvedWhen: (gs) => gs.hArchiveState === "iterations_read",
      },
      {
        id: "ph_e_decision", label: "Tomar la decisión", zone: "z4", type: "synthesis",
        targetId: "h_decision_panel", requiredInputs: ["deep_memory_active", "iterations_read"], outputs: ["horus_decided"],
        solvedWhen: (gs) => gs.hDecisionPanelState === "decided",
      },
    ],
    ecos: [
      {
        id: "eco_horus_eco_01", text: "Los ecos no son recuerdos. Son instrucciones que nadie sabe que sigue.",
        zone: "z2", codexLevel: 1,
        discoveredWhen: (_gs, ps) => ps["ph_e_memory"]?.solved === true,
      },
      {
        id: "eco_horus_eco_02", text: "Hórus no creó los ecos. Solo los amplificó para ver quién escuchaba.",
        zone: "final", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["ph_e_decision"]?.solved === true,
      },
    ],
  },

  {
    id: "horus_run_balanced",
    label: "Hórus — Equilibrados",
    salaNumber: 4,
    narrative: "No destacáis en nada. Destacáis en todo. Hórus os pone a prueba de otra manera.",
    zones: [
      { id: "inicio", label: "Vestíbulo neutral",        targetIds: [] },
      { id: "z1",     label: "Estación multidisciplinar", targetIds: ["h_data_terminal", "h_containment"] },
      { id: "z2",     label: "Sala de calibración",       targetIds: ["h_memory_node", "h_relay"] },
      { id: "z3",     label: "Archivo compuesto",         targetIds: ["h_archive", "h_projector"] },
      { id: "z4",     label: "Núcleo de decisión",        targetIds: ["h_decision_panel", "h_core_access"] },
      { id: "final",  label: "Salida de Hórus",           targetIds: ["h_data_terminal"] },
    ],
    puzzles: [
      {
        id: "ph_b_multi", label: "Resolver prueba combinada", zone: "z1", type: "local",
        targetId: "h_containment", requiredInputs: [], outputs: ["multi_solved"],
        solvedWhen: (gs) => gs.hContainmentState === "bypassed",
      },
      {
        id: "ph_b_calibrate", label: "Calibrar sistemas", zone: "z2", type: "local",
        targetId: "h_relay", requiredInputs: [], outputs: ["systems_calibrated"],
        solvedWhen: (gs) => gs.hRelayState === "calibrated",
      },
      {
        id: "ph_b_archive", label: "Sintetizar archivo", zone: "z3", type: "connected",
        targetId: "h_archive", requiredInputs: ["multi_solved"], outputs: ["archive_synthesized"],
        solvedWhen: (gs) => gs.hArchiveState === "synthesized",
      },
      {
        id: "ph_b_decision", label: "Tomar la decisión", zone: "z4", type: "synthesis",
        targetId: "h_decision_panel", requiredInputs: ["systems_calibrated", "archive_synthesized"], outputs: ["horus_decided"],
        solvedWhen: (gs) => gs.hDecisionPanelState === "decided",
      },
    ],
    ecos: [
      {
        id: "eco_horus_balanced_01", text: "El equilibrio no es ausencia de extremos. Es su coexistencia.",
        zone: "z3", codexLevel: 1,
        discoveredWhen: (_gs, ps) => ps["ph_b_archive"]?.solved === true,
      },
      {
        id: "eco_horus_balanced_02", text: "Hórus esperaba un patrón claro. Vosotros sois la anomalía.",
        zone: "final", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["ph_b_decision"]?.solved === true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Sala 5 — Finales (4 variantes, seleccionado por decisión de Hórus + métricas)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "sala5_integracion",
    label: "Integración",
    salaNumber: 5,
    narrative: "Elegisteis integraros. El sistema os acepta… pero aceptar no es lo mismo que pertenecer.",
    condition: { decision: "integration" },
    zones: [
      { id: "inicio", label: "Antesala de aceptación",   targetIds: [] },
      { id: "z1",     label: "Pasarela de verificación",  targetIds: ["s5_firewall"] },
      { id: "z2",     label: "Cámara de fusión",          targetIds: ["s5_merge_console", "s5_truth_archive"] },
      { id: "z3",     label: "Corredor de identidad",     targetIds: ["s5_codex_reader"] },
      { id: "z4",     label: "Sala de integración final", targetIds: ["s5_merge_console", "s5_final_door"] },
      { id: "final",  label: "El otro lado",              targetIds: [] },
    ],
    puzzles: [
      {
        id: "p5i_verify", label: "Verificación de identidad", zone: "z1", type: "local",
        targetId: "s5_firewall", requiredInputs: [], outputs: ["identity_verified"],
        solvedWhen: (gs) => gs.s5FirewallState === "verified",
      },
      {
        id: "p5i_merge", label: "Iniciar fusión", zone: "z2", type: "local",
        targetId: "s5_merge_console", requiredInputs: [], outputs: ["merge_started"],
        solvedWhen: (gs) => gs.s5MergeConsoleState === "merging",
      },
      {
        id: "p5i_codex", label: "Leer el Codex completo", zone: "z3", type: "connected",
        targetId: "s5_codex_reader", requiredInputs: ["identity_verified"], outputs: ["codex_read"],
        solvedWhen: (gs) => gs.s5CodexReaderState === "read_complete",
      },
      {
        id: "p5i_final", label: "Completar integración", zone: "z4", type: "synthesis",
        targetId: "s5_final_door", requiredInputs: ["merge_started", "codex_read"], outputs: ["game_complete"],
        solvedWhen: (gs) => gs.s5FinalDoorState === "open",
      },
    ],
    ecos: [
      {
        id: "eco_s5i_01", text: "Integración no significa desaparecer. Significa dejar de ser solo tú.",
        zone: "z4", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["p5i_final"]?.solved === true,
      },
    ],
  },

  {
    id: "sala5_rechazo",
    label: "Rechazo",
    salaNumber: 5,
    narrative: "Rechazasteis el sistema. Ahora el sistema os rechaza a vosotros.",
    condition: { decision: "rejection" },
    zones: [
      { id: "inicio", label: "Zona de exclusión",        targetIds: [] },
      { id: "z1",     label: "Muro de contención",        targetIds: ["s5_firewall", "s5_exile_gate"] },
      { id: "z2",     label: "Pasillo de borrado",        targetIds: ["s5_truth_archive"] },
      { id: "z3",     label: "Cámara de resistencia",     targetIds: ["s5_codex_reader", "s5_mask_generator"] },
      { id: "z4",     label: "Puerta de no retorno",      targetIds: ["s5_exile_gate", "s5_final_door"] },
      { id: "final",  label: "El exterior",               targetIds: [] },
    ],
    puzzles: [
      {
        id: "p5r_wall", label: "Romper el muro", zone: "z1", type: "local",
        targetId: "s5_firewall", requiredInputs: [], outputs: ["wall_breached"],
        solvedWhen: (gs) => gs.s5FirewallState === "breached",
      },
      {
        id: "p5r_erase", label: "Evitar el borrado", zone: "z2", type: "local",
        targetId: "s5_truth_archive", requiredInputs: [], outputs: ["erasure_survived"],
        solvedWhen: (gs) => gs.s5TruthArchiveState === "preserved",
      },
      {
        id: "p5r_resist", label: "Resistir el sistema", zone: "z3", type: "connected",
        targetId: "s5_codex_reader", requiredInputs: ["wall_breached"], outputs: ["resistance_proven"],
        solvedWhen: (gs) => gs.s5CodexReaderState === "resistance_logged",
      },
      {
        id: "p5r_final", label: "Cruzar la puerta", zone: "z4", type: "synthesis",
        targetId: "s5_final_door", requiredInputs: ["erasure_survived", "resistance_proven"], outputs: ["game_complete"],
        solvedWhen: (gs) => gs.s5FinalDoorState === "open",
      },
    ],
    ecos: [
      {
        id: "eco_s5r_01", text: "El rechazo es la forma más antigua de libertad. Y la más cara.",
        zone: "z4", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["p5r_final"]?.solved === true,
      },
    ],
  },

  {
    id: "sala5_engano",
    label: "Engaño",
    salaNumber: 5,
    narrative: "Elegisteis simular. El sistema cree que sois parte de él. ¿Lo sois?",
    condition: { decision: "deception" },
    zones: [
      { id: "inicio", label: "Sala de espejos",          targetIds: [] },
      { id: "z1",     label: "Generador de identidad",    targetIds: ["s5_mask_generator"] },
      { id: "z2",     label: "Red de vigilancia",         targetIds: ["s5_firewall", "s5_truth_archive"] },
      { id: "z3",     label: "Archivo de versiones",      targetIds: ["s5_codex_reader", "s5_merge_console"] },
      { id: "z4",     label: "Terminal de validación",     targetIds: ["s5_exam_terminal", "s5_final_door"] },
      { id: "final",  label: "La simulación",             targetIds: [] },
    ],
    puzzles: [
      {
        id: "p5d_mask", label: "Crear la máscara", zone: "z1", type: "local",
        targetId: "s5_mask_generator", requiredInputs: [], outputs: ["mask_created"],
        solvedWhen: (gs) => gs.s5MaskGeneratorState === "mask_active",
      },
      {
        id: "p5d_evade", label: "Evadir detección", zone: "z2", type: "local",
        targetId: "s5_firewall", requiredInputs: [], outputs: ["detection_evaded"],
        solvedWhen: (gs) => gs.s5FirewallState === "fooled",
      },
      {
        id: "p5d_falsify", label: "Falsificar registros", zone: "z3", type: "connected",
        targetId: "s5_codex_reader", requiredInputs: ["mask_created"], outputs: ["records_falsified"],
        solvedWhen: (gs) => gs.s5CodexReaderState === "falsified",
      },
      {
        id: "p5d_final", label: "Superar la validación", zone: "z4", type: "synthesis",
        targetId: "s5_exam_terminal", requiredInputs: ["detection_evaded", "records_falsified"], outputs: ["game_complete"],
        solvedWhen: (gs) => gs.s5ExamTerminalState === "validated",
      },
    ],
    ecos: [
      {
        id: "eco_s5d_01", text: "La mejor mentira es la que contiene una verdad que nadie quiere oír.",
        zone: "z4", codexLevel: 2,
        discoveredWhen: (_gs, ps) => ps["p5d_final"]?.solved === true,
      },
    ],
  },

  {
    id: "sala5_el_examen",
    label: "El Examen",
    salaNumber: 5,
    narrative: "No es un examen que aprobar. Es un examen que entender. Siempre lo fue.",
    condition: { ecoCount: { gte: 4 }, forceCount: { lte: 2 }, contradictionsFound: true },
    priority: true, // overrides decision-based selection when conditions met
    zones: [
      { id: "inicio", label: "Aula vacía",                targetIds: [] },
      { id: "z1",     label: "Pupitres desordenados",      targetIds: ["s5_truth_archive", "s5_codex_reader"] },
      { id: "z2",     label: "Pizarra borrada",            targetIds: ["s5_exam_terminal"] },
      { id: "z3",     label: "Despacho del director",      targetIds: ["s5_merge_console", "s5_mask_generator"] },
      { id: "z4",     label: "La sala del Examen",         targetIds: ["s5_exam_terminal", "s5_final_door"] },
      { id: "final",  label: "Después",                    targetIds: [] },
    ],
    puzzles: [
      {
        id: "p5x_truth", label: "Encontrar la verdad", zone: "z1", type: "local",
        targetId: "s5_truth_archive", requiredInputs: [], outputs: ["truth_found"],
        solvedWhen: (gs) => gs.s5TruthArchiveState === "truth_revealed",
      },
      {
        id: "p5x_question", label: "Formular la pregunta", zone: "z2", type: "local",
        targetId: "s5_exam_terminal", requiredInputs: [], outputs: ["question_asked"],
        solvedWhen: (gs) => gs.s5ExamTerminalState === "question_formulated",
      },
      {
        id: "p5x_understand", label: "Comprender el sistema", zone: "z3", type: "connected",
        targetId: "s5_merge_console", requiredInputs: ["truth_found"], outputs: ["system_understood"],
        solvedWhen: (gs) => gs.s5MergeConsoleState === "understood",
      },
      {
        id: "p5x_final", label: "Responder al Examen", zone: "z4", type: "synthesis",
        targetId: "s5_exam_terminal", requiredInputs: ["question_asked", "system_understood"], outputs: ["game_complete"],
        solvedWhen: (gs) => gs.s5ExamTerminalState === "answered",
      },
    ],
    ecos: [
      {
        id: "eco_s5x_01", text: "El Examen nunca fue sobre lo que sabéis. Fue sobre lo que elegís no saber.",
        zone: "z3", codexLevel: 3,
        discoveredWhen: (_gs, ps) => ps["p5x_understand"]?.solved === true,
      },
      {
        id: "eco_s5x_02", text: "Hórus no es el sistema. Hórus es el que pregunta si el sistema debería existir.",
        zone: "final", codexLevel: 3,
        discoveredWhen: (_gs, ps) => ps["p5x_final"]?.solved === true,
      },
    ],
  },
];

/** Get a room definition by its ID. */
export function getRoom(roomId) {
  return rooms.find((r) => r.id === roomId) || null;
}

/** Get a specific zone within a room. */
export function getZone(roomId, zoneId) {
  const room = getRoom(roomId);
  return room?.zones.find((z) => z.id === zoneId) || null;
}

/** Get all zones for a room. */
export function getZonesForRoom(roomId) {
  const room = getRoom(roomId);
  return room?.zones || [];
}

/** Get all puzzles for a room. */
export function getPuzzlesForRoom(roomId) {
  const room = getRoom(roomId);
  return room?.puzzles || [];
}

/** Get all ecos for a room. */
export function getEcosForRoom(roomId) {
  const room = getRoom(roomId);
  return room?.ecos || [];
}
