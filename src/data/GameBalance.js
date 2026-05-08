// =============================================================================
// GameBalance.js — Todas las variables de tiempo y coste del juego
//
// Modificar aquí para rebalancear sin buscar en múltiples archivos.
// Cada sección corresponde a una mecánica. Los valores en segundos o
// milisegundos se indican explícitamente en el nombre de la variable.
// =============================================================================

// -----------------------------------------------------------------------------
// PULSO TEMPORAL
// El pulso es el ciclo que resuelve las acciones encoladas de los jugadores.
// -----------------------------------------------------------------------------
export const PULSE = {
  /** Tiempo mínimo entre pulsos automáticos (ms). */
  autoMinMs: 40_000,         // 40 s

  /** Tiempo máximo entre pulsos automáticos (ms). */
  autoMaxMs: 120_000,        // 2 min

  /** Tiempo mínimo absoluto aceptado para cualquier ventana de pulso (ms). */
  absoluteMinMs: 10_000,     // 10 s

  /** Segundos que tarda cada acción en ejecutarse dentro del pulso. */
  actionExecutionSeconds: 1,

  /** Segundos que se muestra el resultado antes de pasar a la siguiente acción. */
  resultDisplaySeconds: 3,
};

// -----------------------------------------------------------------------------
// CARGA DE ACCIÓN (SoftwareLoadMinigame)
// Tiempo que el jugador tiene para completar el minijuego de carga.
// -----------------------------------------------------------------------------
export const ACTION_LOAD = {
  /** Tiempo máximo para completar el minijuego de carga (ms). */
  attemptDurationMs: 10_000,   // 10 s

  /** Tiempo de carga por defecto si la carta no especifica uno (s). */
  defaultLoadTimeSeconds: 5,

  /** Tiempo de ejecución por defecto si la carta no especifica uno (s).
   *  Se usa dentro del pulso para animar la resolución de la acción. */
  defaultExecutionTimeSeconds: 3,
};

// -----------------------------------------------------------------------------
// MINIJUEGO DE RED (NodeGraph — terminal móvil)
// Timer del minijuego de conexión de nodos en el dispositivo.
// -----------------------------------------------------------------------------
export const NODE_GRAPH = {
  /** Segundos disponibles para completar el NodeGraph. */
  timerSeconds: 10,
};

// -----------------------------------------------------------------------------
// FUSION DE REALIDADES (FusionMinigame)
// Animación y transición al completar la fusión de taquillas.
// -----------------------------------------------------------------------------
export const FUSION = {
  /** Coste de resonancia necesario para activar la fusión de taquillas. */
  lockerFusionResonanceCost: 8,

  /** Milisegundos de espera antes de disparar onSuccess tras completar la fusión. */
  successDelayMs: 3_200,

  /** Milisegundos antes de descartar la pantalla de fusión en el dispositivo. */
  dismissDelayMs: 3_500,
};

// -----------------------------------------------------------------------------
// RESONANCIA
// Orbes de resonancia que aparecen en el mapa y el jugador puede recoger.
// -----------------------------------------------------------------------------
export const RESONANCE = {
  /** Tiempo visible del orbe antes de desparecer si no se recoge (ms). */
  spawnVisibleMs: 8_000,

  /** Tiempo mínimo entre spawns de orbe, carga 0 (ms). Reduce a la mitad con resonancia 0. */
  spawnMinMs: 25_000,

  /** Tiempo máximo entre spawns de orbe (ms). */
  spawnMaxMs: 40_000,

  /** Ms de hover necesarios sobre el orbe para recogerlo. */
  collectHoverMs: 500,

  /** Ms que se muestra el feedback de recompensa de resonancia. */
  collectFeedbackMs: 1_500,

  /** Ms que permanece activo el tooltip "resonancia ganada" tras recibir un premio. */
  tooltipActiveMs: 7_000,

  /** Ms que se muestra el feedback de premio de resonancia (reward animado). */
  rewardFeedbackMs: 2_000,   // ver resonanceRewardFeedbackTimerRef en PlayerScreen
};

