const CLIENT_ID_STORAGE_KEY = "elExamen2.clientId";
const SESSION_CODE_STORAGE_KEY = "elExamen2.sessionCode";

const localClientId = getOrCreateClientId();

const legacyRoleAliases = {
  bruto: "guaperas",
};

function normalizeRoleId(roleId) {
  return legacyRoleAliases[roleId] || roleId;
}

const config = {
  clientId: localClientId,
  playerName: `Jugador ${localClientId.slice(-4).toUpperCase()}`,
  currentRole: normalizeRoleId(document.body.dataset.role || "empollon"),
  firebaseBaseUrl: "https://project-butterfly-d0242-default-rtdb.firebaseio.com",
};

const urlParams = new URLSearchParams(window.location.search);
const isGmMonitorView = urlParams.get("view") === "gm-monitor";

if (isGmMonitorView) {
  document.body.classList.add("gm-monitor-view");
}

const timing = {
  actionLoadSeconds: 5,
  actionExecutionSeconds: 3,
  pulseChargeSeconds: 10,
  resultOverlaySeconds: 5,
  autoPulseSeconds: 15,
};

const roles = {
  empollon: {
    label: "El Empollón",
    className: "role-empollon",
    deviceTitle: "Cuaderno de protocolos",
    deviceText: "Manual temporal para interpretar paneles, mensajes del sistema y pistas técnicas.",
  },
  manitas: {
    label: "La Manitas",
    className: "role-manitas",
    deviceTitle: "Kit de apaños",
    deviceText: "Herramientas improvisadas para preparar cerraduras, puentear paneles y desmontar sensores.",
  },
  guaperas: {
    label: "El guaperas",
    className: "role-bruto",
    deviceTitle: "Medidor de empuje",
    deviceText: "Panel placeholder para acciones físicas directas y consecuencias de fuerza bruta.",
  },
  mistica: {
    label: "La Mística",
    className: "role-mistica",
    deviceTitle: "Oráculo absurdo",
    deviceText: "Espacio para patrones raros, intuiciones imposibles y soluciones alternativas.",
  },
  gm: {
    label: "Game Master",
    className: "role-gm",
    deviceTitle: "Panel de control",
    deviceText: "Controla el inicio, reinicio y resolución compartida de la partida.",
  },
};

const cards = [
  { id: "mirar_bien", label: "mirar_bien", roles: ["empollon"], image: "assets/actions/Mirar_bien_accion.png" },
  { id: "consultar_apuntes", label: "consultar_apuntes", roles: ["empollon"], image: "assets/actions/Consultar_apuntes_accion.png" },
  { id: "apañar", label: "apañar", roles: ["manitas"], image: "assets/actions/apanar.png" },
  { id: "puenteo_rapido", label: "puenteo_rapido", roles: ["manitas"], image: "assets/actions/puenteo_rapido.png" },
  { id: "desmontar", label: "desmontar", roles: ["manitas"], image: "assets/actions/desmontar.png" },
  { id: "a_lo_bestia", label: "a_lo_bestia", roles: ["guaperas"], image: "assets/actions/a_lo_bestia.png" },
  { id: "empujar", label: "empujar", roles: ["guaperas"], image: "assets/actions/empujar.png" },
  { id: "y_si", label: "y_si", roles: ["mistica"], image: "assets/actions/y_si.png" },
  { id: "esto_vibra_raro", label: "esto_vibra_raro", roles: ["mistica"], image: "assets/actions/esto_vibra_raro.png" },
  { id: "ritual_improvisado", label: "ritual_improvisado", roles: ["mistica"], image: "assets/actions/ritual_improvisado.png" },
];

const targets = [
  { id: "door", label: "puerta", stateKey: "doorState", x: 82, y: 42, w: 5, h: 8 },
  { id: "panel", label: "panel", stateKey: "panelState", x: 66, y: 36, w: 5, h: 8 },
  { id: "sensor", label: "sensor", stateKey: "sensorState", x: 50, y: 18, w: 5, h: 8 },
  { id: "locker", label: "taquilla", stateKey: "lockerState", x: 18, y: 42, w: 5, h: 8 },
  { id: "electrical_box", label: "cuadro eléctrico", stateKey: "electricalBoxState", x: 35, y: 32, w: 5, h: 8 },
  { id: "sports_gear", label: "material deportivo", stateKey: "sportsGearState", x: 48, y: 68, w: 5, h: 8 },
];

const objectImages = {
  panel: {
    active: "assets/objects/panel_active.png",
    understood: "assets/objects/panel_understood.png",
    tampered: "assets/objects/panel_tampered.png",
  },
  sensor: {
    active: "assets/objects/sensor_active.png",
    pattern_detected: "assets/objects/sensor_pattern_detected.png",
    fooled: "assets/objects/sensor_fooled.png",
    disabled: "assets/objects/sensor_disabled.png",
  },
  locker: {
    closed: "assets/objects/locker_closed.png",
    clean_open_complete: "assets/objects/locker_clean_open_note_complete.png",
    broken_open_partial: "assets/objects/locker_broken_open_note_partial.png",
  },
  electrical_box: {
    idle: "assets/objects/electrical_box_idle.png",
  },
  sports_gear: {
    idle: "assets/objects/sports_gear_idle.png",
  },
  alarm: {
    on: "assets/objects/alarm_active_overlay.png",
  },
};

const queuedActions = [];
const actionLog = ["Sistema listo. Selecciona carta y target para encolar una acción."];
const chatMessages = [
  { author: "GM", text: "Bienvenidos al gimnasio." },
  { author: "Jugador 2", text: "Voy a mirar el panel." },
];

const gameState = {
  doorState: "closed",
  panelState: "active",
  sensorState: "active",
  lockerState: "closed",
  noteState: "hidden",
  alarmState: "off",
  electricalBoxState: "idle",
  sportsGearState: "idle",
  loreFlagTestRevealed: false,
  hiddenRouteFlag: false,
  noteFeedbackShown: false,
  partialNoteFeedbackShown: false,
  cleanExitFeedbackShown: false,
  panelHintKnown: false,
  lockerPrepared: false,
  doorPrepared: false,
  sensorPatternDetected: false,
  sensorTrickedThisPulse: false,
};

const targetFeedback = {
  door: "Sin revisar.",
  panel: "Activo. Esperando lectura o manipulación.",
  sensor: "Activo. Detectando el entorno.",
  locker: "Cerrada.",
  electrical_box: "Sin interacción todavía.",
  sports_gear: "Material tirado por el gimnasio.",
};

let selectedCardId = null;
let selectedTargetId = null;
let lastRoleDebug = "Sin acciones resueltas todavía.";
let lastRoleActions = {};
let sessionStatus = "role_select";
let gameTimer = createInitialGameTimer();
let pulseState = createInitialPulseState();
let localPendingLoad = null;
let localLoadTimer = null;
let localRenderTimer = null;
let autoPulseEnabled = false;
let autoPulseTimer = null;
let gmOwnedPulseId = null;
let remoteEventsStarted = false;
let applyingRemoteState = false;
let remotePollTimer = null;
let lastRemoteSnapshot = "";
let targetStateSnapshot = {};
let sessionAccessCode = "";
const updatedTargetIds = new Set();

const sceneEl = document.querySelector("#scene");
const cardsListEl = document.querySelector("#cards-list");
const queueListEl = document.querySelector("#queue-list");
const logListEl = document.querySelector("#log-list");
const chatListEl = document.querySelector("#chat-list");
const chatFormEl = document.querySelector("#chat-form");
const chatInputEl = document.querySelector("#chat-input");
const warningEl = document.querySelector("#action-warning");
const targetStatusEl = document.querySelector("#selection-status");
const cardStatusEl = document.querySelector("#card-status");
const gameTimerEl = document.querySelector("#game-timer");
const gameSessionStatusEl = document.querySelector("#game-session-status");
const sessionCodeDisplayEl = document.querySelector("#session-code-display");
const playerRoleLabelEl = document.querySelector("#player-role-label");
const deviceScreenEl = document.querySelector("#device-screen");
const startGameButtonEl = document.querySelector("#start-game-button");
const resetGameButtonEl = document.querySelector("#reset-game-button");
const intentPreviewEl = document.querySelector("#intent-preview");

