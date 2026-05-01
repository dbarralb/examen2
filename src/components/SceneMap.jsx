import { useEffect, useRef, useState } from "react";
import { NBadge } from "./e2";
import { SoftwareLoadMinigame } from "./SoftwareLoadMinigame.jsx";
import { DeviceConsole } from "./DeviceConsole.jsx";
import { BackgroundLayer } from "./map/BackgroundLayer.jsx";
import { StructureLayer } from "./map/StructureLayer.jsx";
import { InteractiveLayer } from "./map/InteractiveLayer.jsx";
import { CoordinateOverlay } from "./map/CoordinateOverlay.jsx";
import { getContainerOpenState, getTarget, getTargetImage, getTargetStateLabel, getTargetItems, targets } from "../data/gameData.js";
import { ObjectInventoryGrid } from "./ObjectInventoryGrid.jsx";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";

const DEFAULT_MAP_ASPECT = 1826 / 1080;
const MIN_SCALE = 0.8;
const MIN_SCALE_WIDE = 1.0; // panoramic images must fill viewport height
const MAX_SCALE = 3;
const MONITOR_CAMERA_SCALE_FACTOR = 0.6;
const TARGET_FOCUS_SCALE = 1.45;
const TARGET_CARD_WIDTH = 264;
const TARGET_CARD_HEIGHT = 376;
const FOCUS_TRANSITION_MS = 620;
const MOUSE_DETECTION_RADII = [
  { level: 4, distance: 24 },
  { level: 3, distance: 48 },
  { level: 2, distance: 80 },
  { level: 1, distance: 120 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFitLayout(width, height, aspect = DEFAULT_MAP_ASPECT) {
  if (!width || !height) {
    return { width: 0, height: 0, mapWidth: 0, mapHeight: 0 };
  }

  if (aspect > width / height) {
    // Wide/panoramic: fit to viewport height so full height is always visible;
    // excess width is revealed by horizontal panning.
    return { width, height, mapWidth: height * aspect, mapHeight: height };
  }

  const mapWidth = Math.min(width, height * aspect);
  const mapHeight = mapWidth / aspect;
  return { width, height, mapWidth, mapHeight };
}

function clampCamera(camera, layout) {
  if (!layout.mapWidth || !layout.mapHeight) {
    return camera;
  }

  const scaledWidth = layout.mapWidth * camera.scale;
  const scaledHeight = layout.mapHeight * camera.scale;
  const minX = layout.width - scaledWidth;
  const minY = layout.height - scaledHeight;

  return {
    scale: camera.scale,
    x: scaledWidth <= layout.width ? (layout.width - scaledWidth) / 2 : clamp(camera.x, minX, 0),
    y: scaledHeight <= layout.height ? (layout.height - scaledHeight) / 2 : clamp(camera.y, minY, 0),
  };
}

function getFitCamera(layout, minScale = MIN_SCALE) {
  return clampCamera({ x: (layout.width - layout.mapWidth) / 2, y: (layout.height - layout.mapHeight) / 2, scale: minScale }, layout);
}

function getRectDistanceToPoint(target, point, layout) {
  const left = (target.x / 100) * layout.mapWidth;
  const top = (target.y / 100) * layout.mapHeight;
  const right = ((target.x + target.w) / 100) * layout.mapWidth;
  const bottom = ((target.y + target.h) / 100) * layout.mapHeight;

  if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) {
    return 0;
  }

  const dx = Math.max(left - point.x, 0, point.x - right);
  const dy = Math.max(top - point.y, 0, point.y - bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

function getPixelPoint(point, layout) {
  return {
    x: (point.x / 100) * layout.mapWidth,
    y: (point.y / 100) * layout.mapHeight,
  };
}

function isPointInPolygon(point, points, layout) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = getPixelPoint(points[i], layout);
    const b = getPixelPoint(points[j], layout);
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 1) + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function getDistanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;
  const offX = point.x - closestX;
  const offY = point.y - closestY;
  return Math.sqrt(offX * offX + offY * offY);
}

function getPolygonDistanceToPoint(target, point, layout) {
  if (isPointInPolygon(point, target.points, layout)) {
    return 0;
  }

  return target.points.reduce((minDistance, current, index) => {
    const next = target.points[(index + 1) % target.points.length];
    return Math.min(minDistance, getDistanceToSegment(point, getPixelPoint(current, layout), getPixelPoint(next, layout)));
  }, Infinity);
}

function getTargetDistanceToPoint(target, point, layout) {
  if (target.points?.length >= 3) {
    return getPolygonDistanceToPoint(target, point, layout);
  }

  return getRectDistanceToPoint(target, point, layout);
}

function getDetectionLevel(screenDistance) {
  if (screenDistance <= 0) {
    return 5;
  }

  return MOUSE_DETECTION_RADII.find(({ distance }) => screenDistance <= distance)?.level || 0;
}

function emitCursorDetectionLevel(level) {
  window.dispatchEvent(new CustomEvent("game-cursor-state", { detail: { level } }));
}

function getTargetCardSide(target) {
  return target.x > 72 ? "left" : "right";
}

function getTargetCardStyle(target) {
  if (Number.isFinite(target.cardX) && Number.isFinite(target.cardY)) {
    return {
      left: `${target.cardX}%`,
      top: `${target.cardY}%`,
      "--object-card-offset-x": "-50%",
      "--object-card-offset-y": "-50%",
    };
  }

  const side = getTargetCardSide(target);
  const left = side === "left" ? target.x - 22 : target.x + target.w + 2;
  const isLowerHalf = target.y + target.h / 2 > 50;
  const top = isLowerHalf ? clamp(target.y - 30, 4, 76) : clamp(target.y - 2, 4, 76);

  return {
    left: `${left}%`,
    top: `${top}%`,
  };
}

// SVG preview rendered inside scene-map-world (transforms with zoom/pan)
function DrawingPreviewSVG({ drawingState }) {
  const { mode, p1, p2, polygonPoints, cursorPos } = drawingState;

  return (
    <svg
      className="map-drawing-preview"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20 }}
    >
      {mode === "rect" && (
        <>
          {/* Ghost rect between p1 and cursor (or p2 if captured) */}
          {p1 && (p2 || cursorPos) && (() => {
            const end = p2 || cursorPos;
            const rx = Math.min(p1.x, end.x);
            const ry = Math.min(p1.y, end.y);
            const rw = Math.abs(end.x - p1.x);
            const rh = Math.abs(end.y - p1.y);
            return <rect x={rx} y={ry} width={rw} height={rh} className="draw-preview-rect" />;
          })()}
          {/* P1 dot */}
          {p1 && <circle cx={p1.x} cy={p1.y} r="0.8" className="draw-preview-dot draw-preview-dot--p1" />}
          {/* P2 dot */}
          {p2 && <circle cx={p2.x} cy={p2.y} r="0.8" className="draw-preview-dot draw-preview-dot--p2" />}
        </>
      )}

      {mode === "polygon" && (
        <>
          {/* Completed edges */}
          {polygonPoints.length >= 2 && (
            <polyline
              points={polygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              className="draw-preview-polyline"
            />
          )}
          {/* Line from last point to cursor */}
          {polygonPoints.length >= 1 && cursorPos && (() => {
            const last = polygonPoints[polygonPoints.length - 1];
            return (
              <line
                x1={last.x} y1={last.y}
                x2={cursorPos.x} y2={cursorPos.y}
                className="draw-preview-cursor-line"
              />
            );
          })()}
          {/* Vertex dots */}
          {polygonPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.8" className="draw-preview-dot" />
          ))}
          {/* Close-path preview line (first vertex) */}
          {polygonPoints.length >= 3 && cursorPos && (
            <line
              x1={polygonPoints[0].x} y1={polygonPoints[0].y}
              x2={cursorPos.x} y2={cursorPos.y}
              className="draw-preview-close-line"
            />
          )}
        </>
      )}
    </svg>
  );
}

