import { useEffect, useRef, useState } from "react";
import { NBadge } from "./newton";
import { SoftwareLoadMinigame } from "./SoftwareLoadMinigame.jsx";
import { BackgroundLayer } from "./map/BackgroundLayer.jsx";
import { StructureLayer } from "./map/StructureLayer.jsx";
import { InteractiveLayer } from "./map/InteractiveLayer.jsx";
import { CoordinateOverlay } from "./map/CoordinateOverlay.jsx";
import { getContainerOpenState, getTarget, getTargetImage, getTargetStateLabel, getTargetItems, targets } from "../data/gameData.js";
import { ObjectInventoryGrid } from "./ObjectInventoryGrid.jsx";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";

const MAP_WIDTH = 1826;
const MAP_HEIGHT = 1080;
const MAP_ASPECT = MAP_WIDTH / MAP_HEIGHT;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const MONITOR_CAMERA_SCALE_FACTOR = 0.6;
const TARGET_FOCUS_SCALE = 1.45;
const TARGET_CARD_WIDTH = 330;
const TARGET_CARD_HEIGHT = 470;
const FOCUS_TRANSITION_MS = 420;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFitLayout(width, height) {
  if (!width || !height) {
    return { width: 0, height: 0, mapWidth: 0, mapHeight: 0 };
  }

  const mapWidth = Math.min(width, height * MAP_ASPECT);
  const mapHeight = mapWidth / MAP_ASPECT;
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

function getFitCamera(layout) {
  return clampCamera({ x: (layout.width - layout.mapWidth) / 2, y: (layout.height - layout.mapHeight) / 2, scale: MIN_SCALE }, layout);
}

function getTargetCardSide(target) {
  return target.x > 72 ? "left" : "right";
}

function getTargetCardStyle(target) {
  const side = getTargetCardSide(target);
  const left = side === "left" ? target.x - 22 : target.x + target.w + 2;
  const isLowerHalf = target.y + target.h / 2 > 50;
  const top = isLowerHalf ? clamp(target.y - 30, 4, 76) : clamp(target.y - 2, 4, 76);

  return {
    left: `${left}%`,
    top: `${top}%`,
  };
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
}) {
  // Filter targets to those in the active zone. If no zone is set, show all targets (backward compat).
  const visibleTargets = activeZone
    ? activeZone.targetIds.map((id) => getTarget(id)).filter(Boolean)
    : targets;
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const [layout, setLayout] = useState(() => getFitLayout(0, 0));
  const [camera, setCamera] = useState(() => ({ x: 0, y: 0, scale: MIN_SCALE }));
  const [isPanning, setIsPanning] = useState(false);
  const [isFocusTransitioning, setIsFocusTransitioning] = useState(false);
  const focusTransitionTimeoutRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return undefined;
    }

    function updateLayout() {
      const rect = viewport.getBoundingClientRect();
      const nextLayout = getFitLayout(rect.width, rect.height);
      setLayout(nextLayout);
      setCamera((current) => {
        if (!layout.mapWidth || !layout.mapHeight) {
          return getFitCamera(nextLayout);
        }

        return clampCamera(current, nextLayout);
      });
    }

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [layout.mapHeight, layout.mapWidth]);

  useEffect(() => () => window.clearTimeout(focusTransitionTimeoutRef.current), []);

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

  function focusTarget(target) {
    if (!layout.mapWidth || !layout.mapHeight) {
      return;
    }

    const nextScale = clamp(TARGET_FOCUS_SCALE, MIN_SCALE, MAX_SCALE);
    const cardStyle = getTargetCardStyle(target);
    const hotspotLeft = (target.x / 100) * layout.mapWidth;
    const hotspotTop = (target.y / 100) * layout.mapHeight;
    const hotspotRight = ((target.x + target.w) / 100) * layout.mapWidth;
    const hotspotBottom = ((target.y + target.h) / 100) * layout.mapHeight;
    const cardLeft = (parseFloat(cardStyle.left) / 100) * layout.mapWidth;
    const cardTop = (parseFloat(cardStyle.top) / 100) * layout.mapHeight;
    const cardRight = cardLeft + TARGET_CARD_WIDTH;
    const cardBottom = cardTop + TARGET_CARD_HEIGHT;
    const focusLeft = Math.min(hotspotLeft, cardLeft);
    const focusTop = Math.min(hotspotTop, cardTop);
    const focusRight = Math.max(hotspotRight, cardRight);
    const focusBottom = Math.max(hotspotBottom, cardBottom);
    const focusCenterX = (focusLeft + focusRight) / 2;
    const focusCenterY = (focusTop + focusBottom) / 2;

    window.clearTimeout(focusTransitionTimeoutRef.current);
    setIsFocusTransitioning(true);
    setCamera(clampCamera({
      scale: nextScale,
      x: layout.width / 2 - focusCenterX * nextScale,
      y: layout.height / 2 - focusCenterY * nextScale,
    }, layout));
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

  function handleViewportPointerDown(event) {
    if (isMonitorView) {
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

  function handleWheel(event) {
    if (isMonitorView) {
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
    const nextScale = clamp(camera.scale * zoomFactor, MIN_SCALE, MAX_SCALE);
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
      onWheel={handleWheel}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="scene-focus-fade" aria-hidden="true" />
      <div
        className={`scene-map-world ${isFocusTransitioning ? "is-focus-transitioning" : ""} ${isMonitorView ? "is-monitor-view" : ""}`}
        style={{
          width: `${layout.mapWidth}px`,
          height: `${layout.mapHeight}px`,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      >
        <BackgroundLayer />
        <StructureLayer gameState={gameState} />
        <InteractiveLayer
          gameState={gameState}
          selectedTargetId={selectedTargetId}
          isMonitorView={isMonitorView}
          onHotspotClick={handleHotspotClick}
          visibleTargets={visibleTargets}
        >
          {visibleTargets.map((target) => {
            const isOpen = selectedTargetId === target.id;
            const targetImage = getTargetImage(target, gameState);

            return (
              <article
                key={`${target.id}-card`}
                className={`scene-object-card ${isOpen ? "open" : ""}`}
                style={getTargetCardStyle(target)}
                aria-hidden={!isOpen}
                onClick={(event) => event.stopPropagation()}
              >
                <h3>{target.label}</h3>
                {target.hotspotClass && <span className="scene-object-card-class">{target.hotspotClass}</span>}
                {targetImage && <img className="scene-object-card-image" src={targetImage} alt={target.label} draggable="false" />}
                <NBadge status="info">Estado: {getTargetStateLabel(target, gameState)}</NBadge>
                <p>{targetFeedback[target.id]}</p>
                <ObjectInventoryGrid
                  items={getTargetItems(target.id)}
                  seenState={itemSeenState}
                  onItemClick={isMonitorView ? undefined : onItemClick}
                  onItemDragStart={isMonitorView ? undefined : onItemDragStart}
                  revealedSlots={revealedSlots[target.id] || []}
                  containerOpen={getContainerOpenState(target.id, gameState)}
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
      </div>
      {showCoordinates && <CoordinateOverlay camera={camera} layout={layout} />}
    </div>
  );
}