function renderTargets() {
  if (!sceneEl) {
    return;
  }

  sceneEl.querySelectorAll(".hotspot, .target-info-popover").forEach((node) => node.remove());
  sceneEl.querySelectorAll(".alarm-overlay").forEach((overlay) => overlay.remove());

  if (gameState.alarmState === "on") {
    const alarmOverlay = document.createElement("img");
    alarmOverlay.className = "alarm-overlay";
    alarmOverlay.src = objectImages.alarm.on;
    alarmOverlay.alt = "Alarma activa";
    alarmOverlay.draggable = false;
    sceneEl.appendChild(alarmOverlay);
  }

  targets.forEach((target) => {
    const button = document.createElement("button");
    button.className = "hotspot";
    button.type = "button";
    button.dataset.target = target.id;
    button.dataset.state = getTargetState(target);
    button.title = target.label;
    button.style.left = `${target.x}%`;
    button.style.top = `${target.y}%`;
    button.style.width = `${target.w}%`;
    button.style.height = `${target.h}%`;

    if (selectedTargetId === target.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedTargetId = target.id;
      warningEl.textContent = "";
      renderTargets();
      renderSelectionStatus();
    });

    sceneEl.appendChild(button);

    if (selectedTargetId === target.id) {
      renderTargetInfo(target);
    }
  });

  renderPulseResultOverlay();
}

function renderPulseResultOverlay() {
  const existingOverlay = sceneEl.querySelector(".pulse-result-overlay");

  if (config.currentRole === "gm" || !isPulseResultOverlayActive()) {
    if (existingOverlay) {
      existingOverlay.remove();
    }
    return;
  }

  const overlay = existingOverlay || document.createElement("aside");
  let message = overlay.querySelector(".pulse-result-message");
  let track = overlay.querySelector(".progress-track");
  let fill = track ? track.querySelector("span") : null;

  if (!existingOverlay) {
    overlay.className = "pulse-result-overlay";

    message = document.createElement("p");
    message.className = "pulse-result-message";

    track = document.createElement("div");
    track.className = "progress-track";
    fill = document.createElement("span");
    track.appendChild(fill);

    overlay.append(message, track);
    sceneEl.appendChild(overlay);
  }

  message.textContent = pulseState.resultOverlay.message || "Accion resuelta.";

  const total = pulseState.resultOverlay.endsAt - pulseState.resultOverlay.startedAt;
  const progress = total > 0 ? ((Date.now() - pulseState.resultOverlay.startedAt) / total) * 100 : 0;
  fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

function renderTargetInfo(target) {
  const popover = document.createElement("article");
  popover.className = "target-info-popover";
  popover.dataset.target = target.id;
  popover.style.left = `min(${target.x + target.w + 1}%, calc(100% - 260px))`;
  popover.style.top = `min(${target.y}%, calc(100% - 170px))`;

  const imagePath = getTargetImage(target);
  if (imagePath) {
    const image = document.createElement("img");
    image.className = "target-info-image";
    image.src = imagePath;
    image.alt = target.label;
    image.draggable = false;
    popover.appendChild(image);
  }

  const title = document.createElement("h3");
  title.textContent = target.label;

  const state = document.createElement("p");
  state.className = "target-info-state";
  state.textContent = `Estado: ${getTargetStateLabel(target)}`;

  const feedback = document.createElement("p");
  feedback.className = "target-info-feedback";
  feedback.textContent = targetFeedback[target.id];

  popover.append(title, state, feedback);

  if (config.currentRole !== "gm") {
    popover.appendChild(createActionDropSlot(target));
  }

  sceneEl.appendChild(popover);
}

function createActionDropSlot(target) {
  const slot = document.createElement("section");
  const pendingForTarget = localPendingLoad && localPendingLoad.target === target.id ? localPendingLoad : null;
  const queuedForPlayer = getQueuedActionForCurrentPlayer();
  const isBlocked = Boolean(localPendingLoad || queuedForPlayer || isPulseResultOverlayActive());
  const isUpdated = updatedTargetIds.has(target.id);

  slot.className = "action-drop-slot";
  slot.dataset.target = target.id;

  if (pendingForTarget) {
    const remaining = Math.max(0, pendingForTarget.endsAt - Date.now());
    const progress = Math.min(100, Math.max(0, ((pendingForTarget.durationMs - remaining) / pendingForTarget.durationMs) * 100));
    slot.classList.add("loading");
    slot.appendChild(createSlotLabel(`${pendingForTarget.card} cargando`));
    slot.appendChild(createProgressBar(progress));

    const cancel = document.createElement("button");
    cancel.className = "slot-cancel-button";
    cancel.type = "button";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", cancelLocalPendingLoad);
    slot.appendChild(cancel);
    return slot;
  }

  if (queuedForPlayer && queuedForPlayer.target === target.id) {
    slot.classList.add("queued");
    slot.appendChild(createSlotLabel(`${queuedForPlayer.card} espera pulso`));
    return slot;
  }

  if (isUpdated) {
    slot.classList.add("updated");
    slot.appendChild(createSlotLabel("Objeto actualizado. Suelta una acción para continuar."));
  } else if (isPulseResultOverlayActive()) {
    slot.classList.add("blocked");
    slot.appendChild(createSlotLabel("Mira el resultado. Acciones bloqueadas."));
  } else if (isBlocked) {
    slot.classList.add("blocked");
    slot.appendChild(createSlotLabel("Slot bloqueado: ya tienes una acción preparada."));
  } else {
    slot.appendChild(createSlotLabel("Suelta una acción aquí"));
  }

  slot.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = isBlocked ? "none" : "copy";
    slot.classList.add(isBlocked ? "blocked-hover" : "drag-over");
  });

  slot.addEventListener("dragenter", (event) => {
    event.preventDefault();
    slot.classList.add(isBlocked ? "blocked-hover" : "drag-over");
  });

  slot.addEventListener("dragleave", () => {
    slot.classList.remove("drag-over", "blocked-hover");
  });

  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    slot.classList.remove("drag-over", "blocked-hover");
    const cardId = event.dataTransfer.getData("application/x-card-id") || event.dataTransfer.getData("text/plain") || selectedCardId;
    startLocalActionLoad(cardId, target.id);
  });

  return slot;
}

function createSlotLabel(text) {
  const label = document.createElement("p");
  label.className = "slot-label";
  label.textContent = text;
  return label;
}

function createProgressBar(progress) {
  const track = document.createElement("div");
  track.className = "progress-track";
  const fill = document.createElement("span");
  fill.style.width = `${progress}%`;
  track.appendChild(fill);
  return track;
}

function renderCards() {
  cardsListEl.innerHTML = "";

  if (config.currentRole === "gm") {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "El GM no tiene pull de cartas. Usa el panel de control para iniciar, resetear o resolver.";
    cardsListEl.appendChild(empty);
    return;
  }

  const visibleCards = cards.filter((card) => {
    return card.roles.includes(config.currentRole);
  });

  visibleCards.forEach((card) => {
    const button = document.createElement("button");
    button.className = "card-button";
    button.type = "button";
    button.dataset.card = card.id;
    button.draggable = true;
    button.setAttribute("aria-label", card.label);

    if (card.image) {
      button.classList.add("image-card");

      const image = document.createElement("img");
      image.src = card.image;
      image.alt = card.label;
      image.draggable = false;
      button.appendChild(image);
    } else {
      button.textContent = card.label;
    }

    if (selectedCardId === card.id) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedCardId = card.id;
      warningEl.textContent = "";
      renderCards();
      renderSelectionStatus();
    });

    button.addEventListener("dragstart", (event) => {
      selectedCardId = card.id;
      button.classList.add("dragging");
      event.dataTransfer.setData("application/x-card-id", card.id);
      event.dataTransfer.setData("text/plain", card.id);
      event.dataTransfer.effectAllowed = "copy";
      warningEl.textContent = "";
      renderSelectionStatus();
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("dragging");
    });

    cardsListEl.appendChild(button);
  });
}