export function SceneMap({
  gameState,
  targetFeedback,
  selectedTargetId,
  pendingAction,
  queuedForPlayer,
  overlayActive,
  onSelectTarget,
  onCloseTarget,
  onDrop,
  onCancelPendingAction,
  onMinigameChange,
  onMinigameRetry,
  onMinigameSuccess,
  isMonitorView = false,
  externalCamera = null,
  onCameraChange,
  showCoordinates = false,
  itemSeenState = {},
  dropZoneState = {},
  onItemClick,
  onItemDragStart,
  onDropZoneDrop,
  onLoadConfirm,
  revealedSlots = {},
  activeZone = null,
  boardTargets = null,
  backgroundSrc = null,
  imageAspect = null,
  scenarioId = "almacen",
  variant = "A",
  onDeviceCommand,
  deviceCommandResult = null,
  disablePan = false,
  onCoordClick = null,
  onCursorMove = null,
  drawingState = null,
  focusSelectedTarget = false,
}) {
  const effectiveAspect = imageAspect || DEFAULT_MAP_ASPECT;
  const effectiveMinScale = imageAspect && imageAspect > DEFAULT_MAP_ASPECT ? MIN_SCALE_WIDE : MIN_SCALE;

  // boardTargets takes priority; otherwise filter by activeZone or show all.
  const visibleTargets = boardTargets
    ? boardTargets
    : activeZone
      ? activeZone.targetIds.map((id) => getTarget(id)).filter(Boolean)
      : targets;
  const selectedFocusTarget = focusSelectedTarget
    ? visibleTargets.find((item) => item.id === selectedTargetId)
    : null;
  const selectedFocusSignature = selectedFocusTarget
    ? [
      selectedFocusTarget.id,
      selectedFocusTarget.x,
      selectedFocusTarget.y,
      selectedFocusTarget.w,
      selectedFocusTarget.h,
      selectedFocusTarget.cardX,
      selectedFocusTarget.cardY,
      selectedFocusTarget.points?.length || 0,
    ].join(":")
    : "";
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const detectionLevelRef = useRef(0);
  const [layout, setLayout] = useState(() => getFitLayout(0, 0, effectiveAspect));
  const [camera, setCamera] = useState(() => ({ x: 0, y: 0, scale: effectiveMinScale }));
  const [isPanning, setIsPanning] = useState(false);
  const [isFocusTransitioning, setIsFocusTransitioning] = useState(false);
  const [consoleOpenTargetId, setConsoleOpenTargetId] = useState(null);
  const focusTransitionTimeoutRef = useRef(null);
  const shouldDetectMouse = !isMonitorView && !showCoordinates;

  // Close device console when the selected target changes or closes
  useEffect(() => {
    if (!selectedTargetId || selectedTargetId !== consoleOpenTargetId) {
      setConsoleOpenTargetId(null);
    }
  }, [selectedTargetId, consoleOpenTargetId]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return undefined;
    }

    function updateLayout() {
      const rect = viewport.getBoundingClientRect();
      const nextLayout = getFitLayout(rect.width, rect.height, effectiveAspect);
      setLayout(nextLayout);
      setCamera((current) => {
        if (!layout.mapWidth || !layout.mapHeight) {
          return getFitCamera(nextLayout, effectiveMinScale);
        }

        return clampCamera(current, nextLayout);
      });
    }

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [layout.mapHeight, layout.mapWidth, effectiveAspect, effectiveMinScale]);

  useEffect(() => () => window.clearTimeout(focusTransitionTimeoutRef.current), []);

  useEffect(() => () => emitCursorDetectionLevel(0), []);

  useEffect(() => {
    onCameraChange?.(camera);
  }, [camera, onCameraChange]);

  useEffect(() => {
    if (!isMonitorView || !externalCamera || !layout.mapWidth || !layout.mapHeight) {
      return;
    }

    setCamera(clampCamera({
      x: Number(externalCamera.x) || 0,
      y: Number(externalCamera.y) || 0,
      scale: Math.max(MIN_SCALE, (Number(externalCamera.scale) || MIN_SCALE) * MONITOR_CAMERA_SCALE_FACTOR),
    }, layout));
  }, [externalCamera, isMonitorView, layout]);

  useEffect(() => {
    if (!focusSelectedTarget || disablePan || !selectedFocusTarget || !layout.mapWidth || !layout.mapHeight) {
      return;
    }

    focusTarget(selectedFocusTarget);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSelectedTarget, disablePan, selectedFocusSignature, layout.mapWidth, layout.mapHeight]);

  function focusTarget(target) {
    if (!layout.mapWidth || !layout.mapHeight) {
      return;
    }

    const FOCUS_PADDING = 28; // px margin around the combined hotspot+card box
    const cardStyle = getTargetCardStyle(target);
    const hotspotLeft = (target.x / 100) * layout.mapWidth;
    const hotspotTop = (target.y / 100) * layout.mapHeight;
    const hotspotRight = ((target.x + target.w) / 100) * layout.mapWidth;
    const hotspotBottom = ((target.y + target.h) / 100) * layout.mapHeight;
    const cardAnchorLeft = (parseFloat(cardStyle.left) / 100) * layout.mapWidth;
    const cardAnchorTop = (parseFloat(cardStyle.top) / 100) * layout.mapHeight;
    const isManualCardPosition = Number.isFinite(target.cardX) && Number.isFinite(target.cardY);
    const cardLeft = isManualCardPosition ? cardAnchorLeft - TARGET_CARD_WIDTH / 2 : cardAnchorLeft;
    const cardTop = isManualCardPosition ? cardAnchorTop - TARGET_CARD_HEIGHT / 2 : cardAnchorTop;
    const cardRight = cardLeft + TARGET_CARD_WIDTH;
    const cardBottom = cardTop + TARGET_CARD_HEIGHT;
    const focusLeft = Math.min(hotspotLeft, cardLeft);
    const focusTop = Math.min(hotspotTop, cardTop);
    const focusRight = Math.max(hotspotRight, cardRight);
    const focusBottom = Math.max(hotspotBottom, cardBottom);
    const focusCenterX = (focusLeft + focusRight) / 2;
    const focusCenterY = (focusTop + focusBottom) / 2;

    // Scale to fit the whole box in the viewport; cap at TARGET_FOCUS_SCALE, allow below MIN_SCALE
    const boxW = focusRight - focusLeft + FOCUS_PADDING * 2;
    const boxH = focusBottom - focusTop + FOCUS_PADDING * 2;
    const fitScale = Math.min(layout.width / boxW, layout.height / boxH);
    const nextScale = clamp(fitScale, 0.3, TARGET_FOCUS_SCALE);

    // Position without clamping to map bounds — the card must always be fully visible
    window.clearTimeout(focusTransitionTimeoutRef.current);
    setIsFocusTransitioning(true);
    setCamera({
      scale: nextScale,
      x: layout.width / 2 - focusCenterX * nextScale,
      y: layout.height / 2 - focusCenterY * nextScale,
    });
    focusTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsFocusTransitioning(false);
    }, FOCUS_TRANSITION_MS);
  }

  function handleHotspotClick(event, target) {
    if (isMonitorView) {
      return;
    }

    event.stopPropagation();
    onSelectTarget?.(target.id);
    focusTarget(target);
  }

  function handleObjectCardPointerMove(event) {
    if (isMonitorView) {
      return;
    }

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 10;

    card.style.setProperty("--object-card-tilt-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--object-card-tilt-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--object-shadow-x", `${(-rotateY * 0.7).toFixed(2)}px`);
    card.style.setProperty("--object-shadow-y", `${(rotateX * 0.9 + 18).toFixed(2)}px`);
    card.style.setProperty("--object-glare-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--object-glare-y", `${(y * 100).toFixed(1)}%`);
  }

  function handleObjectCardPointerLeave(event) {
    if (isMonitorView) {
      return;
    }

    const card = event.currentTarget;
    card.style.setProperty("--object-card-tilt-x", "0deg");
    card.style.setProperty("--object-card-tilt-y", "0deg");
    card.style.setProperty("--object-shadow-x", "0px");
    card.style.setProperty("--object-shadow-y", "18px");
    card.style.setProperty("--object-glare-x", "50%");
    card.style.setProperty("--object-glare-y", "0%");
  }

  function setMouseDetectionLevel(level) {
    if (detectionLevelRef.current === level) {
      return;
    }

    detectionLevelRef.current = level;
    emitCursorDetectionLevel(level);
  }

  function updateMouseDetection(event) {
    if (!shouldDetectMouse || !layout.mapWidth || !layout.mapHeight || !camera.scale) {
      setMouseDetectionLevel(0);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldPoint = {
      x: (pointerX - camera.x) / camera.scale,
      y: (pointerY - camera.y) / camera.scale,
    };

    if (worldPoint.x < 0 || worldPoint.y < 0 || worldPoint.x > layout.mapWidth || worldPoint.y > layout.mapHeight) {
      setMouseDetectionLevel(0);
      return;
    }

    const closestDistance = visibleTargets.reduce((minDistance, target) => {
      return Math.min(minDistance, getTargetDistanceToPoint(target, worldPoint, layout));
    }, Infinity);
    setMouseDetectionLevel(getDetectionLevel(closestDistance * camera.scale));
  }

  function handleViewportPointerDown(event) {
    if (isMonitorView || disablePan) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(".scene-map-hotspot, .scene-object-card")) {
      return;
    }

    event.preventDefault();
    if (!pendingAction) {
      onCloseTarget?.();
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera,
    };
    setIsPanning(true);
  }

  function handleViewportPointerMove(event) {
    updateMouseDetection(event);

    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    const nextCamera = {
      ...pan.camera,
      x: pan.camera.x + event.clientX - pan.x,
      y: pan.camera.y + event.clientY - pan.y,
    };

    setCamera(clampCamera(nextCamera, layout));
  }

  function finishPan(event) {
    if (panRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panRef.current = null;
    setIsPanning(false);
  }

  function handleViewportPointerLeave() {
    setMouseDetectionLevel(0);
  }

  function handleWheel(event) {
    if (isMonitorView || consoleOpenTargetId) {
      return;
    }

    event.preventDefault();

    if (!layout.mapWidth || !layout.mapHeight) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const zoomFactor = Math.exp(-event.deltaY * 0.001);
    const nextScale = clamp(camera.scale * zoomFactor, effectiveMinScale, MAX_SCALE);
    const worldX = (pointerX - camera.x) / camera.scale;
    const worldY = (pointerY - camera.y) / camera.scale;

    setCamera(clampCamera({
      scale: nextScale,
      x: pointerX - worldX * nextScale,
      y: pointerY - worldY * nextScale,
    }, layout));
  }

  return (
    <div
      ref={viewportRef}
      className={`scene-map-viewport ${isPanning ? "is-panning" : ""} ${isFocusTransitioning ? "is-focus-transitioning" : ""}`}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
      onPointerLeave={handleViewportPointerLeave}
      onWheel={handleWheel}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="scene-focus-fade" aria-hidden="true" />
      <div
        className={`scene-map-world ${isFocusTransitioning ? "is-focus-transitioning" : ""} ${isMonitorView ? "is-monitor-view" : ""} ${shouldDetectMouse ? "hide-player-hotspots" : ""}`}
        style={{
          width: `${layout.mapWidth}px`,
          height: `${layout.mapHeight}px`,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      >
        <BackgroundLayer backgroundSrc={backgroundSrc} />
        <StructureLayer gameState={gameState} />
        {/* Dim layer: covers background/structure but sits below cards (same z-index as interactive, earlier in DOM) */}
        <div
          className={`scene-target-dim ${selectedTargetId && !isMonitorView ? "active" : ""}`}
          aria-hidden="true"
        />
        <InteractiveLayer
          gameState={gameState}
          selectedTargetId={selectedTargetId}
          isMonitorView={isMonitorView}
          hideHotspotChrome={shouldDetectMouse}
          onHotspotClick={handleHotspotClick}
          visibleTargets={visibleTargets}
        >
          {visibleTargets.map((target) => {
            const isOpen = selectedTargetId === target.id;
            const targetImage = getTargetImage(target, gameState, scenarioId, variant);

            return (
              <article
                key={`${target.id}-card`}
                className={`scene-object-card ${isOpen ? "open" : ""}`}
                style={getTargetCardStyle(target)}
                aria-hidden={!isOpen}
                onClick={(event) => event.stopPropagation()}
                onPointerMove={handleObjectCardPointerMove}
                onPointerLeave={handleObjectCardPointerLeave}
              >
                <h3>{target.label}</h3>
                {target.hotspotClass && <span className="scene-object-card-class">{target.hotspotClass}</span>}
                {targetImage && <img className="scene-object-card-image" src={targetImage} alt={target.label} draggable="false" />}
                {(() => {
                  const stateLabel = getTargetStateLabel(target, gameState);
                  const isDisabled = /disabled/i.test(stateLabel);
                  return <NBadge status={isDisabled ? "danger" : "info"}>Estado: {stateLabel}</NBadge>;
                })()}
                <p>{targetFeedback[target.id]}</p>
                {target.hotspotClass === "dispositivo" && !isMonitorView && (
                  <button
                    type="button"
                    className={`device-connect-btn ${consoleOpenTargetId === target.id ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConsoleOpenTargetId(consoleOpenTargetId === target.id ? null : target.id);
                    }}
                  >
                    {consoleOpenTargetId === target.id ? "✕ Desconectar" : "▣ Conectarse a Dispositivo"}
                  </button>
                )}
                <ObjectInventoryGrid
                  items={getTargetItems(target.id, scenarioId, variant)}
                  seenState={itemSeenState}
                  onItemClick={isMonitorView ? undefined : onItemClick}
                  onItemDragStart={isMonitorView ? undefined : onItemDragStart}
                  revealedSlots={revealedSlots[target.id] || []}
                  containerOpen={getContainerOpenState(target.id, gameState, scenarioId, variant)}
                />
                <section
                  className={`react-drop-slot ${pendingAction?.target === target.id ? "loading" : ""} ${
                    dropZoneState.targetId === target.id && !pendingAction ? "staged" : ""
                  }`}
                  onDragOver={(event) => {
                    if (!isMonitorView) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (!isMonitorView) {
                      onDropZoneDrop?.(event, target.id);
                    }
                  }}
                >
                  {pendingAction?.target === target.id && isMonitorView ? (
                    <>
                      <strong>{formatCardLabel(pendingAction)} cargando</strong>
                      <span>Vista espejo del jugador.</span>
                    </>
                  ) : pendingAction?.target === target.id ? (
                    <SoftwareLoadMinigame
                      action={pendingAction}
                      onChange={onMinigameChange}
                      onSuccess={onMinigameSuccess}
                      onRetry={onMinigameRetry}
                      onCancel={onCancelPendingAction}
                    />
                  ) : queuedForPlayer?.target === target.id ? (
                    <strong>{formatCardLabel(queuedForPlayer)} espera pulso</strong>
                  ) : dropZoneState.targetId === target.id && (dropZoneState.cardId || dropZoneState.itemId) ? (
                    <div className="drop-zone-staged">
                      {dropZoneState.cardId && <span className="drop-zone-staged-card">{formatCardLabel({ card: dropZoneState.cardId })}</span>}
                      {dropZoneState.itemId && <span className="drop-zone-staged-item">✋ {dropZoneState.itemId}</span>}
                      <button
                        type="button"
                        className="drop-zone-confirm-btn"
                        onClick={() => onLoadConfirm?.(target.id)}
                      >
                        Cargar software
                      </button>
                      <button
                        type="button"
                        className="drop-zone-cancel-btn"
                        onClick={() => onLoadConfirm?.(target.id, true)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <span>{overlayActive ? "Mira el resultado. Acciones bloqueadas." : "Suelta una carta o item aqui"}</span>
                  )}
                </section>
              </article>
            );
          })}
        </InteractiveLayer>

        {/* Drawing preview SVG — rendered inside scene-map-world so it transforms with zoom/pan */}
        {drawingState && (
          <DrawingPreviewSVG drawingState={drawingState} />
        )}
      </div>
      {showCoordinates && (
        <CoordinateOverlay
          camera={camera}
          layout={layout}
          onCoordClick={onCoordClick}
          onCursorMove={onCursorMove}
          drawingState={drawingState}
        />
      )}
      {consoleOpenTargetId && (() => {
        const consoleTarget = visibleTargets.find((t) => t.id === consoleOpenTargetId);
        return consoleTarget?.deviceConfig ? (
          <div
            className="device-console-panel"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <DeviceConsole
              deviceName={consoleTarget.deviceConfig.deviceName}
              deviceCommands={consoleTarget.deviceConfig.commands}
              bootLines={consoleTarget.deviceConfig.bootLines}
              onCommand={(cmd) => onDeviceCommand?.(consoleOpenTargetId, cmd)}
              onClose={() => setConsoleOpenTargetId(null)}
              commandResult={deviceCommandResult}
            />
          </div>
        ) : null;
      })()}
    </div>
  );
}
