import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { E2Logo, NBadge, NCard, NTimer } from "../components/e2";
import { ActionQueueOverlay } from "../components/ActionQueueOverlay.jsx";
import { CodexGuideOverlay, HistoryGlyph, PlayerCodeTooltipLayer } from "../components/PlayerCodeTooltipLayer.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { DEFAULT_SCENARIO_ID, getVariantBackground, getVariantImageAspect } from "../data/scenarioData.js";
import { applyScenarioHotspotOverrides, getScenarioContainerOpenState, getScenarioHotspots, getScenarioItem, getScenarioPulseAnomalyTargetIds, resolveScenarioDeviceCommand } from "../data/scenarioContent.js";
import { PLAYER_TOOLTIPS, resolvePlayerTooltip } from "../data/playerTooltips.js";
import { ItemModal } from "../components/ItemModal.jsx";
import { PlayerInventoryBar } from "../components/PlayerInventoryBar.jsx";
import { getRole } from "../data/roles.js";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { getPulseScheduleProgress } from "../presentation/pulsePresentation.js";
import { getRemoteState } from "../services/gmService.js";
import { createInitialGameState, createInitialTargetFeedback, filterActionHistory, getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { getStoredSessionCode, hasValidStoredSessionCode } from "../services/sessionAccess.js";
import { findQueuedActionForCurrentPlayer, markItemSeen, pickUpItem, sendPlayerChatMessage, updatePlayerView } from "../services/playerService.js";
import { firebaseGet, firebasePatch } from "../services/firebaseClient.js";
import { getDeviceUrl, getRoleSessionCode } from "../services/urlService.js";

const PLAYER_VIEW_STALE_MS = 15000;
const SEARCHING_SLOT_TIME = 10; // seconds per slot before revealing content
const SLOT_STAGGER_MS = 800;    // ms between each slot's search start
const RESONANCE_BALLS_OPEN_REWARD = 3;
const RESONANCE_BALLS_DISCOVERY_ID = "hotspot_open_balones";
const RESONANCE_SPAWN_VISIBLE_MS = 8000;
const RESONANCE_SPAWN_MIN_MS = 25000;
const RESONANCE_SPAWN_MAX_MS = 40000;
const RESONANCE_COLLECT_HOVER_MS = 500;
const RESONANCE_COLLECT_FEEDBACK_MS = 1500;
const PLAYER_VIEW_PUBLISH_DEBOUNCE_MS = 420;
const PLAYER_VIEW_CAMERA_MIN_DELTA = 4;
const PLAYER_TOOLTIP_STORAGE_PREFIX = "elExamen2.playerTooltips";

function stableRemoteSignature(state) {
  return JSON.stringify(state || null);
}

function hasCameraMeaningfulChange(previousCamera, nextCamera) {
  if (!previousCamera || !nextCamera) {
    return previousCamera !== nextCamera;
  }

  return Math.abs((previousCamera.x || 0) - (nextCamera.x || 0)) >= PLAYER_VIEW_CAMERA_MIN_DELTA
    || Math.abs((previousCamera.y || 0) - (nextCamera.y || 0)) >= PLAYER_VIEW_CAMERA_MIN_DELTA
    || Math.abs((previousCamera.scale || 0) - (nextCamera.scale || 0)) >= 0.001;
}

function getPlayerTooltipStorageKey(scope) {
  return `${PLAYER_TOOLTIP_STORAGE_PREFIX}:${scope}`;
}

function readSeenPlayerTooltips(scope) {
  try {
    const raw = window.localStorage.getItem(getPlayerTooltipStorageKey(scope));
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch (error) {
    return new Set();
  }
}

function writeSeenPlayerTooltips(scope, seenIds) {
  try {
    window.localStorage.setItem(getPlayerTooltipStorageKey(scope), JSON.stringify([...seenIds]));
  } catch (error) {
    // Storage may fail in private browsing; the tooltip still works for this render.
  }
}

async function getPlayerRemoteStateSlice(roleId) {
  const [
    session,
    gameState,
    pulseState,
    targetFeedback,
    queuedActions,
    actionLog,
    chatMessages,
    lastRoleActions,
    itemSeenState,
    playerInventoryForRole,
    playerBoardForRole,
    hotspotOverrides,
    fusionSession,
  ] = await Promise.all([
    firebaseGet("session"),
    firebaseGet("gameState"),
    firebaseGet("pulseState"),
    firebaseGet("targetFeedback"),
    firebaseGet("queuedActions"),
    firebaseGet("actionLog"),
    firebaseGet("chatMessages"),
    firebaseGet("lastRoleActions"),
    firebaseGet("itemSeenState"),
    firebaseGet(`playerInventories/${roleId}`),
    firebaseGet(`playerBoards/${roleId}`),
    firebaseGet("hotspotOverrides"),
    firebaseGet("fusionSession"),
  ]);

  return {
    session,
    gameState,
    pulseState,
    targetFeedback,
    queuedActions,
    actionLog,
    chatMessages,
    lastRoleActions,
    itemSeenState,
    playerInventories: { [roleId]: playerInventoryForRole || {} },
    playerBoards: { [roleId]: playerBoardForRole || {} },
    hotspotOverrides,
    fusionSession,
  };
}

function getScopedTargetKey(scenarioId, variant, targetId) {
  return `${scenarioId || DEFAULT_SCENARIO_ID}_${variant || "A"}__${targetId}`;
}

function getVisibleTargetFeedback(baseFeedback, remoteFeedback, scenarioId, variant) {
  const feedback = { ...baseFeedback };

  for (const targetId of Object.keys(baseFeedback)) {
    const scopedValue = remoteFeedback?.[getScopedTargetKey(scenarioId, variant, targetId)];
    if (scopedValue) {
      feedback[targetId] = scopedValue;
    }
  }

  return feedback;
}

function getVisibleItemSeenState(remoteSeenState, scenarioId, variant) {
  const scopedSeenState = {};

  for (const [key, value] of Object.entries(remoteSeenState || {})) {
    const [, itemId] = key.split("__");
    if (itemId && key.startsWith(`${scenarioId}_${variant}__`)) {
      scopedSeenState[itemId] = value;
    }
  }

  return scopedSeenState;
}

export function PlayerScreen({ navigation, params }) {
  const role = getRole(params.get("role") || "empollon");
  const isGmMonitorView = params.get("view") === "gm-monitor";
  const [remoteState, setRemoteState] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [chatDraft, setChatDraft] = useState("");
  const [openedItem, setOpenedItem] = useState(null);
  const [playerInventory, setPlayerInventory] = useState([null, null, null]);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [revealedSlots, setRevealedSlots] = useState({}); // { [targetId]: number[] }
  const [deviceCommandResult, setDeviceCommandResult] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [eventLogVisible, setEventLogVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [unreadHistoryCount, setUnreadHistoryCount] = useState(0);
  const [resonanceSpawn, setResonanceSpawn] = useState(null);
  const [resonanceCollectState, setResonanceCollectState] = useState("idle");
  const [notifications, setNotifications] = useState([]);
  const [sparkVfxActive, setSparkVfxActive] = useState(false);
  const [fusionVfxActive, setFusionVfxActive] = useState(false);
  const [codexGuideTooltip, setCodexGuideTooltip] = useState(null);
  const [lastPlayerTooltip, setLastPlayerTooltip] = useState(PLAYER_TOOLTIPS.explore_hotspots);
  const [expandedPlayerTooltip, setExpandedPlayerTooltip] = useState(null);
  const [seenPlayerTooltipIds, setSeenPlayerTooltipIds] = useState(() => new Set());
  const [recentResonanceGain, setRecentResonanceGain] = useState(false);
  const [resonanceRewardFeedback, setResonanceRewardFeedback] = useState(null);
  const prevGameStateRef = useRef(null);
  const prevActionResultIdRef = useRef(null);
  const prevFusionStatusRef = useRef(null);
  const prevResonanceValueRef = useRef(null);
  const historyTopMessageRef = useRef(null);
  const sparkVfxTimerRef = useRef(null);
  const fusionVfxTimerRef = useRef(null);
  const resonanceTooltipTimerRef = useRef(null);
  const resonanceRewardFeedbackTimerRef = useRef(null);
  const notifDismissTimersRef = useRef([]);
  const revealedSlotsRef = useRef({});
  const searchTimersRef = useRef([]);
  const chatListRef = useRef(null);
  const latestCameraRef = useRef(null);
  const viewPublishTimerRef = useRef(null);
  const resonanceSpawnTimerRef = useRef(null);
  const resonanceDespawnTimerRef = useRef(null);
  const resonanceCollectTimerRef = useRef(null);
  const resonanceCollectFeedbackTimerRef = useRef(null);
  const resonanceCollectPendingRef = useRef(false);
  const resonanceRewardPendingRef = useRef(false);
  const resonanceRewardClaimedRef = useRef(false);
  const remoteStateSignatureRef = useRef("");
  const lastPublishedCameraRef = useRef(null);
  const lastPublishedViewSignatureRef = useRef("");

  const session = remoteState?.session || {};
  const fusionSession = remoteState?.fusionSession || null;
  const gameState = { ...createInitialGameState(), ...(remoteState?.gameState || {}) };
  const remoteTargetFeedback = remoteState?.targetFeedback || {};
  const pulseState = remoteState?.pulseState || {};
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => filterActionHistory(remoteState?.actionLog).slice(0, 20), [remoteState]);
  const chatMessages = useMemo(() => normalizeRemoteList(remoteState?.chatMessages).slice(-18), [remoteState]);
  const lastRoleAction = remoteState?.lastRoleActions?.[role.id];
  const mirroredView = isGmMonitorView ? remoteState?.playerViews?.[role.id] : null;
  const isMirrorFresh = Boolean(mirroredView?.updatedAt && Date.now() - mirroredView.updatedAt < PLAYER_VIEW_STALE_MS);
  const effectiveSelectedTargetId = isGmMonitorView ? (isMirrorFresh ? mirroredView.selectedTargetId : null) : selectedTargetId;
  const effectiveCamera = isGmMonitorView && isMirrorFresh ? mirroredView.camera : null;
  const remoteItemSeenState = remoteState?.itemSeenState || {};
  const playerBoard = remoteState?.playerBoards?.[role.id] || {};
  const boardVariant = playerBoard.variant || "A";
  const boardScenarioId = playerBoard.scenarioId || DEFAULT_SCENARIO_ID;
  const targetFeedback = getVisibleTargetFeedback(createInitialTargetFeedback(), remoteTargetFeedback, boardScenarioId, boardVariant);
  const itemSeenState = getVisibleItemSeenState(remoteItemSeenState, boardScenarioId, boardVariant);
  const remoteHotspotOverrides = remoteState?.hotspotOverrides || {};
  const boardTargets = useMemo(() => (
    applyScenarioHotspotOverrides(
      getScenarioHotspots(boardScenarioId, boardVariant),
      remoteHotspotOverrides,
      boardScenarioId,
      boardVariant,
    )
  ), [boardScenarioId, boardVariant, remoteHotspotOverrides]);
  const boardSrc = getVariantBackground(boardScenarioId, boardVariant);
  const boardAspect = getVariantImageAspect(boardScenarioId, boardVariant);
  const remoteInventorySlots = remoteState?.playerInventories?.[role.id]?.slots;
  const queuedForPlayer = findQueuedActionForCurrentPlayer(queuedActions, role.id);
  const overlayActive = pulseState.status === "executing";
  const pulseSchedule = getPulseScheduleProgress(pulseState);
  const pulseCriticalActive = !overlayActive && pulseSchedule.phase === "critical";
  const pulseCriticalIntensity = !pulseCriticalActive
    ? "off"
    : pulseSchedule.proximity >= 0.96
      ? "peak"
      : pulseSchedule.proximity >= 0.9
        ? "rising"
        : "low";
  const pulseAnomalyVisible = pulseCriticalActive || (overlayActive && pulseState.actionCount > 0);
  const pulseAnomalyTargetIds = pulseAnomalyVisible
    ? getScenarioPulseAnomalyTargetIds(gameState, boardScenarioId, boardVariant)
    : [];
  const pulseAnomalyMode = pulseCriticalActive ? "critical" : "active";
  const interferenceVariant = pulseState.interferenceVariant || 1;
  const variantResonance = gameState.resonanceByVariant?.[boardVariant] || gameState.resonance || { value: 0, spent: 0, discoveries: {} };
  const resonanceValue = Number(variantResonance.value || 0);
  const elapsedSeconds = getGameTimerElapsedSeconds(session.gameTimer);
  const deviceSessionCode = getRoleSessionCode(session, role.id) || getStoredSessionCode();
  const playerDeviceUrl = getDeviceUrl(role.id, { code: deviceSessionCode });
  const tooltipStorageScope = `${getStoredSessionCode() || session.accessCode || "local"}:${role.id}:${boardScenarioId}:${boardVariant}`;
  const activePlayerTooltip = useMemo(() => {
    if (isGmMonitorView || codexGuideTooltip) {
      return null;
    }

    return resolvePlayerTooltip({
      selectedTargetId,
      queuedForPlayer,
      overlayActive,
      sparkVfxActive,
      fusionSession,
      fusionVfxActive,
      gameState,
      scenarioId: boardScenarioId,
      variant: boardVariant,
      resonanceGainActive: recentResonanceGain,
      seenIds: seenPlayerTooltipIds,
    });
  }, [
    boardScenarioId,
    boardVariant,
    codexGuideTooltip,
    fusionSession,
    fusionVfxActive,
    gameState,
    isGmMonitorView,
    overlayActive,
    queuedForPlayer,
    recentResonanceGain,
    seenPlayerTooltipIds,
    selectedTargetId,
    sparkVfxActive,
  ]);
  const availablePlayerTooltip = activePlayerTooltip || lastPlayerTooltip;
  const visiblePlayerTooltip = codexGuideTooltip ? null : (expandedPlayerTooltip || availablePlayerTooltip);

  const markPlayerTooltipSeen = useCallback((tooltipId) => {
    if (!tooltipId) {
      return;
    }

    setSeenPlayerTooltipIds((current) => {
      if (current.has(tooltipId)) {
        return current;
      }

      const next = new Set(current);
      next.add(tooltipId);
      writeSeenPlayerTooltips(tooltipStorageScope, next);
      return next;
    });
  }, [tooltipStorageScope]);

  const handlePlayerTooltipOpen = useCallback(() => {
    const tooltipToOpen = activePlayerTooltip || lastPlayerTooltip;
    if (!tooltipToOpen) {
      return;
    }

    setExpandedPlayerTooltip(tooltipToOpen);
    if (activePlayerTooltip) {
      markPlayerTooltipSeen(activePlayerTooltip.id);
    }
  }, [activePlayerTooltip, lastPlayerTooltip, markPlayerTooltipSeen]);

  const handleHistoryToggle = useCallback(() => {
    setHistoryOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setUnreadHistoryCount(0);
      }
      return nextOpen;
    });
  }, []);

  useEffect(() => {
    resonanceRewardClaimedRef.current = Boolean(variantResonance?.discoveries?.[RESONANCE_BALLS_DISCOVERY_ID]);
  }, [variantResonance?.discoveries]);

  useEffect(() => {
    setSeenPlayerTooltipIds(readSeenPlayerTooltips(tooltipStorageScope));
    setExpandedPlayerTooltip(null);
  }, [tooltipStorageScope]);

  useEffect(() => {
    if (activePlayerTooltip) {
      setLastPlayerTooltip(activePlayerTooltip);
    }
  }, [activePlayerTooltip]);

  useEffect(() => {
    setExpandedPlayerTooltip(null);
  }, [
    boardScenarioId,
    boardVariant,
    fusionSession?.status,
    overlayActive,
    queuedForPlayer?.id,
    selectedTargetId,
    sparkVfxActive,
  ]);

  useEffect(() => {
    const previousValue = prevResonanceValueRef.current;
    prevResonanceValueRef.current = resonanceValue;

    if (previousValue === null || resonanceValue <= previousValue) {
      return undefined;
    }

    window.clearTimeout(resonanceTooltipTimerRef.current);
    setRecentResonanceGain(true);
    resonanceTooltipTimerRef.current = window.setTimeout(() => setRecentResonanceGain(false), 7000);

    return () => window.clearTimeout(resonanceTooltipTimerRef.current);
  }, [resonanceValue]);

  function logEvent(msg) {
    const time = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEventLog((prev) => [{ time, msg }, ...prev].slice(0, 80));
  }

  const applyRemoteStateIfChanged = useCallback((nextState) => {
    const nextSignature = stableRemoteSignature(nextState);

    if (nextSignature === remoteStateSignatureRef.current) {
      return false;
    }

    remoteStateSignatureRef.current = nextSignature;
    setRemoteState(nextState);
    return true;
  }, []);

  const scheduleResonanceSpawn = useCallback(() => {
    window.clearTimeout(resonanceSpawnTimerRef.current);

    if (isGmMonitorView || session.status !== "in_game") {
      return;
    }

    const minMs = resonanceValue === 0 ? RESONANCE_SPAWN_MIN_MS / 2 : RESONANCE_SPAWN_MIN_MS;
    const maxMs = resonanceValue === 0 ? RESONANCE_SPAWN_MAX_MS / 2 : RESONANCE_SPAWN_MAX_MS;
    const delay = Math.round(minMs + Math.random() * (maxMs - minMs));
    resonanceSpawnTimerRef.current = window.setTimeout(() => {
      window.clearTimeout(resonanceCollectTimerRef.current);
      window.clearTimeout(resonanceDespawnTimerRef.current);
      resonanceCollectPendingRef.current = false;
      setResonanceCollectState("idle");
      setResonanceSpawn({
        id: Date.now(),
        x: +(12 + Math.random() * 76).toFixed(2),
        y: +(56 + Math.random() * 32).toFixed(2),
      });

      resonanceDespawnTimerRef.current = window.setTimeout(() => {
        setResonanceSpawn(null);
        setResonanceCollectState("idle");
        scheduleResonanceSpawn();
      }, RESONANCE_SPAWN_VISIBLE_MS);
    }, delay);
  }, [isGmMonitorView, session.status, resonanceValue]);

  useEffect(() => {
    if (isGmMonitorView || session.status !== "in_game") {
      window.clearTimeout(resonanceSpawnTimerRef.current);
      window.clearTimeout(resonanceDespawnTimerRef.current);
      window.clearTimeout(resonanceCollectTimerRef.current);
      window.clearTimeout(resonanceCollectFeedbackTimerRef.current);
      resonanceCollectPendingRef.current = false;
      setResonanceSpawn(null);
      setResonanceCollectState("idle");
      return undefined;
    }

    scheduleResonanceSpawn();

    return () => {
      window.clearTimeout(resonanceSpawnTimerRef.current);
      window.clearTimeout(resonanceDespawnTimerRef.current);
      window.clearTimeout(resonanceCollectTimerRef.current);
      window.clearTimeout(resonanceCollectFeedbackTimerRef.current);
    };
  }, [isGmMonitorView, scheduleResonanceSpawn, session.status]);

  // Track all puzzle-relevant state changes and auto-log them
  useEffect(() => {
    const prev = prevGameStateRef.current;
    if (!prev) {
      prevGameStateRef.current = { gameState, actionLog };
      return;
    }

    // ── gameState.hotspotStates ──
    const hotspots = gameState.hotspotStates || {};
    const prevHotspots = prev.gameState.hotspotStates || {};
    for (const [key, val] of Object.entries(hotspots)) {
      if (val !== prevHotspots[key]) logEvent(`hotspot.${key}: ${prevHotspots[key] ?? "—"} → ${val}`);
    }

    // ── gameState.flags ──
    const flags = gameState.flags || {};
    const prevFlags = prev.gameState.flags || {};
    for (const [key, val] of Object.entries(flags)) {
      if (val !== prevFlags[key]) logEvent(`flag.${key}: ${prevFlags[key] ?? "—"} → ${val}`);
    }

    // ── gameState.discoveries ──
    const discoveries = gameState.discoveries || {};
    const prevDisc = prev.gameState.discoveries || {};
    for (const [key, val] of Object.entries(discoveries)) {
      if (val !== prevDisc[key]) logEvent(`discovery.${key}: ${val}`);
    }

    // ── gameState.failedAttempts ──
    if ((gameState.failedAttempts || 0) !== (prev.gameState.failedAttempts || 0)) {
      logEvent(`failedAttempts: ${prev.gameState.failedAttempts ?? 0} → ${gameState.failedAttempts}`);
    }

    // ── actionLog — new entries ──
    if (actionLog.length > prev.actionLog.length) {
      actionLog.slice(prev.actionLog.length).forEach((entry) => logEvent(`acción: ${entry}`));
    }

    prevGameStateRef.current = { gameState, actionLog, pulseState };
  }); // intentionally no dep array — runs after every render to diff state

  useEffect(() => {
    if (!actionLog.length) {
      historyTopMessageRef.current = null;
      return;
    }

    const previousTopMessage = historyTopMessageRef.current;
    const currentTopMessage = actionLog[0];
    if (previousTopMessage === currentTopMessage) {
      if (historyOpen) {
        setUnreadHistoryCount(0);
      }
      return;
    }

    const newMessageCount = previousTopMessage
      ? Math.max(1, actionLog.findIndex((message) => message === previousTopMessage))
      : actionLog.length;

    historyTopMessageRef.current = currentTopMessage;
    setUnreadHistoryCount((current) => (historyOpen ? 0 : Math.min(99, current + newMessageCount)));
  }, [actionLog, historyOpen]);

  // null = not a container; true = open; false = closed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedContainerOpen = selectedTargetId
    ? getScenarioContainerOpenState(selectedTargetId, gameState, boardScenarioId, boardVariant)
    : null;

  usePollingRefresh({
    intervalMs: 1000,
    task: async ({ isCancelled }) => {
      try {
        const state = isGmMonitorView
          ? await getRemoteState()
          : await getPlayerRemoteStateSlice(role.id);

        if (isCancelled()) {
          return;
        }

        if (!isGmMonitorView) {
          if (!hasValidStoredSessionCode(state.session)) {
            navigation.go("access");
            return;
          }

          if (state.session?.status !== "in_game") {
            navigation.go("access");
            return;
          }
        }

        applyRemoteStateIfChanged(state);
      } catch (error) {
        // Error de red silencioso; el siguiente ciclo reintentara.
      }
    },
  });

  useEffect(() => {
    function handleDragEnd() { setIsDraggingItem(false); }
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.clearTimeout(viewPublishTimerRef.current);
      window.clearTimeout(sparkVfxTimerRef.current);
      window.clearTimeout(fusionVfxTimerRef.current);
      window.clearTimeout(resonanceTooltipTimerRef.current);
      window.clearTimeout(resonanceRewardFeedbackTimerRef.current);
      notifDismissTimersRef.current.forEach(clearTimeout);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    const status = fusionSession?.status;
    if (status === "success" && prevFusionStatusRef.current !== "success" && !isGmMonitorView) {
      prevFusionStatusRef.current = "success";
      setFusionVfxActive(true);
      window.clearTimeout(fusionVfxTimerRef.current);
      fusionVfxTimerRef.current = window.setTimeout(() => setFusionVfxActive(false), 4000);
    } else if (status !== "success") {
      prevFusionStatusRef.current = status || null;
    }
  }, [fusionSession?.status, isGmMonitorView]);

  useEffect(() => {
    const result = pulseState.currentActionResult;
    if (!result?.visible || !result?.actionId) return;
    if (result.actionId === prevActionResultIdRef.current) return;
    prevActionResultIdRef.current = result.actionId;

    if (result.variant && result.variant !== boardVariant) return;

    const notif = { id: result.actionId, text: result.message, player: result.player || result.role, createdAt: Date.now() };
    setNotifications((prev) => [...prev.slice(-2), notif]);

    if (result.vfxType === "spark_fusion_fail" && !isGmMonitorView) {
      window.clearTimeout(sparkVfxTimerRef.current);
      setSparkVfxActive(true);
      sparkVfxTimerRef.current = window.setTimeout(() => setSparkVfxActive(false), 2500);
    }

    const timer = window.setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== result.actionId));
    }, 8000);
    notifDismissTimersRef.current.push(timer);
  }, [pulseState.currentActionResult, boardVariant, isGmMonitorView]);

  useEffect(() => {
    if (remoteInventorySlots) {
      setPlayerInventory([
        remoteInventorySlots[0] || null,
        remoteInventorySlots[1] || null,
        remoteInventorySlots[2] || null,
      ]);
    }
  }, [remoteInventorySlots]);

  useEffect(() => {
    searchTimersRef.current.forEach(clearTimeout);
    searchTimersRef.current = [];

    // Don't search if no card is open, or if the target is a closed container
    if (!selectedTargetId || selectedContainerOpen === false) return;

    const targetId = selectedTargetId;
    const alreadyRevealed = revealedSlotsRef.current[targetId] || [];

    for (let i = 0; i < 6; i++) {
      if (alreadyRevealed.includes(i)) continue;
      const delay = i * SLOT_STAGGER_MS + SEARCHING_SLOT_TIME * 1000;
      const timer = setTimeout(() => {
        revealedSlotsRef.current = {
          ...revealedSlotsRef.current,
          [targetId]: [...new Set([...(revealedSlotsRef.current[targetId] || []), i])],
        };
        setRevealedSlots({ ...revealedSlotsRef.current });
      }, delay);
      searchTimersRef.current.push(timer);
    }

    return () => {
      searchTimersRef.current.forEach(clearTimeout);
    };
  }, [selectedTargetId, selectedContainerOpen]);

  useEffect(() => {
    const chatList = chatListRef.current;

    if (chatList) {
      chatList.scrollTop = chatList.scrollHeight;
    }
  }, [chatMessages]);

  function queuePlayerViewPublish({ force = false } = {}) {
    if (isGmMonitorView) {
      return;
    }

    window.clearTimeout(viewPublishTimerRef.current);
    viewPublishTimerRef.current = window.setTimeout(async () => {
      try {
        const nextCamera = latestCameraRef.current;
        const viewSignature = JSON.stringify({
          selectedTargetId,
          camera: nextCamera
            ? {
                x: Math.round(nextCamera.x || 0),
                y: Math.round(nextCamera.y || 0),
                scale: Number(nextCamera.scale || 0).toFixed(3),
              }
            : null,
        });

        if (!force && viewSignature === lastPublishedViewSignatureRef.current) {
          return;
        }

        await updatePlayerView(role, {
          selectedTargetId,
          camera: nextCamera,
        });
        lastPublishedCameraRef.current = nextCamera;
        lastPublishedViewSignatureRef.current = viewSignature;
      } catch (error) {
        // La vista espejo es telemetria de GM; no debe bloquear al jugador.
      }
    }, force ? 0 : PLAYER_VIEW_PUBLISH_DEBOUNCE_MS);
  }

  const handleCameraChange = useCallback((nextCamera) => {
    latestCameraRef.current = nextCamera;
    if (hasCameraMeaningfulChange(lastPublishedCameraRef.current, nextCamera)) {
      queuePlayerViewPublish();
    }
  }, [isGmMonitorView, role, selectedTargetId]);

  const handleCameraCommit = useCallback((nextCamera) => {
    latestCameraRef.current = nextCamera;
    queuePlayerViewPublish({ force: true });
  }, [isGmMonitorView, role, selectedTargetId]);

  useEffect(() => {
    queuePlayerViewPublish();
  }, [selectedTargetId]);

  async function handleDeviceCommand(targetId, cmd) {
    logEvent(`cmd: ${targetId} -> ${cmd.name}${cmd.arg ? ` [${cmd.arg}]` : ""}`);

    const result = resolveScenarioDeviceCommand({
      targetId,
      command: cmd,
      gameState,
      scenarioId: boardScenarioId,
      variant: boardVariant,
    });

    if (result?.patch) {
      await firebasePatch("", result.patch);
    }

    setDeviceCommandResult({
      id: Date.now(),
      lines: result?.lines || ["Comando ejecutado."],
      type: result?.type || "system",
      nextFlow: result?.nextFlow,
    });
  }

  async function grantBalonesOpenResonance() {
    if (isGmMonitorView || resonanceRewardPendingRef.current || resonanceRewardClaimedRef.current || variantResonance?.discoveries?.[RESONANCE_BALLS_DISCOVERY_ID]) {
      return;
    }

    resonanceRewardPendingRef.current = true;
    resonanceRewardClaimedRef.current = true;
    try {
      const currentValue = Number(variantResonance?.value || 0);
      const currentSpent = Number(variantResonance?.spent || 0);
      await firebasePatch("", {
        [`gameState/resonanceByVariant/${boardVariant}/value`]: currentValue + RESONANCE_BALLS_OPEN_REWARD,
        [`gameState/resonanceByVariant/${boardVariant}/spent`]: currentSpent,
        [`gameState/resonanceByVariant/${boardVariant}/discoveries/${RESONANCE_BALLS_DISCOVERY_ID}`]: true,
      });
      setRemoteState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          gameState: {
            ...(current.gameState || {}),
            resonanceByVariant: {
              ...(current.gameState?.resonanceByVariant || {}),
              [boardVariant]: {
                ...(current.gameState?.resonanceByVariant?.[boardVariant] || {}),
                value: currentValue + RESONANCE_BALLS_OPEN_REWARD,
                spent: currentSpent,
                discoveries: {
                  ...(current.gameState?.resonanceByVariant?.[boardVariant]?.discoveries || {}),
                  [RESONANCE_BALLS_DISCOVERY_ID]: true,
                },
              },
            },
          },
        };
      });
      window.clearTimeout(resonanceRewardFeedbackTimerRef.current);
      setResonanceRewardFeedback({
        id: Date.now(),
        targetId: "balones",
        amount: RESONANCE_BALLS_OPEN_REWARD,
      });
      resonanceRewardFeedbackTimerRef.current = window.setTimeout(() => {
        setResonanceRewardFeedback(null);
      }, 3400);
      logEvent(`resonancia +${RESONANCE_BALLS_OPEN_REWARD}: balones explorados`);
    } catch (error) {
      resonanceRewardClaimedRef.current = false;
      throw error;
    } finally {
      resonanceRewardPendingRef.current = false;
    }
  }

  async function collectAmbientResonance() {
    if (isGmMonitorView || !resonanceSpawn || resonanceCollectPendingRef.current || resonanceCollectState === "collected") {
      return;
    }

    resonanceCollectPendingRef.current = true;
    window.clearTimeout(resonanceCollectTimerRef.current);
    window.clearTimeout(resonanceDespawnTimerRef.current);
    setResonanceCollectState("collected");

    try {
      const latestResonance = await firebaseGet(`gameState/resonanceByVariant/${boardVariant}`) || variantResonance || {};
      const currentValue = Number(latestResonance.value || 0);
      const currentSpent = Number(latestResonance.spent || 0);
      await firebasePatch("", {
        [`gameState/resonanceByVariant/${boardVariant}/value`]: currentValue + 1,
        [`gameState/resonanceByVariant/${boardVariant}/spent`]: currentSpent,
      });
      logEvent("resonancia +1: recogida ambiental");
    } finally {
      resonanceCollectFeedbackTimerRef.current = window.setTimeout(() => {
        resonanceCollectPendingRef.current = false;
        setResonanceSpawn(null);
        setResonanceCollectState("idle");
        scheduleResonanceSpawn();
      }, RESONANCE_COLLECT_FEEDBACK_MS);
    }
  }

  function handleResonanceHoverStart() {
    if (isGmMonitorView || !resonanceSpawn || resonanceCollectPendingRef.current || resonanceCollectState === "collected") {
      return;
    }

    window.clearTimeout(resonanceCollectTimerRef.current);
    setResonanceCollectState("charging");
    resonanceCollectTimerRef.current = window.setTimeout(() => {
      collectAmbientResonance().catch(() => {});
    }, RESONANCE_COLLECT_HOVER_MS);
  }

  function handleResonanceHoverEnd() {
    if (resonanceCollectState !== "charging") {
      return;
    }

    window.clearTimeout(resonanceCollectTimerRef.current);
    setResonanceCollectState("idle");
  }

  function handleSelectTarget(targetId) {
    setSelectedTargetId(targetId);
    if (targetId === "balones") {
      grantBalonesOpenResonance().catch(() => {});
    }
  }

  function handleItemClick(item) {
    setOpenedItem(item);
    if (!itemSeenState[item.id]?.seen) {
      markItemSeen(item.id, boardScenarioId, boardVariant).catch(() => {});
    }
  }

  async function handleInventorySlotDrop(itemId, slotIndex) {
    const taken = playerInventory[slotIndex] !== null;
    if (taken) return;

    const optimistic = [...playerInventory];
    optimistic[slotIndex] = { itemId };
    setPlayerInventory(optimistic);

    try {
      await pickUpItem(role.id, itemId, slotIndex, boardScenarioId, boardVariant);
    } catch {
      setPlayerInventory(playerInventory);
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    try {
      const message = await sendPlayerChatMessage(role, chatDraft);

      if (!message) {
        return;
      }

      setChatDraft("");
      setRemoteState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          chatMessages: {
            ...(current.chatMessages || {}),
            [message.id]: message,
          },
        };
      });
    } catch (error) {
      // Error de red silencioso.
    }
  }

  return (
    <main className={`react-screen react-player-screen react-player-functional ${isGmMonitorView ? "react-player-monitor-view" : ""}`}>
      <section className={`player-scene-preview player-scene-live ${visiblePlayerTooltip ? "has-player-tooltip" : ""} ${expandedPlayerTooltip ? "has-player-tooltip-expanded" : ""} ${historyOpen ? "has-player-history-open" : ""}`}>
        <div className="player-topbar">
          <E2Logo compact />
          <NBadge status={role.status}>{role.label}</NBadge>
          {!isGmMonitorView && (
            <div className={`player-resonance-counter ${resonanceRewardFeedback ? "player-resonance-counter--reward" : ""}`} aria-label="Resonancia acumulada">
              <span>Resonancia</span>
              <strong>{resonanceValue}</strong>
              {resonanceRewardFeedback && (
                <em key={resonanceRewardFeedback.id}>+{resonanceRewardFeedback.amount}</em>
              )}
            </div>
          )}
          <NTimer seconds={elapsedSeconds} />
        </div>
        <SceneMap
          gameState={gameState}
          targetFeedback={targetFeedback}
          selectedTargetId={effectiveSelectedTargetId}
          queuedForPlayer={queuedForPlayer}
          overlayActive={overlayActive}
          onSelectTarget={handleSelectTarget}
          onCloseTarget={() => setSelectedTargetId(null)}
          isMonitorView={isGmMonitorView}
          externalCamera={effectiveCamera}
          onCameraChange={isGmMonitorView ? undefined : handleCameraChange}
          onCameraCommit={isGmMonitorView ? undefined : handleCameraCommit}
          itemSeenState={itemSeenState}
          onItemClick={isGmMonitorView ? undefined : handleItemClick}
          onItemDragStart={isGmMonitorView ? undefined : () => setIsDraggingItem(true)}
          revealedSlots={isGmMonitorView ? {} : revealedSlots}
          boardTargets={boardTargets}
          backgroundSrc={boardSrc}
          imageAspect={boardAspect}
          scenarioId={boardScenarioId}
          variant={boardVariant}
          onDeviceCommand={isGmMonitorView ? undefined : handleDeviceCommand}
          deviceCommandResult={isGmMonitorView ? null : deviceCommandResult}
          pulseAnomalyTargetIds={isGmMonitorView ? [] : pulseAnomalyTargetIds}
          pulseAnomalyMode={pulseAnomalyMode}
          pulseCriticalIntensity={isGmMonitorView ? "off" : pulseCriticalIntensity}
          interferenceActive={!isGmMonitorView && overlayActive}
          interferenceVariant={interferenceVariant}
          resonanceSpawn={isGmMonitorView ? null : resonanceSpawn}
          resonanceCollectState={resonanceCollectState}
          resonanceRewardFeedback={isGmMonitorView ? null : resonanceRewardFeedback}
          onResonanceHoverStart={isGmMonitorView ? undefined : handleResonanceHoverStart}
          onResonanceHoverEnd={isGmMonitorView ? undefined : handleResonanceHoverEnd}
        />
        {!isGmMonitorView && (
          <div className="player-utility-rail" aria-label="Herramientas de escena">
            <PlayerCodeTooltipLayer
              tooltip={availablePlayerTooltip}
              expanded={false}
              unread={Boolean(activePlayerTooltip)}
              onOpen={handlePlayerTooltipOpen}
              onAbout={() => setCodexGuideTooltip(availablePlayerTooltip)}
            />
            <button
              type="button"
              className="player-utility-btn player-utility-btn--history"
              onClick={handleHistoryToggle}
              aria-expanded={historyOpen}
              aria-label="Abrir historial"
            >
              <HistoryGlyph className="player-utility-icon" />
              {unreadHistoryCount > 0 && (
                <em aria-label={`${unreadHistoryCount} mensajes nuevos`}>
                  {unreadHistoryCount > 9 ? "9+" : unreadHistoryCount}
                </em>
              )}
            </button>
          </div>
        )}
        {!isGmMonitorView && expandedPlayerTooltip && (
          <PlayerCodeTooltipLayer
            tooltip={expandedPlayerTooltip}
            expanded
            unread={false}
            onOpen={handlePlayerTooltipOpen}
            onAbout={() => setCodexGuideTooltip(expandedPlayerTooltip)}
          />
        )}
        {!isGmMonitorView && (
          <CodexGuideOverlay
            tooltip={codexGuideTooltip}
            onClose={() => setCodexGuideTooltip(null)}
          />
        )}
        {!isGmMonitorView && historyOpen && (
          <aside className={`player-history-overlay ${historyOpen ? "player-history-overlay--open" : ""}`}>
            <section className="player-history-drawer" aria-label="Historial de mensajes">
              <header>
                <span>historial://mensajes</span>
                <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Cerrar historial">Cerrar</button>
              </header>
              <div className="player-history-list">
                {actionLog.length === 0 ? (
                  <p>Sin mensajes todavia.</p>
                ) : (
                  actionLog.map((message, index) => (
                    <article key={`${message}-${index}`} className="player-history-entry">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{message}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        )}
        {!isGmMonitorView && notifications.length > 0 && (
          <div className="player-notifications-stack" aria-live="polite" aria-atomic="false">
            {notifications.map((notif) => (
              <div key={notif.id} className="player-notification">
                <span className="player-notification-text">{notif.text}</span>
              </div>
            ))}
          </div>
        )}
        {!isGmMonitorView && sparkVfxActive && (
          <div className="player-spark-vfx" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`player-spark-particle player-spark-particle--${i % 2 === 0 ? "green" : "magenta"}`} />
            ))}
          </div>
        )}
        {!isGmMonitorView && fusionVfxActive && (
          <div className="player-fusion-overlay" aria-live="assertive">
            <div className="player-fusion-glow" />
            <p className="player-fusion-text">REALIDADES<br />FUSIONADAS</p>
            <span className="player-fusion-subtext">Taquillas estabilizadas</span>
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * 360;
              const dist = 80 + Math.random() * 80;
              const dx = Math.cos((angle * Math.PI) / 180) * dist;
              const dy = Math.sin((angle * Math.PI) / 180) * dist;
              return (
                <span
                  key={i}
                  className={`player-fusion-particle player-fusion-particle--${i % 2 === 0 ? "green" : "purple"}`}
                  style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${(i / 20) * 0.4}s` }}
                />
              );
            })}
          </div>
        )}
        {!isGmMonitorView && <ActionQueueOverlay actions={queuedActions} pulseState={pulseState} />}
        {!isGmMonitorView && (
          <PlayerInventoryBar
            slots={playerInventory}
            seenState={itemSeenState}
            onItemClick={handleItemClick}
            onSlotDragStart={() => setIsDraggingItem(true)}
            onSlotDrop={handleInventorySlotDrop}
            isDraggingItem={isDraggingItem}
            getItemById={(itemId) => getScenarioItem(itemId, boardScenarioId, boardVariant)}
          />
        )}
        <ItemModal item={openedItem} onClose={() => setOpenedItem(null)} />
        {isGmMonitorView && (
          <aside className="player-monitor-action-strip">
            <strong>{role.label}</strong>
            <span>
              {isMirrorFresh && mirroredView?.selectedTargetId
                ? `Viendo ${boardTargets.find((target) => target.id === mirroredView.selectedTargetId)?.label || mirroredView.selectedTargetId}`
                : lastRoleAction
                  ? `${formatCardLabel(lastRoleAction)} -> ${boardTargets.find((target) => target.id === lastRoleAction.target)?.label || lastRoleAction.target}`
                  : "Sin accion registrada."}
            </span>
          </aside>
        )}
      </section>
      {!isGmMonitorView && <aside className="player-hud-panel">
        <NCard title="Chat" className="player-side-card player-chat-card">
          <div ref={chatListRef} className="react-chat-list" aria-label="Mensajes de chat">
            {chatMessages.length === 0 ? (
              <p>Sin mensajes todavia.</p>
            ) : (
              chatMessages.map((message) => (
                <article key={message.id || `${message.author}-${message.createdAt}`} className={`react-chat-message role-${message.role || "event"}`}>
                  <strong>{message.author || "Sistema"}</strong>
                  <span>{message.text}</span>
                </article>
              ))
            )}
          </div>
          <form className="react-chat-form" onSubmit={handleChatSubmit}>
            <input
              value={chatDraft}
              maxLength={120}
              placeholder="Mensaje..."
              aria-label="Mensaje de chat"
              onChange={(event) => setChatDraft(event.target.value)}
            />
            <button type="submit" disabled={!chatDraft.trim()}>Enviar</button>
          </form>
        </NCard>
        <NCard title="Terminal movil" className="player-side-card player-device-qr-card">
          <div className="player-device-qr">
            <QRCodeSVG
              value={playerDeviceUrl}
              size={132}
              level="M"
              marginSize={2}
              bgColor="transparent"
              fgColor="#eafff2"
            />
          </div>
          <code className="player-device-qr-url">{playerDeviceUrl}</code>
          <button
            type="button"
            className="player-device-copy-btn"
            onClick={() => navigator.clipboard?.writeText(playerDeviceUrl)}
          >
            Copiar URL
          </button>
          {!deviceSessionCode && (
            <p className="player-device-qr-hint">Escanea y escribe el codigo de sesion.</p>
          )}
        </NCard>
      </aside>}
      {!isGmMonitorView && (
        <div className={`event-log-panel ${eventLogVisible ? "event-log-panel--open" : ""}`}>
          <button
            type="button"
            className="event-log-toggle"
            onClick={() => setEventLogVisible((v) => !v)}
            aria-expanded={eventLogVisible}
          >
            <span>▸ LOG</span>
            {eventLog.length > 0 && <span className="event-log-count">{eventLog.length}</span>}
          </button>
          {eventLogVisible && (
            <div className="event-log-body">
              <div className="event-log-header">
                <span>Registro de eventos</span>
                <button type="button" className="event-log-clear" onClick={() => setEventLog([])}>Limpiar</button>
              </div>
              <div className="event-log-entries">
                {eventLog.length === 0 ? (
                  <span className="event-log-empty">Sin eventos registrados.</span>
                ) : (
                  eventLog.map((e, i) => (
                    <div key={i} className="event-log-entry">
                      <span className="event-log-time">{e.time}</span>
                      <span className="event-log-msg">{e.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