async function enqueueAction() {
  if (!selectedCardId || !selectedTargetId) {
    warningEl.textContent = "Abre la ventana del objeto y arrastra una carta al slot.";
    return;
  }

  startLocalActionLoad(selectedCardId, selectedTargetId);
}

function startLocalActionLoad(cardId, targetId) {
  const card = getCard(cardId);

  if (sessionStatus !== "in_game") {
    warningEl.textContent = "La partida no esta en curso.";
    renderTargets();
    return;
  }

  if (!hasValidSessionAccess({ accessCode: sessionAccessCode })) {
    warningEl.textContent = "Codigo de sesion no valido.";
    navigateWithFade("index.html");
    return;
  }

  if (isPulseResultOverlayActive()) {
    warningEl.textContent = "Espera a que termine la notificacion del pulso.";
    renderTargets();
    return;
  }

  if (!card || !card.roles.includes(config.currentRole)) {
    warningEl.textContent = "Esa carta no pertenece a tu rol.";
    return;
  }

  if (localPendingLoad) {
    warningEl.textContent = "Ya hay una acción cargándose. Cancélala o espera a que termine.";
    renderTargets();
    return;
  }

  if (getQueuedActionForCurrentPlayer()) {
    warningEl.textContent = "Ya tienes una acción esperando este pulso.";
    renderTargets();
    return;
  }

  const now = Date.now();
  const loadTimeSeconds = card.loadTimeSeconds || timing.actionLoadSeconds;
  localPendingLoad = {
    id: createActionId(),
    clientId: config.clientId,
    sessionCode: sessionAccessCode,
    player: config.playerName,
    role: config.currentRole,
    card: card.id,
    target: targetId,
    status: "pendingLoad",
    createdAt: now,
    loadStartedAt: now,
    endsAt: now + loadTimeSeconds * 1000,
    durationMs: loadTimeSeconds * 1000,
    loadTimeSeconds,
    executionTimeSeconds: card.executionTimeSeconds || timing.actionExecutionSeconds,
  };

  updatedTargetIds.delete(targetId);
  warningEl.textContent = `${card.id} cargando sobre ${getTargetLabel(targetId)}.`;
  scheduleLocalLoadCompletion();
  renderTargets();
  renderSelectionStatus();
}

function scheduleLocalLoadCompletion() {
  clearLocalLoadTimers();

  if (!localPendingLoad) {
    return;
  }

  localLoadTimer = window.setTimeout(finishLocalActionLoad, Math.max(0, localPendingLoad.endsAt - Date.now()));
  localRenderTimer = window.setInterval(renderTargets, 150);
}

async function finishLocalActionLoad() {
  if (!localPendingLoad) {
    return;
  }

  const action = {
    ...localPendingLoad,
    status: "queued",
    loadedAt: Date.now(),
  };

  delete action.endsAt;
  delete action.durationMs;
  clearLocalLoadTimers();
  localPendingLoad = null;

  try {
    lastRoleActions[action.role] = createLastRoleAction(action, "esperando pulso");
    await firebasePatch("", {
      [`queuedActions/${action.id}`]: action,
      [`lastRoleActions/${action.role}`]: lastRoleActions[action.role],
    });

    if (!queuedActions.some((item) => item.id === action.id)) {
      queuedActions.push(action);
    }

    warningEl.textContent = `${action.card} queda lista para el siguiente pulso.`;
  } catch (error) {
    warningEl.textContent = "No se pudo encolar la accion. Reintenta cuando vuelva Firebase.";
    console.error("Queue action failed", error);
  }

  renderQueue();
  renderTargets();
}

function cancelLocalPendingLoad() {
  if (!localPendingLoad) {
    return;
  }

  warningEl.textContent = `${localPendingLoad.card} cancelada antes de entrar en cola.`;
  clearLocalLoadTimers();
  localPendingLoad = null;
  renderTargets();
  renderSelectionStatus();
}

function clearLocalLoadTimers() {
  if (localLoadTimer) {
    window.clearTimeout(localLoadTimer);
    localLoadTimer = null;
  }

  if (localRenderTimer) {
    window.clearInterval(localRenderTimer);
    localRenderTimer = null;
  }
}

function getQueuedActionForCurrentPlayer() {
  return queuedActions.find((action) => {
    const sameClient = action.clientId ? action.clientId === config.clientId : action.player === config.playerName;
    return sameClient && action.role === config.currentRole && ["queued", "executing"].includes(action.status || "queued");
  });
}

function getCard(cardId) {
  return cards.find((card) => card.id === cardId);
}

async function resolvePulse() {
  await startPulseCycle({ immediate: false });
}

