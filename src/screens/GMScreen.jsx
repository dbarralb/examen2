import { useEffect, useMemo, useRef, useState } from "react";
import { E2Logo, NBadge, NButton, NCard, NTimer } from "../components/e2";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { playerRoles } from "../data/roles.js";
import { targets } from "../data/gameData.js";
import { DEFAULT_SCENARIO_ID, SCENARIO_VARIANTS, getScenario, getVariantBackground, getVariantImageAspect } from "../data/scenarioData.js";
import { applyScenarioHotspotOverrides, getScenarioHotspotOverrideKey, getScenarioHotspots } from "../data/scenarioContent.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { forceStartGameWithReadyPlayers, getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { getAlarmRecommendations } from "../services/gameRules.js";
import { gmSceneEffects, toggleSceneEffect } from "../services/gmSceneControl.js";
import { startManualPulse } from "../services/pulseService.js";
import { getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";

function getSessionBadgeStatus(status) {
  return status === "in_game" ? "success" : "muted";
}

function getMonitorSrc(roleId) {
  const params = new URLSearchParams({
    screen: "player",
    role: roleId,
    view: "gm-monitor",
  });

  return `${window.location.pathname}?${params.toString()}`;
}

function getActionSummary(action) {
  if (!action) return "Sin accion registrada.";
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

export function GMScreen() {
  const [remoteState, setRemoteState] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Conectando con Firebase...");
  const [isBusy, setIsBusy] = useState(false);
  const [isPulseBusy, setIsPulseBusy] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [coordinateVariant, setCoordinateVariant] = useState("A");
  const [selectedHotspotId, setSelectedHotspotId] = useState("");
  const [drawMode, setDrawMode] = useState("rect"); // "rect" | "polygon" | "card" | "discovery"
  const [clickCapture, setClickCapture] = useState(null); // null | "p1" | "p2" | "polygon" | "card" | "discovery"
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
  const [sceneControlExpanded, setSceneControlExpanded] = useState(false);

  const session = remoteState?.session || {};
  const sessionState = remoteState?.sessionState || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 8), [remoteState]);
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

  // Firebase strips empty arrays — normalize to safe defaults
  const rawGmScene = gameState.gmSceneState || {};
  const gmSceneState = {
    activeVariant: rawGmScene.activeVariant || "normal",
    activeEffects: Array.isArray(rawGmScene.activeEffects) ? rawGmScene.activeEffects : [],
    history: Array.isArray(rawGmScene.history) ? rawGmScene.history : [],
  };
  const rawAlarm = gameState.alarmState || {};
  const alarmState = {
    level: rawAlarm.level ?? 0,
    noise: rawAlarm.noise ?? 0,
    triggers: Array.isArray(rawAlarm.triggers) ? rawAlarm.triggers : [],
  };
  const flags = gameState.flags || {};
  const alarmRecommendations = useMemo(
    () => getAlarmRecommendations(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alarmState.level, alarmState.noise],
  );

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
    if (!selectedHotspotId || clickCapture === null && drawMode === "rect" && !capturedPoints.p1) return null;
    const hint = clickCapture === "p1" ? "P1 — esquina superior izq."
      : clickCapture === "p2" ? "P2 — esquina inferior der."
      : clickCapture === "polygon" ? "Clic para añadir vértice"
      : clickCapture === "card" ? "Clic para colocar ventana"
      : clickCapture === "discovery" ? "Clic para colocar detalle"
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
    setStatusMessage("Preparando pulso...");
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

  async function handleToggleSceneEffect(effectId) {
    try {
      await toggleSceneEffect(effectId, "GM activó desde panel de escenario");
      setStatusMessage(`Efecto de escena actualizado: ${effectId}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo actualizar el efecto de escena.");
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
                  <iframe title={`Monitor ${role.label}`} src={getMonitorSrc(role.id)} />
                  <footer>{getActionSummary(lastAction)}</footer>
                </article>
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
                pendingAction={null}
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
                        onClick={() => { setDrawMode("rect"); setClickCapture(null); setPolygonPoints([]); }}
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

                  {/* Result row */}
                  {editedHotspotData && (
                    <div className="coord-tool__result">
                      <code className="coord-tool__result-code">
                        {drawMode === "card"
                          ? `cardX: ${editedHotspotData.cardX}, cardY: ${editedHotspotData.cardY}`
                          : drawMode === "discovery"
                            ? `discoveryCardX: ${editedHotspotData.discoveryCardX}, discoveryCardY: ${editedHotspotData.discoveryCardY}`
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
              {Object.entries(session.playerCodes).map(([label, code]) => (
                <div key={label} className="player-code-item">
                  <span className="player-code-label">{label}</span>
                  <span className="player-code-value">{code}</span>
                  <button
                    className="session-code-copy"
                    type="button"
                    onClick={() => navigator.clipboard.writeText(code)}
                    title={`Copiar codigo ${label}`}
                  >
                    Copiar
                  </button>
                </div>
              ))}
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
        <NCard title={`Variantes — ${activeScenario.label}`}>
          <p className="react-status">
            Cada jugador vive una variante del escenario (A/B/C/D).
            Asigna aquí qué realidad ve cada uno.
          </p>
          <div className="gm-variant-grid">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              const variant = remoteState?.playerBoards?.[role.id]?.variant || "A";
              return (
                <div key={role.id} className="gm-variant-row">
                  <NBadge status={claim ? role.status : "muted"}>{role.label}</NBadge>
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
        </NCard>

        {/* ---- Cola de acciones + pulso ---- */}
        <NCard title="Cola de acciones" glow>
          <ActionQueuePanel
            pulseState={pulseState}
            queuedActions={queuedActions}
            emptyMessage="No hay acciones esperando pulso."
            ariaLabel="Cola de acciones del pulso"
            stackClassName="gm"
          />
          <div className="button-row">
            <NButton
              onClick={handleStartPulse}
              disabled={isBusy || isPulseBusy || pulseState.status !== "idle"}
            >
              {isPulseBusy ? "Pulso en curso" : "Comenzar pulso"}
            </NButton>
            <NButton variant="ghost" disabled>Auto pulso</NButton>
          </div>
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

      {/* ---- Control de Escenario (alarma + efectos GM) ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${sceneControlExpanded ? "expanded" : ""}`}
          onClick={() => setSceneControlExpanded((v) => !v)}
          aria-expanded={sceneControlExpanded}
        >
          <span>Control de Escenario</span>
          <span className="react-gm-monitors-toggle-badges">
            <NBadge status={alarmState.level === 0 ? "muted" : alarmState.level >= 3 ? "danger" : "warning"}>
              Alarma {alarmState.level}
            </NBadge>
            {gmSceneState.activeEffects.length > 0 && (
              <NBadge status="warning">
                {gmSceneState.activeEffects.length} efecto{gmSceneState.activeEffects.length > 1 ? "s" : ""} activo{gmSceneState.activeEffects.length > 1 ? "s" : ""}
              </NBadge>
            )}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{sceneControlExpanded ? "▲" : "▼"}</span>
        </button>
        {sceneControlExpanded && (
          <section className="react-gm-scene-control" aria-label="Control de escenario">
            {/* Métricas de alarma */}
            <div className="gm-scene-metrics">
              <div className="gm-scene-metric">
                <strong>Nivel de alarma:</strong>
                <NBadge status={alarmState.level === 0 ? "success" : alarmState.level >= 3 ? "danger" : "warning"}>
                  {alarmState.level} — {["normal", "sospecha", "alarma", "contencion"][alarmState.level] || "?"}
                </NBadge>
              </div>
              <div className="gm-scene-metric">
                <strong>Ruido acumulado:</strong> {alarmState.noise}
              </div>
              {alarmState.triggers?.length > 0 && (
                <div className="gm-scene-metric">
                  <strong>Últimos triggers:</strong>
                  <span>{alarmState.triggers.slice(-5).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Flags activos */}
            {Object.keys(flags).length > 0 && (
              <div className="gm-scene-flags">
                <strong>Flags activos:</strong>
                {Object.entries(flags).filter(([, v]) => v === true).map(([key]) => (
                  <NBadge key={key} status="success">{key}</NBadge>
                ))}
              </div>
            )}

            {/* Recomendaciones */}
            {alarmRecommendations.length > 0 && (
              <div className="gm-scene-recommendations">
                <strong>Recomendaciones:</strong>
                {alarmRecommendations.map((rec) => (
                  <div key={rec.id} className="gm-scene-rec">
                    <span>{rec.label}</span>
                    <small>{rec.reason}</small>
                  </div>
                ))}
              </div>
            )}

            {/* Efectos de escena */}
            <div className="gm-scene-effects">
              <strong>Efectos de escena:</strong>
              <div className="button-row">
                {gmSceneEffects.map((effect) => {
                  const isActive = gmSceneState.activeEffects.includes(effect.id);
                  return (
                    <button
                      key={effect.id}
                      type="button"
                      className={`gm-effect-btn ${isActive ? "active" : ""}`}
                      title={effect.description}
                      onClick={() => handleToggleSceneEffect(effect.id)}
                    >
                      {isActive ? "✓ " : ""}{effect.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variante de escena GM */}
            <div className="gm-scene-metric">
              <strong>Variante activa:</strong>
              <NBadge status={gmSceneState.activeVariant === "normal" ? "muted" : "warning"}>
                {gmSceneState.activeVariant}
              </NBadge>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