// -----------------------------------------------------------------------------
// SLOTS DE DESCUBRIMIENTO (cartas de objeto)
// Coste de carga para desbloquear cada capa de análisis en un objetivo.
// Los valores concretos viven en scenarioContent.js (por slot/escenario),
// estos son los fallbacks y referencias para el diseño.
// -----------------------------------------------------------------------------
export const DISCOVERY = {
  /** Coste de carga por defecto para el slot 0 (primera capa). */
  defaultSlot0ChargeCost: 2,

  /** Coste de carga por defecto para el slot 1 (segunda capa). */
  defaultSlot1ChargeCost: 3,

  /** Segundos que tarda en revelarse cada slot tras la inspección exitosa. */
  slotRevealSeconds: 10,          // SEARCHING_SLOT_TIME en PlayerScreen

  /** Ms de desfase entre el inicio de búsqueda de slots consecutivos. */
  slotStaggerMs: 800,             // SLOT_STAGGER_MS en PlayerScreen
};

// -----------------------------------------------------------------------------
// LOBBY
// Cuenta atrás desde que se activa el lobby hasta que entran los jugadores.
// -----------------------------------------------------------------------------
export const LOBBY = {
  /** Milisegundos de cuenta atrás en el lobby antes de entrar a la partida. */
  countdownMs: 5_000,

  /** Ms de hold sobre el botón de "mantener presionado" en LobbyStage. */
  holdDurationMs: 1_000,
};

// -----------------------------------------------------------------------------
// POLLING (sincronización con Firebase)
// Con qué frecuencia cada pantalla consulta el estado remoto.
// -----------------------------------------------------------------------------
export const POLLING = {
  /** Intervalo de polling de PlayerScreen y GMScreen (ms). */
  mainIntervalMs: 1_000,

  /** Intervalo de polling de WaitingScreen y RoleSelectScreen (ms). */
  lobbyIntervalMs: 1_000,

  /** Debounce para publicar la cámara del jugador a Firebase (ms). */
  viewPublishDebounceMs: 420,

  /** Tiempo en ms tras el que la vista mirror de un jugador se considera obsoleta. */
  playerViewStaleMs: 15_000,
};

// -----------------------------------------------------------------------------
// VFX DE PANTALLA
// Duraciones de efectos visuales que afectan la lectura de estado del jugador.
// -----------------------------------------------------------------------------
export const VFX = {
  /** Ms que permanece activo el VFX de chispa (acción parcialmente fallida). */
  sparkDurationMs: 2_500,

  /** Ms que permanece activo el VFX de fusión. */
  fusionDurationMs: 4_000,

  /** Ms que tarda en cerrarse la consola de dispositivo. */
  deviceConsoleCloseDurationMs: 600,

  /** Ms de animación de arranque (boot) entre las primeras líneas de la consola. */
  deviceConsoleBootEarlyLineMs: 420,

  /** Ms de animación de arranque entre líneas después de las 3 primeras. */
  deviceConsoleBootLateLineMs: 220,

  /** Ms del intervalo de glitch de la consola. */
  deviceConsoleGlitchIntervalMs: 1_800,
};

// -----------------------------------------------------------------------------
// UI / FEEDBACK VISUAL
// Tiempos de notificaciones, tooltips y feedback que ven los jugadores.
// -----------------------------------------------------------------------------
export const UI = {
  /** Ms que se muestra el feedback de "copiado" en el panel GM. */
  copyFeedbackMs: 1_800,

  /** Ms entre cada carácter al escribir el texto del tooltip (efecto máquina de escribir). */
  tooltipTypeIntervalMs: 24,

  /** Delay antes de iniciar la línea de descripción en el tooltip (ms). */
  tooltipDescriptionDelayMs: 120,

  /** Ms del intervalo del tick del ActionQueueOverlay. */
  actionQueueOverlayTickMs: 80,

  /** Ms de refresco visual de WaitingScreen. */
  waitingScreenTickMs: 200,
};