function renderQueue() {
  queueListEl.innerHTML = "";
  renderPulseBanner();

  if (queuedActions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No hay acciones esperando pulso.";
    queueListEl.appendChild(empty);
    return;
  }

  [...queuedActions].sort(sortActionsByLoadedAt).forEach((action, index) => {
    const item = document.createElement("article");
    const status = action.status || "queued";
    item.className = `queue-item queue-item-${status}`;

    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${action.card} -> ${getTargetLabel(action.target)}`;

    const meta = document.createElement("span");
    meta.textContent = `${action.player} (${getRoleLabel(action.role)}) - ${getActionStatusLabel(action)}`;
    item.append(title, meta);

    if (status === "executing" && action.executionStartedAt && action.executionEndsAt) {
      const total = action.executionEndsAt - action.executionStartedAt;
      const progress = total > 0 ? ((Date.now() - action.executionStartedAt) / total) * 100 : 0;
      item.appendChild(createProgressBar(Math.min(100, Math.max(0, progress))));
    }

    queueListEl.appendChild(item);
  });
}

function renderPulseBanner() {
  if (!pulseState || pulseState.status === "idle") {
    return;
  }

  const banner = document.createElement("article");
  banner.className = `pulse-banner pulse-${pulseState.status}`;

  const label = document.createElement("strong");
  label.textContent = pulseState.status === "charging" ? "Pulso en camino" : "Pulso ejecutandose";
  banner.appendChild(label);

  if (pulseState.status === "charging" && pulseState.pulseChargeStartedAt && pulseState.pulseChargeEndsAt) {
    const total = pulseState.pulseChargeEndsAt - pulseState.pulseChargeStartedAt;
    const progress = total > 0 ? ((Date.now() - pulseState.pulseChargeStartedAt) / total) * 100 : 0;
    banner.appendChild(createProgressBar(Math.min(100, Math.max(0, progress))));
  } else if (pulseState.currentActionId) {
    const current = queuedActions.find((action) => action.id === pulseState.currentActionId);
    const text = document.createElement("span");
    text.textContent = current ? `${current.card} sobre ${getTargetLabel(current.target)}` : "Accion en curso";
    banner.appendChild(text);
  }

  queueListEl.appendChild(banner);
}

function getActionStatusLabel(action) {
  const status = action.status || "queued";

  if (status === "executing") {
    return "ejecutando";
  }

  if (status === "resolved") {
    return "resuelta";
  }

  return "esperando pulso";
}

function sortActionsByLoadedAt(a, b) {
  const aTime = a.loadedAt || a.createdAt || 0;
  const bTime = b.loadedAt || b.createdAt || 0;
  return aTime - bTime;
}

async function refreshQueuedActionsFromRemote() {
  const remoteQueuedActions = await firebaseGet("queuedActions");
  queuedActions.splice(0, queuedActions.length, ...normalizeRemoteList(remoteQueuedActions));
  return queuedActions;
}

async function refreshPulseStateFromRemote() {
  const remotePulseState = await firebaseGet("pulseState");
  pulseState = { ...createInitialPulseState(), ...(remotePulseState || {}) };
  return pulseState;
}

async function acquireRemotePulseLock(nextPulseState) {
  const current = await firebaseGetWithEtag("pulseState");
  const currentPulseState = { ...createInitialPulseState(), ...(current.data || {}) };

  if (currentPulseState.status && currentPulseState.status !== "idle") {
    return false;
  }

  const result = await firebasePutIfMatch("pulseState", nextPulseState, current.etag);

  if (!result.ok) {
    return false;
  }

  pulseState = nextPulseState;
  gmOwnedPulseId = nextPulseState.pulseId;
  return true;
}

async function startPulseCycle({ immediate = false } = {}) {
  if (config.currentRole !== "gm") {
    warningEl.textContent = "Solo el GM gobierna los pulsos.";
    return;
  }

  if (pulseState && pulseState.status !== "idle") {
    warningEl.textContent = "Ya hay un pulso en curso.";
    return;
  }

  try {
    const pulseId = createActionId();
    const chargeMs = immediate ? 0 : timing.pulseChargeSeconds * 1000;
    const now = Date.now();
    const nextPulseState = {
      status: chargeMs > 0 ? "charging" : "executing",
      mode: autoPulseEnabled ? "auto" : "manual",
      pulseId,
      ownerClientId: config.clientId,
      pulseChargeStartedAt: chargeMs > 0 ? now : null,
      pulseChargeEndsAt: chargeMs > 0 ? now + chargeMs : null,
      pulseStartAt: null,
      currentActionId: null,
      resultOverlay: createEmptyResultOverlay(),
      updatedAt: now,
    };

    const lockAcquired = await acquireRemotePulseLock(nextPulseState);

    if (!lockAcquired) {
      warningEl.textContent = "Otro GM o pulso remoto ya controla la cola.";
      await refreshPulseStateFromRemote();
      renderQueue();
      return;
    }

    emit("El GM inicia un pulso. La cola se prepara.");
    renderQueue();
    renderLog();
    await firebasePatch("", { actionLog });

    if (chargeMs > 0) {
      await waitMs(chargeMs);
    }

    const pulseStartAt = Date.now();
    await refreshQueuedActionsFromRemote();
    const pulseActions = queuedActions
      .filter((action) => (action.status || "queued") === "queued" && (action.loadedAt || action.createdAt || 0) <= pulseStartAt)
      .sort(sortActionsByLoadedAt);

    if (pulseActions.length === 0) {
      pulseState = createInitialPulseState();
      gmOwnedPulseId = null;
      emit("El pulso termina sin acciones listas.");
      renderQueue();
      renderLog();
      await firebasePatch("", { pulseState, actionLog });
      return;
    }

    pulseState = {
      ...pulseState,
      status: "executing",
      pulseStartAt,
      currentActionId: null,
      updatedAt: Date.now(),
    };

    const pulseFlags = buildPulseFlags(pulseActions, gameState);
    emit(`Pulso cargado: ${pulseActions.length} acciones entran en ejecución.`);
    await firebasePatch("", { pulseState, actionLog });

    for (let index = 0; index < pulseActions.length; index += 1) {
      const action = pulseActions[index];
      const liveAction = queuedActions.find((item) => item.id === action.id);

      if (!liveAction) {
        continue;
      }

      const startedAt = Date.now();
      liveAction.status = "executing";
      liveAction.pulseId = pulseId;
      liveAction.executionStartedAt = startedAt;
      liveAction.executionEndsAt = startedAt + (liveAction.executionTimeSeconds || timing.actionExecutionSeconds) * 1000;
      pulseState.currentActionId = liveAction.id;
      pulseState.updatedAt = startedAt;
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "ejecutando");
      emit(`Ejecutando ${index + 1}/${pulseActions.length}: ${liveAction.card} sobre ${getTargetLabel(liveAction.target)}.`);
      renderQueue();
      renderLog();
      renderGmMonitorLastActions();
      await firebasePatch("", {
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        actionLog,
        lastRoleActions,
      });
      await waitMs((liveAction.executionTimeSeconds || timing.actionExecutionSeconds) * 1000);
      const resultMessage = resolveActionWithResult(liveAction, pulseFlags);
      liveAction.status = "resolved";
      liveAction.resolvedAt = Date.now();
      lastRoleActions[liveAction.role] = createLastRoleAction(liveAction, "resuelta", resultMessage);
      resolveNarrativeConsequences();
      resolveExitOutcome();
      showPulseResultOverlay(resultMessage, liveAction.id);
      renderQueue();
      renderLog();
      renderTargets();
      renderRoleInterface();
      await firebasePatch("", {
        gameState,
        targetFeedback,
        actionLog,
        [`queuedActions/${liveAction.id}`]: liveAction,
        pulseState,
        lastRoleActions,
        lastRoleDebug,
      });
      await waitMs(timing.resultOverlaySeconds * 1000);
      hidePulseResultOverlay();
      renderQueue();
      renderTargets();
      await firebasePatch("", { pulseState });
    }

    const remainingActions = queuedActions.filter((action) => (action.status || "queued") === "queued");
    queuedActions.splice(0, queuedActions.length, ...remainingActions);
    pulseState = createInitialPulseState();
    gmOwnedPulseId = null;
    emit("Pulso resuelto. Las acciones tardías esperan al siguiente.");
    renderQueue();
    renderLog();
    const resolvedActionDeletes = pulseActions.reduce((deletes, action) => {
      deletes[`queuedActions/${action.id}`] = null;
      return deletes;
    }, {});
    await firebasePatch("", {
      gameState,
      targetFeedback,
      actionLog,
      ...resolvedActionDeletes,
      pulseState,
      lastRoleActions,
      lastRoleDebug,
    });
  } catch (error) {
    console.error("[PULSE] Cycle FAILED", error);
    warningEl.textContent = "El pulso ha fallado. Revisa consola y prueba de nuevo.";
    pulseState = createInitialPulseState();
    gmOwnedPulseId = null;
    await firebasePatch("", { pulseState });
  } finally {
    gmOwnedPulseId = null;
    scheduleNextAutoPulse();
  }
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function scheduleNextAutoPulse() {
  if (!autoPulseEnabled || config.currentRole !== "gm") {
    return;
  }

  if (autoPulseTimer) {
    window.clearTimeout(autoPulseTimer);
  }

  autoPulseTimer = window.setTimeout(() => {
    startPulseCycle({ immediate: false });
  }, timing.autoPulseSeconds * 1000);
}

function toggleAutoPulse() {
  autoPulseEnabled = !autoPulseEnabled;
  warningEl.textContent = autoPulseEnabled ? "Pulso automatico activado por el GM." : "Pulso automatico pausado.";

  if (!autoPulseEnabled && autoPulseTimer) {
    window.clearTimeout(autoPulseTimer);
    autoPulseTimer = null;
  }

  scheduleNextAutoPulse();
  updateAutoPulseButton();
}

function updateAutoPulseButton() {
  const button = document.querySelector("#toggle-auto-pulse-button");

  if (button) {
    button.textContent = autoPulseEnabled ? "Pausar auto" : "Auto pulso";
  }
}

function createLastRoleAction(action, status, message = "") {
  return {
    player: action.player,
    role: action.role,
    card: action.card,
    target: action.target,
    status,
    message,
    updatedAt: Date.now(),
  };
}

function renderGmMonitorLastActions() {
  if (config.currentRole !== "gm") {
    return;
  }

  document.querySelectorAll("[data-last-action-role]").forEach((node) => {
    const role = node.dataset.lastActionRole;
    const action = lastRoleActions[role] || getLatestQueuedActionByRole(role);

    if (!action) {
      node.textContent = "Última acción: ninguna";
      return;
    }

    const status = action.status ? ` · ${action.status}` : "";
    const message = action.message ? ` · ${action.message}` : "";
    node.textContent = `${action.player || getRoleLabel(role)}: ${action.card} -> ${getTargetLabel(action.target)}${status}${message}`;
  });
}

function getLatestQueuedActionByRole(role) {
  return [...queuedActions]
    .filter((action) => action.role === role)
    .sort(sortActionsByLoadedAt)
    .pop();
}

function resolveActionWithResult(action, pulseFlags) {
  const previousFirstMessage = actionLog[0];
  resolveAction(action, pulseFlags);

  if (actionLog[0] && actionLog[0] !== previousFirstMessage) {
    return actionLog[0];
  }

  return "Accion resuelta.";
}

function showPulseResultOverlay(message, actionId) {
  const now = Date.now();
  pulseState.resultOverlay = {
    visible: true,
    message: message || "Accion resuelta.",
    startedAt: now,
    endsAt: now + timing.resultOverlaySeconds * 1000,
    actionId,
  };
  pulseState.updatedAt = now;
}

function hidePulseResultOverlay() {
  pulseState.resultOverlay = createEmptyResultOverlay();
  pulseState.updatedAt = Date.now();
}

function createEmptyResultOverlay() {
  return {
    visible: false,
    message: "",
    startedAt: null,
    endsAt: null,
    actionId: null,
  };
}

function isPulseResultOverlayActive() {
  return Boolean(
    pulseState &&
      pulseState.resultOverlay &&
      pulseState.resultOverlay.visible &&
      (!pulseState.resultOverlay.endsAt || pulseState.resultOverlay.endsAt > Date.now())
  );
}

function renderLog() {
  logListEl.innerHTML = "";

  actionLog.forEach((message) => {
    const item = document.createElement("li");
    item.className = getLogMessageClass(message);
    item.textContent = message;
    logListEl.appendChild(item);
  });
}

function getLogMessageClass(message) {
  const text = (message || "").toLowerCase();

  if (text.includes("empoll") || text.includes("jugador") && text.includes("empoll")) {
    return "log-message log-empollon";
  }

  if (text.includes("manitas")) {
    return "log-message log-manitas";
  }

  if (text.includes("guaperas") || text.includes("bruto")) {
    return "log-message log-bruto";
  }

  if (text.includes("mística") || text.includes("mistica")) {
    return "log-message log-mistica";
  }

  return "log-message";
}

function renderChat() {
  chatListEl.innerHTML = "";

  chatMessages.forEach((message) => {
    const item = document.createElement("li");
    item.className = getChatMessageClass(message);
    const author = document.createElement("strong");
    author.textContent = `${message.author}:`;
    item.append(author, ` ${message.text}`);
    chatListEl.appendChild(item);
  });

  chatListEl.scrollTop = chatListEl.scrollHeight;
}

function getChatMessageClass(message) {
  const author = (message.author || "").toLowerCase();

  if (author === "gm") {
    return "chat-message chat-gm";
  }

  if (author.includes("empoll")) {
    return "chat-message chat-empollon";
  }

  if (author.includes("manitas")) {
    return "chat-message chat-manitas";
  }

  if (author.includes("guaperas") || author.includes("bruto")) {
    return "chat-message chat-bruto";
  }

  if (author.includes("mística") || author.includes("mistica")) {
    return "chat-message chat-mistica";
  }

  if (author.includes("jugador")) {
    return "chat-message chat-player";
  }

  return "chat-message chat-event";
}

function renderSelectionStatus() {
  targetStatusEl.textContent = `Target seleccionado: ${getTargetLabel(selectedTargetId) || "ninguno"}`;
  cardStatusEl.textContent = `Carta: ${selectedCardId || "ninguna"}`;

  if (!intentPreviewEl) {
    return;
  }

  if (selectedCardId && selectedTargetId) {
    intentPreviewEl.textContent = `${selectedCardId} ${getTargetLabel(selectedTargetId)}`;
  } else if (selectedCardId) {
    intentPreviewEl.textContent = `${selectedCardId} ...`;
  } else if (selectedTargetId) {
    intentPreviewEl.textContent = `... ${getTargetLabel(selectedTargetId)}`;
  } else {
    intentPreviewEl.textContent = "Selecciona carta y objeto";
  }
}

function renderGameTimer() {
  if (!gameTimerEl) {
    return;
  }

  gameTimerEl.textContent = `Tiempo: ${formatTimerDuration(getGameTimerElapsedMs())}`;
  gameTimerEl.dataset.status = gameTimer.status || "idle";
}

function renderGameSessionStatus() {
  if (!gameSessionStatusEl) {
    return;
  }

  const label = sessionStatus === "in_game" ? "partida en curso" : "sin comenzar";
  gameSessionStatusEl.textContent = `Estado: ${label}`;
  gameSessionStatusEl.dataset.status = sessionStatus;

  if (sessionCodeDisplayEl) {
    sessionCodeDisplayEl.textContent = sessionAccessCode ? `Codigo: ${sessionAccessCode}` : "Codigo: sin generar";
  }
}

function getGameTimerElapsedMs() {
  const base = gameTimer.elapsedBeforeStartMs || 0;

  if (gameTimer.status === "running" && gameTimer.startedAt) {
    return base + Math.max(0, Date.now() - gameTimer.startedAt);
  }

  return base;
}

function formatTimerDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTargetLabel(targetId) {
  const target = targets.find((item) => item.id === targetId);
  return target ? target.label : "";
}

function getTargetState(target) {
  return gameState[target.stateKey] || "unknown";
}

function getTargetStateLabel(target) {
  if (target.id === "locker" && gameState.noteState !== "hidden") {
    return `${getTargetState(target)} / nota: ${gameState.noteState}`;
  }

  if (target.id === "door" && gameState.doorPrepared) {
    return `${getTargetState(target)} / preparada`;
  }

  if (target.id === "sensor" && gameState.sensorPatternDetected && gameState.sensorState === "active") {
    return "active / patrón detectado";
  }

  return getTargetState(target);
}

function getTargetImage(target) {
  const state = getTargetState(target);

  if (target.id === "sensor" && gameState.sensorPatternDetected && gameState.sensorState === "active") {
    return objectImages.sensor.pattern_detected;
  }

  if (target.id === "locker" && gameState.lockerState === "clean_open" && gameState.noteState === "complete") {
    return objectImages.locker.clean_open_complete;
  }

  if (target.id === "locker" && gameState.lockerState === "broken_open" && gameState.noteState === "partial") {
    return objectImages.locker.broken_open_partial;
  }

  return objectImages[target.id] ? objectImages[target.id][state] : "";
}

function setTargetFeedback(targetId, message, action) {
  targetFeedback[targetId] = message;

  if (action && ["empollon", "mistica"].includes(action.role)) {
    lastRoleDebug = `${getRoleLabel(action.role)} hizo ${action.card} sobre ${getTargetLabel(action.target)}: ${message}`;
  }
}


function resolveAction(action, pulseFlags = buildPulseFlags([], gameState)) {
  const previousPanelState = gameState.panelState;
  const panelSolved = pulseFlags.panelSolved || ["understood", "tampered"].includes(gameState.panelState);
  const sensorSolved = pulseFlags.sensorSolved || ["fooled", "disabled"].includes(gameState.sensorState);
  const doorPrepared = pulseFlags.doorPrepared || gameState.doorPrepared;
  const lockerPrepared = pulseFlags.lockerPrepared || gameState.lockerPrepared;
  const sensorPatternDetected = pulseFlags.sensorPatternDetected || gameState.sensorPatternDetected;

  if (action.card === "mirar_bien" && action.target === "panel") {
    gameState.panelState = "understood";
    gameState.panelHintKnown = true;
    setTargetFeedback("panel", "El Empollón interpreta el protocolo 7-B.", action);
    emit("El Empollón interpreta el protocolo 7-B.");
    return;
  }

  if (action.card === "consultar_apuntes" && action.target === "panel") {
    gameState.panelState = "understood";
    gameState.panelHintKnown = true;
    setTargetFeedback("panel", "Los apuntes explican el bloqueo digital y la redundancia física.", action);
    emit("Los apuntes revelan la redundancia física del sistema.");
    return;
  }

  if (action.card === "puenteo_rapido" && action.target === "panel") {
    gameState.panelState = "tampered";
    setTargetFeedback("panel", "Bypass temporal aplicado por La Manitas.", action);
    emit("La Manitas fuerza un bypass temporal del panel.");

    if (previousPanelState !== "understood" && !pulseFlags.panelUnderstood) {
      gameState.alarmState = "on";
      setTargetFeedback("panel", "Bypass inseguro: alerta secundaria activada.", action);
      emit("El bypass activa una alerta secundaria por manipulación insegura.");
    } else if (pulseFlags.panelUnderstood) {
      emit("La lectura del equipo convierte el bypass en una maniobra coordinada.");
    }
    return;
  }

  if (action.card === "apañar" && action.target === "locker") {
    gameState.lockerPrepared = true;
    setTargetFeedback("locker", "Cerradura aflojada. Lista para abrir sin destrozar.", action);
    emit("La Manitas afloja la cerradura de la taquilla.");
    return;
  }

  if (action.card === "a_lo_bestia" && action.target === "locker") {
    if (lockerPrepared) {
      gameState.lockerState = "clean_open";
      gameState.noteState = "complete";
      setTargetFeedback("locker", "La coordinación del pulso abre la taquilla limpia.", action);
      emit("La taquilla se abre limpia gracias a la preparacion del pulso.");
    } else {
      gameState.lockerState = "broken_open";
      gameState.noteState = "partial";
      setTargetFeedback("locker", "Taquilla reventada. La nota aparece rota.", action);
      emit("La taquilla se revienta. La nota aparece rota.");
    }
    return;
  }

  if (action.card === "y_si" && action.target === "locker") {
    gameState.lockerState = "clean_open";
    gameState.noteState = "complete";
    setTargetFeedback("locker", "La Mística usa una secuencia absurda de golpecitos. Funciona.", action);
    emit("La Mística prueba una secuencia absurda de golpecitos y la taquilla cede.");
    return;
  }

  if (action.card === "esto_vibra_raro" && action.target === "sensor") {
    gameState.sensorPatternDetected = true;
    setTargetFeedback("sensor", "La Mística detecta un patrón raro en la vibración del sensor.", action);
    emit("La Mística detecta que el sensor responde a un patrón extraño.");
    return;
  }

  if (action.card === "y_si" && action.target === "sensor") {
    if (sensorPatternDetected) {
      gameState.sensorState = "fooled";
      gameState.sensorTrickedThisPulse = true;
      setTargetFeedback("sensor", "La Mística engaña el sensor con una interacción absurda.", action);
      emit("La Mística engaña el sensor con una interacción absurda pero efectiva.");
    } else {
      setTargetFeedback("sensor", "La Mística prueba algo raro, pero aún falta entender el patrón.", action);
      emit("La Mística prueba algo raro, pero el sensor no cae tan fácil.");
    }
    return;
  }

  if (action.card === "ritual_improvisado" && action.target === "sensor") {
    gameState.sensorPatternDetected = true;
    setTargetFeedback("sensor", "Ritual improvisado: queda marcado un patrón sospechoso para test.", action);
    emit("La Mística improvisa un ritual y deja el sensor marcado.");
    return;
  }

  if (action.card === "desmontar" && action.target === "sensor") {
    gameState.sensorState = "disabled";
    setTargetFeedback("sensor", "Sensor desmontado e inutilizado.", action);
    emit("La Manitas abre la carcasa del sensor y lo inutiliza.");
    return;
  }

  if (action.card === "mirar_bien" && action.target === "door") {
    gameState.doorPrepared = true;
    setTargetFeedback("door", "El Empollón detecta cómo empujar sin forzar el mecanismo principal.", action);
    emit("El Empollón detecta cómo empujar la puerta sin forzar el mecanismo principal.");
    return;
  }

  if (action.card === "empujar" && action.target === "door") {
    if (panelSolved && sensorSolved && doorPrepared) {
      gameState.doorState = "clean_open";
      setTargetFeedback("door", "La coordinación del pulso permite abrir la puerta limpiamente.", action);
      emit("La coordinación del pulso permite abrir la puerta limpiamente.");
    } else if (["fooled", "disabled"].includes(gameState.sensorState)) {
      gameState.doorState = "forced_open";
      setTargetFeedback("door", "La puerta cede, pero queda registrada como apertura brusca.", action);
      emit("La puerta cede, pero el sistema detecta una apertura brusca.");
    } else {
      gameState.doorState = "forced_open";
      gameState.alarmState = "on";
      setTargetFeedback("door", "Puerta forzada. Alarma activada.", action);
      emit("La puerta se fuerza y salta la alarma.");
    }
    return;
  }

  if (action.card === "a_lo_bestia" && action.target === "door") {
    gameState.doorState = "forced_open";
    setTargetFeedback("door", "El guaperas revienta la salida de emergencia.", action);
    emit("El guaperas revienta la salida de emergencia.");

    if (gameState.sensorState === "active" || gameState.panelState === "active") {
      gameState.alarmState = "on";
      setTargetFeedback("door", "Salida reventada con sistemas activos. Alarma encendida.", action);
      emit("La alarma del gimnasio se activa.");
    }
    return;
  }

  setTargetFeedback(action.target, "Acción sin regla todavía. Feedback de debug generado.", action);
  emit(`No hay regla MVP para ${action.card} sobre ${getTargetLabel(action.target)}.`);
}

function resolveNarrativeConsequences() {
  if (gameState.noteState === "complete" && !gameState.noteFeedbackShown) {
    gameState.loreFlagTestRevealed = true;
    gameState.noteFeedbackShown = true;
    setTargetFeedback("locker", "Nota completa: la prueba evalúa cómo colaboráis.");
    emit("La nota completa revela que la prueba evalúa cómo colaboráis.");
  }

  if (gameState.noteState === "partial" && !gameState.partialNoteFeedbackShown) {
    gameState.partialNoteFeedbackShown = true;
    setTargetFeedback("locker", "Fragmento legible: '...no todos... elegidos...'");
    emit("Solo se puede leer un fragmento: '...no todos... elegidos...'");
  }
}

function resolveExitOutcome() {
  if (gameState.doorState !== "clean_open") {
    return;
  }

  if (!gameState.cleanExitFeedbackShown) {
    gameState.cleanExitFeedbackShown = true;
    emit("Habéis salido sin destrozar la sala.");
  }

  if (gameState.loreFlagTestRevealed && !gameState.hiddenRouteFlag) {
    gameState.hiddenRouteFlag = true;
    setTargetFeedback("door", "Salida limpia + nota completa: pista oculta desbloqueada.");
    emit("Se desbloquea una pista oculta hacia la verdadera prueba.");
  }
}

function emit(message) {
  actionLog.unshift(message);
}

function createActionId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `action-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getOrCreateClientId() {
  try {
    const stored = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);

    if (stored) {
      return stored;
    }

    const created = createActionId();
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
    return created;
  } catch (error) {
    return createActionId();
  }
}

function getStoredSessionCode() {
  try {
    return window.localStorage.getItem(SESSION_CODE_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function storeSessionCode(code) {
  try {
    window.localStorage.setItem(SESSION_CODE_STORAGE_KEY, String(code || ""));
  } catch (error) {
    // Local storage can be disabled in private contexts; the access page will ask again.
  }
}

function generateSessionAccessCode() {
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}

function shouldRequireSessionAccess() {
  return config.currentRole !== "gm" && !isGmMonitorView;
}

function hasValidSessionAccess(session) {
  if (!shouldRequireSessionAccess()) {
    return true;
  }

  const activeCode = session && session.accessCode ? String(session.accessCode) : sessionAccessCode;
  return Boolean(activeCode && getStoredSessionCode() === activeCode);
}

function getRoleLabel(roleId) {
  return roles[roleId] ? roles[roleId].label : roleId;
}

function renderRoleInterface() {
  const role = roles[config.currentRole] || roles.empollon;

  document.body.classList.add(role.className);
  document.body.classList.toggle("alarm-on", gameState.alarmState === "on");
  playerRoleLabelEl.textContent = `${config.playerName} · ${role.label}`;
  deviceScreenEl.textContent = "";

  const title = document.createElement("p");
  title.append("Rol actual: ", createStrong(role.label));

  const device = document.createElement("p");
  device.append("Dispositivo: ", createStrong(role.deviceTitle));

  const text = document.createElement("p");
  text.textContent = role.deviceText;

  const alarm = document.createElement("p");
  alarm.append("Alarma: ", createStrong(gameState.alarmState));

  const session = document.createElement("p");
  session.append("Sesión: ", createStrong(sessionStatus));

  const debug = document.createElement("p");
  debug.className = "role-debug";
  debug.textContent = lastRoleDebug;

  deviceScreenEl.append(title, device, text, session, alarm, debug);
}

function buildPulseFlags(actions, state) {
  const flags = {
    panelSolved: ["understood", "tampered"].includes(state.panelState),
    panelUnderstood: state.panelState === "understood",
    sensorSolved: ["fooled", "disabled"].includes(state.sensorState),
    cleanLockerOpened: state.lockerState === "clean_open",
    doorPrepared: Boolean(state.doorPrepared),
    sensorPatternDetected: Boolean(state.sensorPatternDetected),
    lockerPrepared: Boolean(state.lockerPrepared),
  };

  actions.forEach((action) => {
    if (["mirar_bien", "consultar_apuntes"].includes(action.card) && action.target === "panel") {
      flags.panelSolved = true;
      flags.panelUnderstood = true;
    }

    if (action.card === "puenteo_rapido" && action.target === "panel") {
      flags.panelSolved = true;
    }

    if (["desmontar"].includes(action.card) && action.target === "sensor") {
      flags.sensorSolved = true;
    }

    if (["esto_vibra_raro", "ritual_improvisado"].includes(action.card) && action.target === "sensor") {
      flags.sensorPatternDetected = true;
    }

    if (action.card === "y_si" && action.target === "sensor" && (flags.sensorPatternDetected || state.sensorPatternDetected)) {
      flags.sensorSolved = true;
    }

    if (action.card === "mirar_bien" && action.target === "door") {
      flags.doorPrepared = true;
    }

    if (action.card === "apañar" && action.target === "locker") {
      flags.lockerPrepared = true;
    }

    if (action.card === "y_si" && action.target === "locker") {
      flags.cleanLockerOpened = true;
    }
  });

  actions.forEach((action) => {
    if (action.card === "a_lo_bestia" && action.target === "locker" && flags.lockerPrepared) {
      flags.cleanLockerOpened = true;
    }
  });

  return flags;
}

function createStrong(text) {
  const strong = document.createElement("strong");
  strong.textContent = text;
  return strong;
}

function createInitialPulseState() {
  return {
    status: "idle",
    mode: "manual",
    pulseId: null,
    pulseStartAt: null,
    pulseChargeStartedAt: null,
    pulseChargeEndsAt: null,
    currentActionId: null,
    resultOverlay: createEmptyResultOverlay(),
    updatedAt: Date.now(),
  };
}

function buildInitialRemoteState(status = "role_select") {
  return {
    session: {
      status,
      accessCode: null,
      gmClientId: null,
      gameTimer: createInitialGameTimer(),
      updatedAt: Date.now(),
    },
    gameState: createInitialGameState(),
    pulseState: createInitialPulseState(),
    targetFeedback: createInitialTargetFeedback(),
    lastRoleActions: {},
    queuedActions: null,
    actionLog: ["Sistema listo. Selecciona carta y target para encolar una acción."],
    chatMessages: [
      { id: "gm-welcome", author: "GM", text: "Bienvenidos al gimnasio.", createdAt: 1 },
      { id: "player2-dummy", author: "Jugador 2", text: "Voy a mirar el panel.", createdAt: 2 },
    ],
    lastRoleDebug: "Sin acciones resueltas todavía.",
  };
}

function createInitialGameTimer() {
  return {
    status: "idle",
    startedAt: null,
    elapsedBeforeStartMs: 0,
  };
}

function createInitialGameState() {
  return {
    doorState: "closed",
    panelState: "active",
    sensorState: "active",
    lockerState: "closed",
    noteState: "hidden",
    alarmState: "off",
    electricalBoxState: "idle",
    sportsGearState: "idle",
    loreFlagTestRevealed: false,
    hiddenRouteFlag: false,
    noteFeedbackShown: false,
    partialNoteFeedbackShown: false,
    cleanExitFeedbackShown: false,
    panelHintKnown: false,
    lockerPrepared: false,
    doorPrepared: false,
    sensorPatternDetected: false,
    sensorTrickedThisPulse: false,
  };
}

function createInitialTargetFeedback() {
  return {
    door: "Sin revisar.",
    panel: "Activo. Esperando lectura o manipulación.",
    sensor: "Activo. Detectando el entorno.",
    locker: "Cerrada.",
    electrical_box: "Sin interacción todavía.",
    sports_gear: "Material tirado por el gimnasio.",
  };
}

async function setupRemoteState() {
  try {
    const remoteState = await firebaseGet("");

    if (remoteState) {
      lastRemoteSnapshot = JSON.stringify(remoteState);
      applyRemoteState(remoteState);
    } else {
      const initialState = buildInitialRemoteState("role_select");
      await firebasePut("", initialState);
      lastRemoteSnapshot = JSON.stringify(initialState);
      applyRemoteState(initialState);
    }

    // SSE desactivado: cada conexión EventSource ocupa un slot HTTP persistente.
    // Con 5 pestañas en el mismo navegador se agota el límite de conexiones por dominio
    // (~6 en Firefox) y el polling deja de funcionar.
    // Polling cada 1s es el único mecanismo de sincronización.
    startRemotePolling();
  } catch (error) {
    warningEl.textContent = "No se pudo conectar con Firebase. Modo local temporal.";
    console.error("Firebase init failed", error);
    if (shouldRequireSessionAccess()) {
      navigateWithFade("index.html");
    }
  }
}

function startRemoteEventsDisabled() {
  return;
  if (remoteEventsStarted || !window.EventSource) {
    return;
  }

  remoteEventsStarted = true;
  const source = new EventSource(firebaseUrl(""));

  source.addEventListener("put", handleRemoteEvent);
  source.addEventListener("patch", handleRemoteEvent);
  source.onerror = () => {
    warningEl.textContent = "Stream Firebase sin respuesta. Usando sincronización por polling.";
  };
}

function startRemotePolling() {
  if (remotePollTimer) {
    return;
  }

  remotePollTimer = window.setInterval(async () => {
    try {
      const remoteState = await firebaseGet("");
      const snapshot = JSON.stringify(remoteState);

      if (snapshot && snapshot !== lastRemoteSnapshot) {
        lastRemoteSnapshot = snapshot;
        applyRemoteState(remoteState);
      }

      // Regla: si la partida no está en curso, los jugadores siempre vuelven a selección de rol.
      if (shouldRequireSessionAccess() && (!hasValidSessionAccess({ accessCode: sessionAccessCode }) || sessionStatus === "role_select")) {
        navigateWithFade("index.html");
      }
    } catch (error) {
      warningEl.textContent = "No se pudo refrescar Firebase.";
      console.error("Firebase polling failed", error);
    }
  }, 1000);
}

function handleRemoteEvent(event) {
  try {
    // SSE solo invalida el snapshot; polling es el único mecanismo que aplica estado.
    // Esto evita que un SSE put con datos obsoletos sobreescriba acciones recién añadidas.
    lastRemoteSnapshot = "";
    warningEl.textContent = "";
  } catch (error) {
    console.error("Remote event failed", error);
  }
}

function listToRecord(items) {
  if (!items || items.length === 0) {
    return {};
  }

  return items.reduce((record, item, index) => {
    const id = item.id || `item-${index}`;
    record[id] = item;
    return record;
  }, {});
}

function handleTargetStateChanges(nextGameState) {
  targets.forEach((target) => {
    const previous = targetStateSnapshot[target.id];
    const next = nextGameState[target.stateKey];

    if (previous !== undefined && next !== undefined && previous !== next) {
      updatedTargetIds.add(target.id);

      if (localPendingLoad && localPendingLoad.target === target.id) {
        warningEl.textContent = `${getTargetLabel(target.id)} cambió de estado. La acción cargando se cancela.`;
        cancelLocalPendingLoad();
      }
    }

    if (next !== undefined) {
      targetStateSnapshot[target.id] = next;
    }
  });
}

function applyRemoteState(remoteState) {
  if (!remoteState) {
    return;
  }

  applyingRemoteState = true;
  try {

  const remoteSession = remoteState.session || {};
  sessionStatus = remoteSession.status || "role_select";
  sessionAccessCode = remoteSession.accessCode ? String(remoteSession.accessCode) : "";
  gameTimer = {
    ...createInitialGameTimer(),
    ...(remoteSession.gameTimer || {}),
  };
  handleTargetStateChanges(remoteState.gameState || {});
  Object.assign(gameState, createInitialGameState(), remoteState.gameState || {});
  pulseState = { ...createInitialPulseState(), ...(remoteState.pulseState || {}) };
  queuedActions.splice(0, queuedActions.length, ...normalizeRemoteList(remoteState.queuedActions));
  Object.assign(targetFeedback, createInitialTargetFeedback(), remoteState.targetFeedback || {});
  lastRoleActions = { ...(remoteState.lastRoleActions || {}) };
  actionLog.splice(0, actionLog.length, ...normalizeRemoteList(remoteState.actionLog));
  chatMessages.splice(0, chatMessages.length, ...normalizeRemoteList(remoteState.chatMessages));
  lastRoleDebug = remoteState.lastRoleDebug || "Sin acciones resueltas todavía.";

  renderQueue();
  renderLog();
  renderChat();
  renderTargets();
  renderGmMonitorLastActions();
  renderRoleInterface();
  renderSelectionStatus();
  renderGameTimer();
  renderGameSessionStatus();

  if (shouldRequireSessionAccess() && !hasValidSessionAccess(remoteSession)) {
    navigateWithFade("index.html");
  } else if (shouldRequireSessionAccess() && sessionStatus === "role_select") {
    navigateWithFade("index.html");
  }

  } finally {
    applyingRemoteState = false;
  }
}

function navigateWithFade(url) {
  if (window.location.pathname.endsWith(url) || document.body.classList.contains("page-leaving")) {
    return;
  }

  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = url;
  }, 220);
}

function normalizeRemoteList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return Object.values(value).filter((item) => item !== null && item !== undefined);
  }

  return Object.values(value).sort((a, b) => {
    const aTime = a && (a.loadedAt || a.createdAt) ? (a.loadedAt || a.createdAt) : 0;
    const bTime = b && (b.loadedAt || b.createdAt) ? (b.loadedAt || b.createdAt) : 0;
    return aTime - bTime;
  });
}

async function startGame() {
  const now = Date.now();
  const accessCode = generateSessionAccessCode();
  sessionAccessCode = accessCode;
  storeSessionCode(accessCode);
  const startMessage = `GM inicia la partida. Codigo de sesion: ${accessCode}. ${new Date().toLocaleTimeString()}`;
  const nextLog = [startMessage, ...actionLog];
  gameTimer = {
    status: "running",
    startedAt: now,
    elapsedBeforeStartMs: 0,
  };
  sessionStatus = "in_game";
  warningEl.textContent = "Partida iniciada.";
  renderGameSessionStatus();
  renderGameTimer();
  await firebasePatch("session", {
    status: "in_game",
    accessCode,
    gmClientId: config.clientId,
    gameTimer,
    updatedAt: now,
  });
  await firebasePut("actionLog", nextLog);
}

async function resetGame() {
  clearLocalLoadTimers();
  localPendingLoad = null;
  gmOwnedPulseId = null;
  autoPulseEnabled = false;
  if (autoPulseTimer) {
    window.clearTimeout(autoPulseTimer);
    autoPulseTimer = null;
  }
  updatedTargetIds.clear();

  queuedActions.splice(0, queuedActions.length);
  actionLog.splice(0, actionLog.length);
  chatMessages.splice(0, chatMessages.length);
  Object.assign(gameState, createInitialGameState());
  Object.assign(targetFeedback, createInitialTargetFeedback());
  pulseState = createInitialPulseState();
  gameTimer = createInitialGameTimer();
  sessionStatus = "role_select";
  sessionAccessCode = "";
  lastRoleActions = {};
  lastRoleDebug = "Sin acciones resueltas todavía.";
  selectedCardId = null;
  selectedTargetId = null;

  const initialState = buildInitialRemoteState("role_select");
  initialState.actionLog = [
    `GM resetea la partida. Volvemos a selección de rol. ${new Date().toLocaleTimeString()}`,
    "Sistema listo. Selecciona carta y target para encolar una acción.",
  ];

  renderQueue();
  renderLog();
  renderChat();
  renderTargets();
  renderGmMonitorLastActions();
  renderRoleInterface();
  renderSelectionStatus();
  renderGameTimer();
  renderGameSessionStatus();

  warningEl.textContent = "Partida reseteada. Jugadores enviados a selección de rol.";
  try {
    await firebasePut("", initialState);
  } catch (error) {
    warningEl.textContent = "No se pudo resetear la partida en Firebase.";
    console.error("Reset failed", error);
  }
}

function firebaseUrl(path) {
  const normalizedPath = path ? `/${path}` : "/";
  return `${config.firebaseBaseUrl}${normalizedPath}.json`;
}

async function firebaseGet(path) {
  const response = await fetch(firebaseUrl(path), { cache: "no-store" });
  return response.json();
}

async function firebaseGetWithEtag(path) {
  const response = await fetch(firebaseUrl(path), {
    cache: "no-store",
    headers: { "X-Firebase-ETag": "true" },
  });

  if (!response.ok) {
    throw new Error(`Firebase GET ETag failed: ${response.status}`);
  }

  return {
    data: await response.json(),
    etag: response.headers.get("ETag"),
  };
}

async function firebasePutIfMatch(path, data, etag) {
  const response = await fetch(firebaseUrl(path), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": etag || "",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 412) {
    return { ok: false, data: null };
  }

  if (!response.ok) {
    throw new Error(`Firebase conditional PUT failed: ${response.status}`);
  }

  lastRemoteSnapshot = "";
  return { ok: true, data: await response.json() };
}

async function firebasePut(path, data) {
  const response = await fetch(firebaseUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase PUT failed: ${response.status}`);
  }

  lastRemoteSnapshot = "";
  return response.json();
}

async function firebasePatch(path, data) {
  const response = await fetch(firebaseUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase PATCH failed: ${response.status}`);
  }

  lastRemoteSnapshot = "";
  return response.json();
}

