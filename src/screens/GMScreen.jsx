import { useEffect, useMemo, useRef, useState } from "react";
import { E2Logo, NBadge, NButton, NCard, NTimer } from "../components/e2";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { GMTechnicalFlowchart } from "../components/GMTechnicalFlowchart.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { playerRoles } from "../data/roles.js";
import { targets } from "../data/gameData.js";
import { DEFAULT_SCENARIO_ID, SCENARIO_VARIANTS, getScenario, getVariantBackground, getVariantImageAspect } from "../data/scenarioData.js";
import { applyScenarioHotspotOverrides, getScenarioHotspotOverrideKey, getScenarioHotspots } from "../data/scenarioContent.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { createId } from "../services/clientIdentity.js";
import { forceStartGameWithReadyPlayers, getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { ensureNextPulseScheduled, forceResetPulse, startManualPulse, triggerAutoPulseIfDue } from "../services/pulseService.js";
import { filterActionHistory, getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { formatPulseCountdown, getPulseScheduleProgress } from "../presentation/pulsePresentation.js";
import { getDeviceUrl, getPlayerMonitorUrl, getRoleSessionCode } from "../services/urlService.js";

function getSessionBadgeStatus(status) {
  return status === "in_game" ? "success" : "muted";
}

function findRole(roleId) {
  return playerRoles.find((role) => role.id === roleId) || null;
}

function getPlayerCodeDisplay(label, code, lobby) {
  const roleFromCodeKey = findRole(label);
  const roleClaimEntries = Object.entries(lobby?.roleClaims || {});
  const matchedClaimEntry =
    roleClaimEntries.find(([, claim]) => claim?.sessionCode === code) ||
    roleClaimEntries.find(([roleId]) => roleId === label);
  const [claimedRoleId, claim] = matchedClaimEntry || [];
  const role = findRole(claimedRoleId) || roleFromCodeKey;
  const player = claim?.clientId ? lobby?.players?.[claim.clientId] : null;
  const playerName = claim?.name || player?.customName || label;
  const hasJoined = Boolean(claim || player);

  return {
    playerName,
    role: hasJoined ? role : null,
    hasJoined,
  };
}

function getActionSummary(action) {
  if (!action) return "Sin chip registrado.";
  const target = targets.find((item) => item.id === action.target);
  return `${formatCardLabel(action)} -> ${target?.label || action.target || "objetivo"}`;
}

function clampPercent(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getDefaultCardPosition(target) {
  const side = target.x > 72 ? "left" : "right";
  const left = side === "left" ? target.x - 22 : target.x + target.w + 2;
  const isLowerHalf = target.y + target.h / 2 > 50;
  const top = isLowerHalf ? clampPercent(target.y - 30, 4, 76) : clampPercent(target.y - 2, 4, 76);

  return {
    cardX: +clampPercent(left, 0, 88).toFixed(2),
    cardY: +top.toFixed(2),
  };
}

function getDefaultDiscoveryCardPosition(target) {
  const card = getDefaultCardPosition(target);
  const side = target.x > 72 ? "left" : "right";
  const left = side === "left" ? card.cardX - 18 : card.cardX + 18;

  return {
    discoveryCardX: +clampPercent(left, 4, 92).toFixed(2),
    discoveryCardY: +clampPercent(card.cardY + 4, 4, 88).toFixed(2),
  };
}

function getDefaultAnomalyBounds(target) {
  return {
    anomalyX: +clampPercent(target.x - 2, 0, 96).toFixed(2),
    anomalyY: +clampPercent(target.y - 6, 0, 92).toFixed(2),
    anomalyW: +clampPercent(target.w + 4, 2, 100).toFixed(2),
    anomalyH: +clampPercent(target.h + 12, 2, 100).toFixed(2),
  };
}

function getAnomalyCapturePoints(target) {
  const fallback = getDefaultAnomalyBounds(target);
  const bounds = {
    anomalyX: Number.isFinite(target.anomalyX) ? target.anomalyX : fallback.anomalyX,
    anomalyY: Number.isFinite(target.anomalyY) ? target.anomalyY : fallback.anomalyY,
    anomalyW: Number.isFinite(target.anomalyW) ? target.anomalyW : fallback.anomalyW,
    anomalyH: Number.isFinite(target.anomalyH) ? target.anomalyH : fallback.anomalyH,
  };

  return {
    p1: { x: bounds.anomalyX, y: bounds.anomalyY },
    p2: {
      x: +(bounds.anomalyX + bounds.anomalyW).toFixed(2),
      y: +(bounds.anomalyY + bounds.anomalyH).toFixed(2),
    },
  };
}

export function GMScreen() {
  const [remoteState, setRemoteState] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Conectando con Firebase...");
  const [isBusy, setIsBusy] = useState(false);
  const [isPulseBusy, setIsPulseBusy] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [coordinateVariant, setCoordinateVariant] = useState("A");
  const [selectedHotspotId, setSelectedHotspotId] = useState("");
  const [drawMode, setDrawMode] = useState("rect"); // "rect" | "polygon" | "card" | "discovery" | "anomaly"
  const [clickCapture, setClickCapture] = useState(null); // null | "p1" | "p2" | "polygon" | "card" | "discovery" | "anomalyP1" | "anomalyP2"
  const [capturedPoints, setCapturedPoints] = useState({ p1: null, p2: null });
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [cardPosition, setCardPosition] = useState(null);
  const [discoveryCardPosition, setDiscoveryCardPosition] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const copyTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const localOverrideSyncRef = useRef(false);
  const [hotspotOverrides, setHotspotOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem("el_examen_hotspot_overrides") || "{}"); }
    catch { return {}; }
  });
  const [monitorsExpanded, setMonitorsExpanded] = useState(false);
  const [devicesExpanded, setDevicesExpanded] = useState(false);
  const [technicalFlowExpanded, setTechnicalFlowExpanded] = useState(false);
  const [fusionHotspot, setFusionHotspot] = useState("taquillas");
  const [addChipOpen, setAddChipOpen] = useState(false);
  const [addChipKind, setAddChipKind] = useState("inspection");
  const [addChipRole, setAddChipRole] = useState("empollon");
  const [addChipTarget, setAddChipTarget] = useState("");
  const [addChipCharge, setAddChipCharge] = useState(1);

  const session = remoteState?.session || {};
  const sessionState = remoteState?.sessionState || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const pulseSchedule = getPulseScheduleProgress(pulseState);
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => filterActionHistory(remoteState?.actionLog).slice(0, 8), [remoteState]);
  const activeScenario = getScenario(sessionState.scenarioId || DEFAULT_SCENARIO_ID);
  const coordinateTargets = getScenarioHotspots(activeScenario.id, coordinateVariant);
  const coordinateBg = getVariantBackground(activeScenario.id, coordinateVariant);
  const coordinateAspect = getVariantImageAspect(activeScenario.id, coordinateVariant);
  const overrideKey = getScenarioHotspotOverrideKey(activeScenario.id, coordinateVariant);
  const remoteHotspotOverrides = remoteState?.hotspotOverrides || {};
  const effectiveHotspotOverrides = useMemo(() => {
    const merged = { ...remoteHotspotOverrides };
    for (const [key, value] of Object.entries(hotspotOverrides)) {
      merged[key] = { ...(merged[key] || {}), ...(value || {}) };
    }
    return merged;
  }, [remoteHotspotOverrides, hotspotOverrides]);

  // Base targets with saved overrides applied
  const savedCoordinateTargets = useMemo(() => {
    return applyScenarioHotspotOverrides(coordinateTargets, effectiveHotspotOverrides, activeScenario.id, coordinateVariant);
  }, [coordinateTargets, effectiveHotspotOverrides, activeScenario.id, coordinateVariant]);
  const gameState = remoteState?.gameState || {};
  const readyPlayerCount = Object.values(remoteState?.lobby?.roleClaims || {}).filter(Boolean).length;


  // Reset drawing state when switching hotspot or variant
  useEffect(() => {
    setClickCapture(null);
    setCapturedPoints({ p1: null, p2: null });
    setPolygonPoints([]);
    setCardPosition(null);
    setDiscoveryCardPosition(null);
    setCursorPos(null);
    if (!selectedHotspotId) return;
    // Prefill p1/p2 from saved override or base data
    const hs = savedCoordinateTargets.find((t) => t.id === selectedHotspotId);
    if (hs) {
      const defaultCardPosition = getDefaultCardPosition(hs);
      const defaultDiscoveryCardPosition = getDefaultDiscoveryCardPosition(hs);
      setCardPosition({
        cardX: hs.cardX ?? defaultCardPosition.cardX,
        cardY: hs.cardY ?? defaultCardPosition.cardY,
      });
      setDiscoveryCardPosition({
        discoveryCardX: hs.discoveryCardX ?? defaultDiscoveryCardPosition.discoveryCardX,
        discoveryCardY: hs.discoveryCardY ?? defaultDiscoveryCardPosition.discoveryCardY,
      });
      if (drawMode === "anomaly") {
        setCapturedPoints(getAnomalyCapturePoints(hs));
        return;
      }
    }
    if (hs && !hs.points) {
      setCapturedPoints({
        p1: { x: hs.x, y: hs.y },
        p2: { x: +(hs.x + hs.w).toFixed(2), y: +(hs.y + hs.h).toFixed(2) },
      });
    } else if (hs?.points?.length) {
      setPolygonPoints(hs.points);
      setDrawMode("polygon");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotspotId]);

  useEffect(() => {
    setSelectedHotspotId("");
    setClickCapture(null);
    setCapturedPoints({ p1: null, p2: null });
    setPolygonPoints([]);
    setCardPosition(null);
    setDiscoveryCardPosition(null);
    setCursorPos(null);
  }, [coordinateVariant]);

  useEffect(() => {
    if (!remoteState || localOverrideSyncRef.current || Object.keys(hotspotOverrides).length === 0) {
      return;
    }

    localOverrideSyncRef.current = true;
    const merged = { ...remoteHotspotOverrides };

    for (const [key, value] of Object.entries(hotspotOverrides)) {
      merged[key] = { ...(merged[key] || {}), ...(value || {}) };
    }

    firebasePatch("hotspotOverrides", merged)
      .then(async () => {
        setStatusMessage("Hotspots locales publicados para jugadores.");
        await refresh();
      })
      .catch(() => {
        localOverrideSyncRef.current = false;
        setStatusMessage("No se pudieron publicar los hotspots locales.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteState, hotspotOverrides, remoteHotspotOverrides]);

  // Handle map click in drawing mode
  function handleMapCoordClick({ x, y }) {
    setCursorPos({ x, y });
    if (drawMode === "rect") {
      if (clickCapture === "p1") {
        setCapturedPoints((prev) => ({ ...prev, p1: { x, y } }));
        setClickCapture("p2"); // auto-advance
      } else if (clickCapture === "p2") {
        setCapturedPoints((prev) => ({ ...prev, p2: { x, y } }));
        setClickCapture(null); // done
      }
    } else if (drawMode === "anomaly") {
      if (clickCapture === "anomalyP1") {
        setCapturedPoints((prev) => ({ ...prev, p1: { x, y } }));
        setClickCapture("anomalyP2");
      } else if (clickCapture === "anomalyP2") {
        setCapturedPoints((prev) => ({ ...prev, p2: { x, y } }));
        setClickCapture(null);
      }
    } else if (drawMode === "polygon" && clickCapture === "polygon") {
      setPolygonPoints((prev) => [...prev, { x, y }]);
    } else if (drawMode === "card" && clickCapture === "card") {
      setCardPosition({ cardX: x, cardY: y });
      setClickCapture(null);
    } else if (drawMode === "discovery" && clickCapture === "discovery") {
      setDiscoveryCardPosition({ discoveryCardX: x, discoveryCardY: y });
      setClickCapture(null);
    }
  }

  function setRectCaptureFromHotspot(hotspot) {
    if (!hotspot) return;
    setCapturedPoints({
      p1: { x: hotspot.x, y: hotspot.y },
      p2: { x: +(hotspot.x + hotspot.w).toFixed(2), y: +(hotspot.y + hotspot.h).toFixed(2) },
    });
  }

  function setAnomalyCaptureFromHotspot(hotspot) {
    if (!hotspot) return;
    setCapturedPoints(getAnomalyCapturePoints(hotspot));
  }

  // Live targets with current drawing applied
  const liveCoordinateTargets = useMemo(() => {
    if (!selectedHotspotId) return savedCoordinateTargets;
    if (drawMode === "card" && (cardPosition || cursorPos)) {
      const nextCardPosition = clickCapture === "card" && cursorPos
        ? { cardX: cursorPos.x, cardY: cursorPos.y }
        : cardPosition;
      return savedCoordinateTargets.map((t) =>
        t.id === selectedHotspotId ? { ...t, ...nextCardPosition } : t,
      );
    }
    if (drawMode === "discovery" && (discoveryCardPosition || cursorPos)) {
      const nextDiscoveryCardPosition = clickCapture === "discovery" && cursorPos
        ? { discoveryCardX: cursorPos.x, discoveryCardY: cursorPos.y }
        : discoveryCardPosition;
      return savedCoordinateTargets.map((t) =>
        t.id === selectedHotspotId ? { ...t, ...nextDiscoveryCardPosition } : t,
      );
    }
    const { p1, p2 } = capturedPoints;
    if (drawMode === "anomaly" && p1 && p2) {
      const anomalyX = Math.min(p1.x, p2.x);
      const anomalyY = Math.min(p1.y, p2.y);
      const anomalyW = +(Math.abs(p2.x - p1.x)).toFixed(2);
      const anomalyH = +(Math.abs(p2.y - p1.y)).toFixed(2);
      return savedCoordinateTargets.map((t) =>
        t.id === selectedHotspotId ? { ...t, anomalyX, anomalyY, anomalyW, anomalyH } : t,
      );
    }
    if (drawMode === "rect" && p1 && p2) {
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = +(Math.abs(p2.x - p1.x)).toFixed(2);
      const h = +(Math.abs(p2.y - p1.y)).toFixed(2);
      return savedCoordinateTargets.map((t) =>
        t.id === selectedHotspotId ? { ...t, x, y, w, h, points: undefined } : t,
      );
    }
    if (drawMode === "polygon" && polygonPoints.length >= 3) {
      const xs = polygonPoints.map((p) => p.x);
      const ys = polygonPoints.map((p) => p.y);
      const bbox = {
        x: +Math.min(...xs).toFixed(2),
        y: +Math.min(...ys).toFixed(2),
        w: +(Math.max(...xs) - Math.min(...xs)).toFixed(2),
        h: +(Math.max(...ys) - Math.min(...ys)).toFixed(2),
      };
      return savedCoordinateTargets.map((t) =>
        t.id === selectedHotspotId ? { ...t, ...bbox, points: polygonPoints } : t,
      );
    }
    return savedCoordinateTargets;
  }, [savedCoordinateTargets, selectedHotspotId, capturedPoints, polygonPoints, cardPosition, discoveryCardPosition, cursorPos, clickCapture, drawMode]);

  // Computed result data
  const editedHotspotData = useMemo(() => {
    if (drawMode === "card") {
      if (!cardPosition) return null;
      return {
        cardX: +cardPosition.cardX.toFixed(2),
        cardY: +cardPosition.cardY.toFixed(2),
      };
    }
    if (drawMode === "discovery") {
      if (!discoveryCardPosition) return null;
      return {
        discoveryCardX: +discoveryCardPosition.discoveryCardX.toFixed(2),
        discoveryCardY: +discoveryCardPosition.discoveryCardY.toFixed(2),
      };
    }
    if (drawMode === "anomaly") {
      const { p1, p2 } = capturedPoints;
      if (!p1 || !p2) return null;
      return {
        anomalyX: +Math.min(p1.x, p2.x).toFixed(2),
        anomalyY: +Math.min(p1.y, p2.y).toFixed(2),
        anomalyW: +(Math.abs(p2.x - p1.x)).toFixed(2),
        anomalyH: +(Math.abs(p2.y - p1.y)).toFixed(2),
      };
    }
    if (drawMode === "rect") {
      const { p1, p2 } = capturedPoints;
      if (!p1 || !p2) return null;
      const x = +Math.min(p1.x, p2.x).toFixed(2);
      const y = +Math.min(p1.y, p2.y).toFixed(2);
      const w = +(Math.abs(p2.x - p1.x)).toFixed(2);
      const h = +(Math.abs(p2.y - p1.y)).toFixed(2);
      return { x, y, w, h, points: null };
    }
    if (drawMode === "polygon" && polygonPoints.length >= 3) {
      const xs = polygonPoints.map((p) => p.x);
      const ys = polygonPoints.map((p) => p.y);
      return {
        x: +Math.min(...xs).toFixed(2),
        y: +Math.min(...ys).toFixed(2),
        w: +(Math.max(...xs) - Math.min(...xs)).toFixed(2),
        h: +(Math.max(...ys) - Math.min(...ys)).toFixed(2),
        points: polygonPoints,
      };
    }
    return null;
  }, [drawMode, capturedPoints, polygonPoints, cardPosition, discoveryCardPosition]);

  // Drawing state passed to SceneMap for SVG preview
  const drawingState = useMemo(() => {
    const isBoxMode = drawMode === "rect" || drawMode === "anomaly";
    if (!selectedHotspotId || clickCapture === null && isBoxMode && !capturedPoints.p1) return null;
    const hint = clickCapture === "p1" ? "P1 — esquina superior izq."
      : clickCapture === "p2" ? "P2 — esquina inferior der."
      : clickCapture === "polygon" ? "Clic para añadir vértice"
      : clickCapture === "card" ? "Clic para colocar ventana"
      : clickCapture === "discovery" ? "Clic para colocar detalle"
      : clickCapture === "anomalyP1" ? "P1 — caja anomalia"
      : clickCapture === "anomalyP2" ? "P2 — caja anomalia"
      : null;
    return {
      mode: drawMode,
      p1: capturedPoints.p1,
      p2: capturedPoints.p2,
      polygonPoints,
      cursorPos,
      captureHint: hint,
    };
  }, [selectedHotspotId, clickCapture, drawMode, capturedPoints, polygonPoints, cursorPos]);

  const isCapturing = !!clickCapture;

  const currentHotspotIsSaved = useMemo(() => {
    if (!selectedHotspotId || !editedHotspotData) return false;
    const saved = effectiveHotspotOverrides[overrideKey]?.[selectedHotspotId];
    if (!saved) return false;
    if (drawMode === "card") {
      return saved.cardX === editedHotspotData.cardX && saved.cardY === editedHotspotData.cardY;
    }
    if (drawMode === "discovery") {
      return saved.discoveryCardX === editedHotspotData.discoveryCardX && saved.discoveryCardY === editedHotspotData.discoveryCardY;
    }
    if (drawMode === "anomaly") {
      return saved.anomalyX === editedHotspotData.anomalyX && saved.anomalyY === editedHotspotData.anomalyY
        && saved.anomalyW === editedHotspotData.anomalyW && saved.anomalyH === editedHotspotData.anomalyH;
    }
    if (drawMode === "polygon") {
      return JSON.stringify(saved.points) === JSON.stringify(editedHotspotData.points);
    }
    return saved.x === editedHotspotData.x && saved.y === editedHotspotData.y &&
      saved.w === editedHotspotData.w && saved.h === editedHotspotData.h;
  }, [selectedHotspotId, editedHotspotData, effectiveHotspotOverrides, overrideKey, drawMode]);

  async function persistOverride(data) {
    const current = effectiveHotspotOverrides[overrideKey]?.[selectedHotspotId] || {};
    const mergedData = { ...current, ...data };

    const next = {
      ...hotspotOverrides,
      [overrideKey]: { ...(hotspotOverrides[overrideKey] || {}), [selectedHotspotId]: mergedData },
    };
    setHotspotOverrides(next);
    localStorage.setItem("el_examen_hotspot_overrides", JSON.stringify(next));
    await firebasePatch(`hotspotOverrides/${overrideKey}`, { [selectedHotspotId]: mergedData });
  }

  async function handleSaveHotspot() {
    if (!editedHotspotData || !selectedHotspotId) return;
    try {
      await persistOverride(editedHotspotData);
      setStatusMessage(`Hotspot guardado para ${activeScenario.label} ${coordinateVariant}.`);
      setSaveFeedback(true);
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => setSaveFeedback(false), 1800);
      await refresh();
    } catch {
      setStatusMessage("No se pudo publicar el hotspot.");
    }
  }

  async function handleResetHotspot() {
    if (!selectedHotspotId) return;
    const next = { ...hotspotOverrides };
    if (next[overrideKey]) {
      delete next[overrideKey][selectedHotspotId];
      if (Object.keys(next[overrideKey]).length === 0) delete next[overrideKey];
    }
    setHotspotOverrides(next);
    localStorage.setItem("el_examen_hotspot_overrides", JSON.stringify(next));
    try {
      await firebasePatch(`hotspotOverrides/${overrideKey}`, { [selectedHotspotId]: null });
      setStatusMessage(`Hotspot reseteado para ${activeScenario.label} ${coordinateVariant}.`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo resetear el hotspot remoto.");
    }
    const base = coordinateTargets.find((t) => t.id === selectedHotspotId);
    if (base) {
      setCapturedPoints({ p1: { x: base.x, y: base.y }, p2: { x: +(base.x + base.w).toFixed(2), y: +(base.y + base.h).toFixed(2) } });
      setPolygonPoints([]);
      setCardPosition(getDefaultCardPosition(base));
      setDiscoveryCardPosition(getDefaultDiscoveryCardPosition(base));
      setDrawMode("rect");
    }
  }

  function handleCopyCoords() {
    if (!editedHotspotData || !selectedHotspotId) return;
    if (drawMode === "card") {
      navigator.clipboard.writeText(`cardX: ${editedHotspotData.cardX}, cardY: ${editedHotspotData.cardY}`);
      setCopyFeedback(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopyFeedback(false), 1800);
      return;
    }
    if (drawMode === "discovery") {
      navigator.clipboard.writeText(`discoveryCardX: ${editedHotspotData.discoveryCardX}, discoveryCardY: ${editedHotspotData.discoveryCardY}`);
      setCopyFeedback(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopyFeedback(false), 1800);
      return;
    }
    if (drawMode === "anomaly") {
      navigator.clipboard.writeText(`anomalyX: ${editedHotspotData.anomalyX}, anomalyY: ${editedHotspotData.anomalyY}, anomalyW: ${editedHotspotData.anomalyW}, anomalyH: ${editedHotspotData.anomalyH}`);
      setCopyFeedback(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopyFeedback(false), 1800);
      return;
    }
    const { x, y, w, h } = editedHotspotData;
    navigator.clipboard.writeText(`x: ${x}, y: ${y}, w: ${w}, h: ${h}`);
    setCopyFeedback(true);
    window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyFeedback(false), 1800);
  }

  function handleClosePolygon() {
    if (polygonPoints.length < 3) return;
    setClickCapture(null);
  }

  async function refresh() {
    const nextState = await getRemoteState();
    setRemoteState(nextState);
    setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
    setStatusMessage("Sincronizado.");
  }

  usePollingRefresh({
    intervalMs: 1000,
    task: async ({ isCancelled }) => {
      try {
        if (remoteState?.session?.status === "in_game") {
          await triggerAutoPulseIfDue({ onStatus(message) { setStatusMessage(message); } });
        }

        const nextState = await getRemoteState();
        if (!isCancelled()) {
          setRemoteState(nextState);
          setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
          setStatusMessage("Sincronizado.");
        }
      } catch {
        if (!isCancelled()) setStatusMessage("No se pudo refrescar Firebase.");
      }
    },
  });

  useEffect(() => {
    if (session.status !== "in_game" || pulseState.status !== "idle" || pulseState.schedule?.nextPulseAt) {
      return;
    }

    ensureNextPulseScheduled({ onStatus(message) { setStatusMessage(message); } })
      .then(refresh)
      .catch(() => setStatusMessage("No se pudo programar el siguiente pulso."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, pulseState.status, pulseState.schedule?.nextPulseAt]);

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setElapsedSeconds((current) => {
        const gameTimer = remoteState?.session?.gameTimer;
        return gameTimer?.status === "running" ? getGameTimerElapsedSeconds(gameTimer) : current;
      });
    }, 500);
    return () => window.clearInterval(clockTimer);
  }, [remoteState?.session?.gameTimer]);

  async function handleStartGame() {
    setIsBusy(true);
    setStatusMessage("Abriendo lobby...");
    try {
      const nextState = await startGame();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage("Lobby abierto. Codigo generado.");
    } catch {
      setStatusMessage("No se pudo abrir el lobby.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResetGame() {
    setIsBusy(true);
    setStatusMessage("Reseteando...");
    try {
      const nextState = await resetGame();
      setRemoteState(nextState);
      setElapsedSeconds(0);
      setStatusMessage("Partida reseteada. Jugadores devueltos al acceso.");
    } catch {
      setStatusMessage("No se pudo resetear.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleForceStartGame() {
    setIsBusy(true);
    setStatusMessage("Iniciando partida...");
    try {
      const nextState = await forceStartGameWithReadyPlayers();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage(`Partida iniciada con ${readyPlayerCount || 1} jugador(es) preparado(s).`);
    } catch (error) {
      setStatusMessage(error.message || "No se pudo iniciar la partida.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartPulse() {
    setIsPulseBusy(true);
    setStatusMessage("Lanzando pulso manual...");
    try {
      await startManualPulse({ onStatus(message) { setStatusMessage(message); } });
      await refresh();
    } catch (error) {
      setStatusMessage(error.message || "El pulso ha fallado.");
      await refresh();
    } finally {
      setIsPulseBusy(false);
    }
  }

  async function handleForceResetPulse() {
    setIsBusy(true);
    setStatusMessage("Forzando reset del pulso...");
    try {
      await forceResetPulse();
      await refresh();
      setStatusMessage("Pulso reseteado. Estado listo.");
    } catch {
      setStatusMessage("No se pudo resetear el pulso.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddChip(e) {
    e.preventDefault();
    const cardId = `${addChipRole}_accion_${addChipKind === "inspection" ? "inspeccion" : "interaccion"}`;
    const scenarioHotspots = getScenarioHotspots(activeScenario.id, "A");
    const targetId = addChipTarget || scenarioHotspots[0]?.id || "hotspot_1";
    const id = createId();
    const now = Date.now();
    const action = {
      id,
      role: addChipRole,
      card: cardId,
      target: targetId,
      player: `GM:${addChipRole}`,
      status: "queued",
      createdAt: now,
      loadedAt: now,
      charge: Number(addChipCharge) || 1,
    };
    await firebasePatch("", { [`queuedActions/${id}`]: action });
    setAddChipOpen(false);
    await refresh();
  }

  /** Assign a scenario variant (A-D) to a specific player role. */
  async function handleSetVariant(roleId, variant) {
    try {
      await firebasePatch(`playerBoards/${roleId}`, { variant, scenarioId: activeScenario.id });
      setStatusMessage(`${roleId}: variante ${variant}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo cambiar la variante.");
    }
  }

  async function handleSetGraphType(roleId, graphType) {
    try {
      await firebasePatch(`deviceConfig/${roleId}`, { graphType });
      setStatusMessage(`Grafo ${graphType} → ${roleId}.`);
    } catch {
      setStatusMessage("No se pudo cambiar el grafo.");
    }
  }

  async function handleStartFusion() {
    if (!fusionHotspot) return;
    try {
      const id = Date.now().toString();
      await firebasePatch("fusionSession", {
        id,
        hotspot: fusionHotspot,
        debug: true,
        status: "pending",
        variantA: { ready: false, completedAt: null },
        variantB: { ready: false, completedAt: null },
        createdAt: Date.now(),
        expiresAt: Date.now() + 120000,
      });
      setStatusMessage(`Fusion debug iniciada: ${fusionHotspot}.`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo iniciar la fusion.");
    }
  }

  async function handleCancelFusion() {
    try {
      await firebasePatch("fusionSession", { status: "cancelled" });
      setStatusMessage("Fusion cancelada.");
      await refresh();
    } catch {
      setStatusMessage("No se pudo cancelar la fusion.");
    }
  }

  return (
    <main className="react-screen react-gm-screen">
      <header className="react-screen-header">
        <E2Logo />
        <div>
          <NBadge status="info">Panel GM</NBadge>
          <NBadge status="muted">{activeScenario.label}</NBadge>
          <h1>Control GM</h1>
        </div>
      </header>

      {/* ---- Monitores de jugadores ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${monitorsExpanded ? "expanded" : ""}`}
          onClick={() => setMonitorsExpanded((v) => !v)}
          aria-expanded={monitorsExpanded}
        >
          <span>Monitores de jugadores</span>
          <span className="react-gm-monitors-toggle-badges">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              return <NBadge key={role.id} status={claim ? "success" : "muted"}>{role.label}</NBadge>;
            })}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{monitorsExpanded ? "▲" : "▼"}</span>
        </button>
        {monitorsExpanded && (
          <section className="react-gm-monitor-wall" aria-label="Monitores de jugadores">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              const lastAction = remoteState?.lastRoleActions?.[role.id];
              return (
                <article key={role.id} className="react-gm-monitor">
                  <header>
                    <strong>{role.label}</strong>
                    <NBadge status={claim ? "success" : "muted"}>{claim ? "Conectado" : "Sin jugador"}</NBadge>
                  </header>
                  <iframe title={`Monitor ${role.label}`} src={getPlayerMonitorUrl(role.id)} />
                  <footer>{getActionSummary(lastAction)}</footer>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* ---- Fusion de Realidades debug ---- */}
      <section className="gm-fusion-zone gm-fusion-zone--standalone">
        <h3>Fusion de Realidades · debug</h3>
        <p className="gm-fusion-debug-note">
          Flujo canonico: los jugadores activan la fusion desde el movil. Este control queda para pruebas.
        </p>
        {remoteState?.fusionSession?.status === "pending" ? (
          <div className="gm-fusion-status">
            <span>Objetivo: <strong>{remoteState.fusionSession.hotspot}</strong></span>
            <span className={remoteState.fusionSession.variantA?.ready ? "gm-fusion-ready" : ""}>
              Variante A: {remoteState.fusionSession.variantA?.ready ? "Lista ✓" : "Esperando..."}
            </span>
            <span className={remoteState.fusionSession.variantB?.ready ? "gm-fusion-ready" : ""}>
              Variante B: {remoteState.fusionSession.variantB?.ready ? "Lista ✓" : "Esperando..."}
            </span>
            <button type="button" className="gm-fusion-cancel-btn" onClick={handleCancelFusion}>
              Cancelar Fusion
            </button>
          </div>
        ) : remoteState?.fusionSession?.status === "success" ? (
          <div className="gm-fusion-status">
            <span className="gm-fusion-ready">Fusion completada: {remoteState.fusionSession.hotspot} ✓</span>
            <button type="button" className="gm-fusion-cancel-btn" onClick={handleCancelFusion}>
              Cerrar estado
            </button>
          </div>
        ) : (
          <div className="gm-fusion-controls">
            <select
              className="gm-fusion-select"
              value={fusionHotspot}
              onChange={(e) => setFusionHotspot(e.target.value)}
            >
              <option value="taquillas">Taquillas</option>
            </select>
            <button
              type="button"
              className="gm-fusion-start-btn"
              disabled={!fusionHotspot || session.status !== "in_game"}
              onClick={handleStartFusion}
            >
              Iniciar Fusion debug
            </button>
          </div>
        )}
      </section>

      {/* ---- Dispositivos de jugadores ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${devicesExpanded ? "expanded" : ""}`}
          onClick={() => setDevicesExpanded((v) => !v)}
          aria-expanded={devicesExpanded}
        >
          <span>Dispositivos de jugadores</span>
          <span className="react-gm-monitors-toggle-badges">
            {playerRoles.map((role) => {
              const queued = queuedActions.find(
                (a) => a.role === role.id && ["queued", "executing"].includes(a.status || "queued"),
              );
              return (
                <NBadge key={role.id} status={queued ? "success" : "muted"}>
                  {role.label.split(" ").pop()}
                </NBadge>
              );
            })}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{devicesExpanded ? "▲" : "▼"}</span>
        </button>
        {devicesExpanded && (
          <section className="gm-devices-panel" aria-label="URLs de dispositivos">
            {playerRoles.map((role) => {
              const variant = remoteState?.playerBoards?.[role.id]?.variant || "A";
              const url = getDeviceUrl(role.id, { code: getRoleSessionCode(session, role.id, remoteState?.lobby) });
              const queued = queuedActions.find(
                (a) => a.role === role.id && ["queued", "executing"].includes(a.status || "queued"),
              );
              return (
                <div key={role.id} className="gm-device-card">
                  <div className="gm-device-card-header">
                    <strong>{role.label}</strong>
                    <NBadge status="muted">Realidad {variant}</NBadge>
                    {queued && <NBadge status="success">Chip en cola</NBadge>}
                  </div>
                  <div className="gm-device-url-row">
                    <code className="gm-device-url">{url}</code>
                    <button
                      type="button"
                      className="gm-device-copy-btn"
                      onClick={() => navigator.clipboard.writeText(url)}
                      title="Copiar URL"
                    >
                      Copiar
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="gm-device-open-btn"
                    >
                      Abrir
                    </a>
                  </div>
                  {queued && (
                    <p className="gm-device-queued">
                      Chip en cola: {queued.card} → {queued.target}
                    </p>
                  )}
                  <div className="gm-device-graph-row">
                    <span>Grafo:</span>
                    <select
                      className="gm-device-graph-select"
                      value={remoteState?.deviceConfig?.[role.id]?.graphType || "random"}
                      onChange={(e) => handleSetGraphType(role.id, e.target.value)}
                    >
                      <option value="random">Aleatorio</option>
                      <option value="inspection">Inspeccion</option>
                      <option value="interaction">Interaccion</option>
                    </select>
                  </div>
                </div>
              );
            })}

          </section>
        )}
      </div>

      {/* ---- Mapa de coordenadas ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${showCoordinates ? "expanded" : ""}`}
          onClick={() => setShowCoordinates((v) => !v)}
          aria-expanded={showCoordinates}
        >
          <span>Mapa de coordenadas — {activeScenario.label} {coordinateVariant}</span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{showCoordinates ? "▲" : "▼"}</span>
        </button>
        {showCoordinates && (
          <div className="coord-tool">
            {/* Variant selector */}
            <div className="coord-tool__variants">
              {["A", "B"].map((v) => {
                const hasBg = !!getVariantBackground(activeScenario.id, v);
                return (
                  <button
                    key={v}
                    type="button"
                    className={`coord-tool__variant-btn ${coordinateVariant === v ? "active" : ""}`}
                    onClick={() => setCoordinateVariant(v)}
                  >
                    {activeScenario.label} {v}
                    {!hasBg && <span className="coord-tool__no-img"> (sin imagen)</span>}
                  </button>
                );
              })}
            </div>

            {/* Map */}
            <section className={`react-gm-coordinate-map${isCapturing ? " is-capturing" : ""}`} aria-label="Mapa de coordenadas">
              <SceneMap
                gameState={remoteState?.gameState || {}}
                targetFeedback={remoteState?.targetFeedback || {}}
                selectedTargetId={selectedHotspotId || null}
                queuedForPlayer={null}
                overlayActive={false}
                showCoordinates
                disablePan={isCapturing}
                onCoordClick={isCapturing ? handleMapCoordClick : null}
                onCursorMove={isCapturing ? setCursorPos : null}
                drawingState={drawingState}
                boardTargets={liveCoordinateTargets}
                backgroundSrc={coordinateBg}
                imageAspect={coordinateAspect}
                scenarioId={activeScenario.id}
                variant={coordinateVariant}
                showInspectionDiscoveryPreview={drawMode === "discovery"}
                showPulseAnomalyPreview={drawMode === "anomaly"}
              />
            </section>

            {/* Hotspot editor */}
            <div className="coord-tool__editor">
              {/* Hotspot selector */}
              <div className="coord-tool__editor-row">
                <label className="coord-tool__label" htmlFor="coord-hs-select">Hotspot</label>
                <select
                  id="coord-hs-select"
                  className="coord-tool__select"
                  value={selectedHotspotId}
                  onChange={(e) => setSelectedHotspotId(e.target.value)}
                >
                  <option value="">— seleccionar —</option>
                  {coordinateTargets.map((t) => {
                    const hasOverride = !!effectiveHotspotOverrides[overrideKey]?.[t.id];
                    return (
                      <option key={t.id} value={t.id}>
                        {hasOverride ? "● " : ""}{t.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedHotspotId && (
                <>
                  {/* Draw mode toggle */}
                  <div className="coord-tool__editor-row">
                    <span className="coord-tool__label">Modo</span>
                    <div className="coord-tool__mode-btns">
                      <button
                        type="button"
                        className={`coord-tool__mode-btn ${drawMode === "rect" ? "active" : ""}`}
                        onClick={() => {
                          setDrawMode("rect");
                          setClickCapture(null);
                          setPolygonPoints([]);
                          setRectCaptureFromHotspot(savedCoordinateTargets.find((t) => t.id === selectedHotspotId));
                        }}
                      >
                        ▣ Rectángulo
                      </button>
                      <button
                        type="button"
                        className={`coord-tool__mode-btn ${drawMode === "polygon" ? "active" : ""}`}
                        onClick={() => { setDrawMode("polygon"); setClickCapture(null); setCapturedPoints({ p1: null, p2: null }); }}
                      >
                        ⬡ Polígono
                      </button>
                      <button
                        type="button"
                        className={`coord-tool__mode-btn ${drawMode === "card" ? "active" : ""}`}
                        onClick={() => { setDrawMode("card"); setClickCapture(null); }}
                      >
                        ▤ Ventana
                      </button>
                      <button
                        type="button"
                        className={`coord-tool__mode-btn ${drawMode === "discovery" ? "active" : ""}`}
                        onClick={() => { setDrawMode("discovery"); setClickCapture(null); }}
                      >
                        Detalle inspeccion
                      </button>
                      <button
                        type="button"
                        className={`coord-tool__mode-btn ${drawMode === "anomaly" ? "active" : ""}`}
                        onClick={() => {
                          setDrawMode("anomaly");
                          setClickCapture(null);
                          setPolygonPoints([]);
                          setAnomalyCaptureFromHotspot(savedCoordinateTargets.find((t) => t.id === selectedHotspotId));
                        }}
                      >
                        Anomalia pulso
                      </button>
                    </div>
                  </div>

                  {/* Rectangle controls */}
                  {drawMode === "rect" && (
                    <div className="coord-tool__editor-row">
                      <span className="coord-tool__label">Puntos</span>
                      <div className="coord-tool__click-points">
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "p1" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "p1" ? null : "p1")}
                        >
                          {clickCapture === "p1" ? "● Capturando P1…" : capturedPoints.p1 ? `P1 (${capturedPoints.p1.x.toFixed(1)}, ${capturedPoints.p1.y.toFixed(1)})` : "Clic P1 — sup. izq."}
                        </button>
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "p2" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "p2" ? null : "p2")}
                        >
                          {clickCapture === "p2" ? "● Capturando P2…" : capturedPoints.p2 ? `P2 (${capturedPoints.p2.x.toFixed(1)}, ${capturedPoints.p2.y.toFixed(1)})` : "Clic P2 — inf. der."}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Polygon controls */}
                  {drawMode === "polygon" && (
                    <div className="coord-tool__editor-row">
                      <span className="coord-tool__label">Vértices</span>
                      <div className="coord-tool__click-points">
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "polygon" ? "capturing" : ""}`}
                          onClick={() => {
                            if (clickCapture === "polygon") {
                              setClickCapture(null);
                            } else {
                              setPolygonPoints([]);
                              setClickCapture("polygon");
                            }
                          }}
                        >
                          {clickCapture === "polygon" ? `● Trazando… (${polygonPoints.length} pts)` : "Iniciar trazado"}
                        </button>
                        {polygonPoints.length >= 3 && (
                          <button
                            type="button"
                            className="coord-tool__click-btn"
                            onClick={handleClosePolygon}
                          >
                            Cerrar polígono ({polygonPoints.length} pts)
                          </button>
                        )}
                        {polygonPoints.length > 0 && (
                          <button
                            type="button"
                            className="coord-tool__click-btn coord-tool__click-btn--danger"
                            onClick={() => { setPolygonPoints([]); setClickCapture(null); }}
                          >
                            Borrar puntos
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Object card controls */}
                  {drawMode === "card" && (
                    <div className="coord-tool__editor-row">
                      <span className="coord-tool__label">Ventana</span>
                      <div className="coord-tool__click-points">
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "card" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "card" ? null : "card")}
                        >
                          {clickCapture === "card"
                            ? "● Colocando ventana…"
                            : cardPosition
                              ? `Ventana (${cardPosition.cardX.toFixed(1)}, ${cardPosition.cardY.toFixed(1)})`
                              : "Colocar ventana"}
                        </button>
                        <button
                          type="button"
                          className="coord-tool__click-btn"
                          onClick={() => {
                            const hs = savedCoordinateTargets.find((t) => t.id === selectedHotspotId);
                            if (hs) setCardPosition(getDefaultCardPosition({ ...hs, cardX: undefined, cardY: undefined }));
                          }}
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inspection detail card controls */}
                  {drawMode === "discovery" && (
                    <div className="coord-tool__editor-row">
                      <span className="coord-tool__label">Detalle</span>
                      <div className="coord-tool__click-points">
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "discovery" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "discovery" ? null : "discovery")}
                        >
                          {clickCapture === "discovery"
                            ? "Colocando detalle..."
                            : discoveryCardPosition
                              ? `Detalle (${discoveryCardPosition.discoveryCardX.toFixed(1)}, ${discoveryCardPosition.discoveryCardY.toFixed(1)})`
                              : "Colocar detalle"}
                        </button>
                        <button
                          type="button"
                          className="coord-tool__click-btn"
                          onClick={() => {
                            const hs = savedCoordinateTargets.find((t) => t.id === selectedHotspotId);
                            if (hs) setDiscoveryCardPosition(getDefaultDiscoveryCardPosition({ ...hs, discoveryCardX: undefined, discoveryCardY: undefined }));
                          }}
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pulse anomaly controls */}
                  {drawMode === "anomaly" && (
                    <div className="coord-tool__editor-row">
                      <span className="coord-tool__label">Anomalia</span>
                      <div className="coord-tool__click-points">
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "anomalyP1" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "anomalyP1" ? null : "anomalyP1")}
                        >
                          {clickCapture === "anomalyP1" ? "Capturando P1..." : capturedPoints.p1 ? `P1 (${capturedPoints.p1.x.toFixed(1)}, ${capturedPoints.p1.y.toFixed(1)})` : "Clic P1 — sup. izq."}
                        </button>
                        <button
                          type="button"
                          className="coord-tool__click-btn"
                          onClick={() => {
                            setAnomalyCaptureFromHotspot(savedCoordinateTargets.find((t) => t.id === selectedHotspotId));
                            setClickCapture(null);
                          }}
                        >
                          Auto
                        </button>
                        <button
                          type="button"
                          className={`coord-tool__click-btn ${clickCapture === "anomalyP2" ? "capturing" : ""}`}
                          onClick={() => setClickCapture(clickCapture === "anomalyP2" ? null : "anomalyP2")}
                        >
                          {clickCapture === "anomalyP2" ? "Capturando P2..." : capturedPoints.p2 ? `P2 (${capturedPoints.p2.x.toFixed(1)}, ${capturedPoints.p2.y.toFixed(1)})` : "Clic P2 — inf. der."}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Result row */}
                  {editedHotspotData && (
                    <div className="coord-tool__result">
                      <code className="coord-tool__result-code">
                        {drawMode === "card"
                          ? `cardX: ${editedHotspotData.cardX}, cardY: ${editedHotspotData.cardY}`
                          : drawMode === "discovery"
                            ? `discoveryCardX: ${editedHotspotData.discoveryCardX}, discoveryCardY: ${editedHotspotData.discoveryCardY}`
                            : drawMode === "anomaly"
                              ? `anomalyX: ${editedHotspotData.anomalyX}, anomalyY: ${editedHotspotData.anomalyY}, anomalyW: ${editedHotspotData.anomalyW}, anomalyH: ${editedHotspotData.anomalyH}`
                            : `x: ${editedHotspotData.x}, y: ${editedHotspotData.y}, w: ${editedHotspotData.w}, h: ${editedHotspotData.h}`}
                        {editedHotspotData.points && ` · ${editedHotspotData.points.length} pts`}
                      </code>
                      <div className="coord-tool__actions">
                        <button
                          type="button"
                          className={`coord-tool__save-btn ${currentHotspotIsSaved ? "saved" : ""}`}
                          onClick={handleSaveHotspot}
                        >
                          {saveFeedback ? "Guardado!" : currentHotspotIsSaved ? "Guardado" : "Guardar"}
                        </button>
                        {effectiveHotspotOverrides[overrideKey]?.[selectedHotspotId] && (
                          <button
                            type="button"
                            className="coord-tool__reset-btn"
                            onClick={handleResetHotspot}
                          >
                            Resetear
                          </button>
                        )}
                        <button
                          type="button"
                          className="coord-tool__copy-btn"
                          onClick={handleCopyCoords}
                        >
                          {copyFeedback ? "Copiado!" : "Copiar"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Organigrama tecnico de overlays ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${technicalFlowExpanded ? "expanded" : ""}`}
          onClick={() => setTechnicalFlowExpanded((v) => !v)}
          aria-expanded={technicalFlowExpanded}
        >
          <span>Organigrama tecnico</span>
          <span className="react-gm-monitors-toggle-badges">
            <NBadge status={gameState?.flags?.almacenSalidaLista ? "success" : "info"}>
              overlays A/B
            </NBadge>
            {gameState?.flags?.moduleSyncInserted && <NBadge status="success">modulo insertado</NBadge>}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{technicalFlowExpanded ? "▲" : "▼"}</span>
        </button>
        {technicalFlowExpanded && (
          <GMTechnicalFlowchart
            remoteState={remoteState}
            onRefresh={refresh}
            onStatus={setStatusMessage}
          />
        )}
      </div>

      <section className="react-gm-grid">
        {/* ---- Partida ---- */}
        <NCard title="Partida" gold>
          <NBadge status={getSessionBadgeStatus(session.status)}>
            {session.status === "in_game" ? "Partida en curso" : "Sin comenzar"}
          </NBadge>
          <p className="session-code">
            GM: {session.accessCode || "sin generar"}
            {session.accessCode && (
              <button
                className="session-code-copy"
                type="button"
                onClick={() => navigator.clipboard.writeText(session.accessCode)}
                title="Copiar codigo"
              >
                Copiar
              </button>
            )}
          </p>
          {session.playerCodes && (
            <div className="player-codes-grid">
              {Object.entries(session.playerCodes).map(([label, code]) => {
                const codeDisplay = getPlayerCodeDisplay(label, code, remoteState?.lobby);
                const labelText = codeDisplay.hasJoined ? codeDisplay.playerName : label;
                const copyLabel = codeDisplay.role ? `${labelText} - ${codeDisplay.role.label}` : labelText;

                return (
                  <div key={label} className="player-code-item">
                    <span className="player-code-label">
                      <span>{labelText}</span>
                      {codeDisplay.role && (
                        <NBadge status={codeDisplay.hasJoined ? codeDisplay.role.status : "muted"}>
                          {codeDisplay.role.label}
                        </NBadge>
                      )}
                    </span>
                    <span className="player-code-value">{code}</span>
                    <button
                      className="session-code-copy"
                      type="button"
                      onClick={() => navigator.clipboard.writeText(code)}
                      title={`Copiar codigo ${copyLabel}`}
                    >
                      Copiar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <NTimer seconds={elapsedSeconds} />
          <p className="react-status" role="status" aria-live="polite">{statusMessage}</p>
          <div className="button-row">
            <NButton onClick={handleStartGame} disabled={isBusy}>Abrir lobby</NButton>
            <NButton
              variant="secondary"
              onClick={handleForceStartGame}
              disabled={isBusy || session.status === "in_game" || readyPlayerCount < 1}
            >
              Iniciar partida
            </NButton>
            <NButton variant="danger" onClick={handleResetGame} disabled={isBusy}>Resetear</NButton>
          </div>
          <p className="react-status gm-start-rule">
            Inicio manual GM: disponible con {readyPlayerCount} jugador(es) preparado(s).
          </p>
        </NCard>

        {/* ---- Variantes por jugador ---- */}
        <NCard title="Variantes">
          <div className="gm-variants-scenario">
            <h3 className="gm-variants-scenario-title">{activeScenario.label}</h3>
            <div className="gm-variant-cards">
              {playerRoles.map((role) => {
                const claim = remoteState?.lobby?.roleClaims?.[role.id];
                const variant = remoteState?.playerBoards?.[role.id]?.variant || "A";
                return (
                  <div key={role.id} className="gm-variant-card">
                    <div className="gm-variant-card-header">
                      <NBadge status={claim ? role.status : "muted"}>{role.label}</NBadge>
                      <span className="gm-variant-card-current">{variant}</span>
                    </div>
                    <div className="button-row">
                      {SCENARIO_VARIANTS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`gm-variant-btn ${variant === v ? "active" : ""}`}
                          onClick={() => handleSetVariant(role.id, v)}
                          disabled={session.status !== "in_game"}
                          title={`Variante ${v}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </NCard>

        {/* ---- Cola de chips + pulso ---- */}
        <NCard title="Cola de chips" glow>
          <div className="gm-pulse-scheduler">
            <div>
              <span>Proximo pulso</span>
              <strong>{pulseState.status === "executing" ? "En ejecucion" : formatPulseCountdown(pulseSchedule.remainingMs)}</strong>
            </div>
            <div>
              <span>Ventana auto</span>
              <strong>
                {Math.round((pulseState.schedule?.minMs || 40000) / 1000)}s - {Math.round((pulseState.schedule?.maxMs || 120000) / 1000)}s
              </strong>
            </div>
            <div>
              <span>Origen</span>
              <strong>{pulseState.mode || "auto"}</strong>
            </div>
          </div>
          <ActionQueuePanel
            pulseState={pulseState}
            queuedActions={queuedActions}
            emptyMessage="No hay chips esperando pulso."
            ariaLabel="Cola de chips del pulso"
            stackClassName="gm"
          />
          <div className="button-row">
            <NButton
              onClick={handleStartPulse}
              disabled={isBusy || isPulseBusy || pulseState.status !== "idle"}
            >
              {isPulseBusy ? "Pulso en curso" : "Lanzar pulso ahora"}
            </NButton>
            <NButton
              variant="ghost"
              disabled={session.status !== "in_game" || pulseState.status !== "idle"}
              onClick={async () => {
                await ensureNextPulseScheduled({ onStatus(message) { setStatusMessage(message); } });
                await refresh();
              }}
            >
              Programar auto
            </NButton>
            <NButton variant="secondary" onClick={() => setAddChipOpen((v) => !v)}>
              {addChipOpen ? "Cancelar" : "+ Chip"}
            </NButton>
            {pulseState.status === "executing" && (
              <NButton
                variant="danger"
                disabled={isBusy}
                onClick={handleForceResetPulse}
              >
                Forzar reset
              </NButton>
            )}
          </div>
          {addChipOpen && (
            <form className="gm-add-chip-form" onSubmit={handleAddChip}>
              <div className="gm-add-chip-fields">
                <label className="gm-add-chip-field">
                  <span>Tipo</span>
                  <select value={addChipKind} onChange={(e) => setAddChipKind(e.target.value)}>
                    <option value="inspection">Inspeccion</option>
                    <option value="interaction">Interaccion</option>
                  </select>
                </label>
                <label className="gm-add-chip-field">
                  <span>Rol</span>
                  <select value={addChipRole} onChange={(e) => setAddChipRole(e.target.value)}>
                    {playerRoles.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </label>
                <label className="gm-add-chip-field">
                  <span>Objetivo</span>
                  <select value={addChipTarget} onChange={(e) => setAddChipTarget(e.target.value)}>
                    <option value="">— primero disponible —</option>
                    {getScenarioHotspots(activeScenario.id, "A").map((h) => (
                      <option key={h.id} value={h.id}>{h.label}</option>
                    ))}
                  </select>
                </label>
                <label className="gm-add-chip-field">
                  <span>Carga</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={addChipCharge}
                    onChange={(e) => setAddChipCharge(e.target.value)}
                    className="gm-add-chip-charge-input"
                  />
                </label>
              </div>
              <NButton type="submit" disabled={isBusy}>Añadir chip</NButton>
            </form>
          )}
        </NCard>

        {/* ---- Historial ---- */}
        <NCard title="Historial">
          <div className="react-list">
            {actionLog.length === 0 ? (
              <p>Sin historial todavia.</p>
            ) : (
              actionLog.map((message, index) => (
                <article key={`${message}-${index}`} className="react-list-item">
                  <span>{message}</span>
                </article>
              ))
            )}
          </div>
        </NCard>
      </section>

    </main>
  );
}