function setupEvents() {
  const enqueueButton = document.querySelector("#enqueue-button");
  const resolvePulseButton = document.querySelector("#resolve-pulse-button");
  const autoPulseButton = document.querySelector("#toggle-auto-pulse-button");

  if (enqueueButton) {
    enqueueButton.addEventListener("click", enqueueAction);
  }

  if (resolvePulseButton) {
    resolvePulseButton.addEventListener("click", resolvePulse);
  }

  if (autoPulseButton) {
    autoPulseButton.addEventListener("click", toggleAutoPulse);
  }

  chatFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = chatInputEl.value.trim();

    if (!text) {
      return;
    }

    const message = {
      id: createActionId(),
      author: config.currentRole === "gm" ? "GM" : getRoleLabel(config.currentRole),
      text,
      createdAt: Date.now(),
    };

    chatMessages.push(message);
    chatInputEl.value = "";
    renderChat();
    await firebasePut(`chatMessages/${message.id}`, message);
  });

  if (startGameButtonEl) {
    startGameButtonEl.addEventListener("click", startGame);
  }

  if (resetGameButtonEl) {
    resetGameButtonEl.addEventListener("click", resetGame);
  }
}

function setupPageTransitions() {
  window.requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });
}

function startUiTicker() {
  window.setInterval(() => {
    if ((pulseState && pulseState.status !== "idle") || isPulseResultOverlayActive() || localPendingLoad || queuedActions.some((action) => action.status === "executing")) {
      renderQueue();
      renderTargets();
    }

    if (gameTimer.status === "running") {
      renderGameTimer();
    }
  }, 200);
}

async function init() {
  if (!roles[config.currentRole]) {
    config.currentRole = "empollon";
  }

  config.playerName = config.currentRole === "gm" ? "GM" : `Jugador ${config.clientId.slice(-4).toUpperCase()}`;

  setupPageTransitions();
  renderRoleInterface();
  setupEvents();
  startUiTicker();
  renderTargets();
  renderCards();
  renderQueue();
  renderLog();
  renderChat();
  renderSelectionStatus();
  renderGameTimer();
  renderGameSessionStatus();
  await setupRemoteState();
}

init();
