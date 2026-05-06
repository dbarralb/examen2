import { Fragment, useEffect, useRef, useState } from "react";
import { NBadge } from "./e2";
import { SoftwareLoadMinigame } from "./SoftwareLoadMinigame.jsx";
import { DeviceConsole } from "./DeviceConsole.jsx";
import { PulseAnomalyVFX } from "./PulseAnomalyVFX.jsx";
import { BackgroundLayer } from "./map/BackgroundLayer.jsx";
import { StructureLayer } from "./map/StructureLayer.jsx";
import { InteractiveLayer } from "./map/InteractiveLayer.jsx";
import { CoordinateOverlay } from "./map/CoordinateOverlay.jsx";
import { getContainerOpenState, getInspectionDiscovery, getTarget, getTargetImage, getTargetStateLabel, getTargetItems, targets } from "../data/gameData.js";
import { getScenarioScopedTargetKey } from "../data/scenarioContent.js";
import { ObjectInventoryGrid } from "./ObjectInventoryGrid.jsx";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import resonanceRing1 from "../../assets/Pantalla de juego/Resonance/1.svg?url";
import resonanceRing2 from "../../assets/Pantalla de juego/Resonance/2.svg?url";
import resonanceRing3 from "../../assets/Pantalla de juego/Resonance/3.svg?url";
import resonanceRing4 from "../../assets/Pantalla de juego/Resonance/4.svg?url";
import resonanceRing5 from "../../assets/Pantalla de juego/Resonance/5.svg?url";
import resonanceRing6 from "../../assets/Pantalla de juego/Resonance/6.svg?url";
import resonanceRing7 from "../../assets/Pantalla de juego/Resonance/7.svg?url";
import resonanceRing8 from "../../assets/Pantalla de juego/Resonance/8.svg?url";
import resonanceSquareA from "../../assets/Pantalla de juego/Resonance/Square A.svg?url";
import resonanceSquareB from "../../assets/Pantalla de juego/Resonance/Square B.svg?url";
import resonanceSquareC from "../../assets/Pantalla de juego/Resonance/Square C.svg?url";

const DEFAULT_MAP_ASPECT = 1826 / 1080;
const MIN_SCALE = 0.8;
const MIN_SCALE_WIDE = 1.0; // panoramic images must fill viewport height
const MOUSE_DETECTION_RADII = [
  { level: 4, distance: 24 },
  { level: 3, distance: 48 },
  { level: 2, distance: 80 },
  { level: 1, distance: 120 },
];
const INTERACTIVE_TARGET_SELECTOR = ".scene-map-hotspot, .scene-map-hotspot-poly, .scene-object-card";
const PAN_INERTIA_MAX_DISTANCE = 110;
const PAN_INERTIA_MIN_DISTANCE = 4;
const PAN_INERTIA_DURATION_MS = 340;
const PAN_INERTIA_LOOKAHEAD_MS = 210;
const CRITICAL_CUBE_COUNTS = {
  low: 8,
  rising: 16,
  peak: 28,
};
const RESONANCE_RINGS = [
  resonanceRing1,
  resonanceRing2,
  resonanceRing3,
  resonanceRing4,
  resonanceRing5,
  resonanceRing6,
  resonanceRing7,
  resonanceRing8,
];
const RESONANCE_SQUARES = [resonanceSquareA, resonanceSquareB, resonanceSquareC];
const PAN_EDGE_FAST_ZONE_WIDTH = 150;
const PAN_EDGE_SLOW_ZONE_WIDTH = 150;
const PAN_EDGE_FAST_SPEED = 420;
const PAN_EDGE_SLOW_SPEED = 150;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
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

function getDiscoveryCardStyle(target) {
  if (Number.isFinite(target.discoveryCardX) && Number.isFinite(target.discoveryCardY)) {
    return {
      left: `${target.discoveryCardX}%`,
      top: `${target.discoveryCardY}%`,
      "--discovery-card-offset-x": "-50%",
      "--discovery-card-offset-y": "-50%",
    };
  }

  const cardStyle = getTargetCardStyle(target);
  const side = getTargetCardSide(target);

  return {
    ...cardStyle,
    "--discovery-card-offset-x": side === "left" ? "calc(-100% - 18px)" : "calc(304px + 18px)",
    "--discovery-card-offset-y": cardStyle["--object-card-offset-y"] || "0px",
  };
}

function getPulseAnomalyStyle(target) {
  const x = Number.isFinite(target.anomalyX) ? target.anomalyX : target.x - 2;
  const y = Number.isFinite(target.anomalyY) ? target.anomalyY : target.y - 4;
  const w = Number.isFinite(target.anomalyW) ? target.anomalyW : target.w + 4;
  const h = Number.isFinite(target.anomalyH) ? target.anomalyH : target.h + 8;

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${w}%`,
    height: `${h}%`,
  };
}

// SVG preview rendered inside scene-map-world (transforms with the camera pan)
function DrawingPreviewSVG({ drawingState }) {
  const { mode, p1, p2, polygonPoints, cursorPos } = drawingState;

  return (
    <svg
      className="map-drawing-preview"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20 }}
    >
      {(mode === "rect" || mode === "anomaly") && (
        <>
          {/* Ghost rect between p1 and cursor (or p2 if captured) */}
          {p1 && (p2 || cursorPos) && (() => {
            const end = p2 || cursorPos;
            const rx = Math.min(p1.x, end.x);
            const ry = Math.min(p1.y, end.y);
            const rw = Math.abs(end.x - p1.x);
            const rh = Math.abs(end.y - p1.y);
            return (
              <rect
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                className={`draw-preview-rect${mode === "anomaly" ? " draw-preview-rect--anomaly" : ""}`}
              />
            );
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

function CameraRecordingOverlay() {
  return (
    <div className="scene-camera-effect" aria-hidden="true">
      <svg
        className="scene-camera-fisheye"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path className="scene-camera-fisheye-edge" d="M0 0H100V18C70 8 30 8 0 18Z" />
        <path className="scene-camera-fisheye-edge" d="M0 100H100V82C70 92 30 92 0 82Z" />
        <path className="scene-camera-fisheye-side" d="M0 0H8C2 29 2 71 8 100H0Z" />
        <path className="scene-camera-fisheye-side" d="M100 0H92C98 29 98 71 92 100H100Z" />
        <ellipse className="scene-camera-fisheye-ring" cx="50" cy="50" rx="56" ry="41" />
      </svg>
      <div className="scene-camera-scanlines" />
    </div>
  );
}

function PulseInterferenceOverlay({ visible = false, settling = false, variant = 1 }) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`scene-interference scene-interference--v${variant} ${settling ? "scene-interference--settling" : ""}`}
      aria-hidden="true"
    >
      <div className="scene-interference__static" />
      <div className="scene-interference__bands" />
      <div className="scene-interference__tear" />
      <div className="scene-interference__settle-lines" />
    </div>
  );
}

function CriticalAnomalyCubes({ intensity = "off" }) {
  const count = CRITICAL_CUBE_COUNTS[intensity] || 0;

  if (count <= 0) {
    return null;
  }

  return (
    <div className={`scene-critical-cubes scene-critical-cubes--${intensity}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function ResonanceSpawnVFX({
  spawn = null,
  collectState = "idle",
  onHoverStart,
  onHoverEnd,
}) {
  if (!spawn) {
    return null;
  }

  return (
    <div
      key={spawn.id}
      className={`scene-resonance-spawn scene-resonance-spawn--${collectState}`}
      style={{
        left: `${spawn.x}%`,
        top: `${spawn.y}%`,
      }}
      role="button"
      aria-label="Recoger resonancia"
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="scene-resonance-spawn__hover-ring" aria-hidden="true" />
      <div className="scene-resonance-spawn__rings">
        {RESONANCE_RINGS.map((src, index) => (
          <img key={src} src={src} alt="" className={`scene-resonance-spawn__ring scene-resonance-spawn__ring--${index + 1}`} draggable="false" />
        ))}
      </div>
      <div className="scene-resonance-spawn__square-mask">
        <div className="scene-resonance-spawn__square-float">
          {RESONANCE_SQUARES.map((src, index) => (
            <img key={src} src={src} alt="" className={`scene-resonance-spawn__square scene-resonance-spawn__square--${index + 1}`} draggable="false" />
          ))}
        </div>
      </div>
      <span className="scene-resonance-spawn__plus" aria-hidden="true">+1</span>
    </div>
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
  onCameraCommit,
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
  showInspectionDiscoveryPreview = false,
  showPulseAnomalyPreview = false,
  pulseAnomalyTargetIds = [],
  pulseAnomalyMode = "active",
  pulseCriticalIntensity = "off",
  interferenceActive = false,
  interferenceVariant = 1,
  resonanceSpawn = null,
  resonanceCollectState = "idle",
  onResonanceHoverStart,
  onResonanceHoverEnd,
}) {
  const effectiveAspect = imageAspect || DEFAULT_MAP_ASPECT;
  const effectiveMinScale = imageAspect && imageAspect > DEFAULT_MAP_ASPECT ? MIN_SCALE_WIDE : MIN_SCALE;

  // boardTargets takes priority; otherwise filter by activeZone or show all.
  const visibleTargets = boardTargets
    ? boardTargets
    : activeZone
      ? activeZone.targetIds.map((id) => getTarget(id)).filter(Boolean)
      : targets;
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const panInertiaRef = useRef(null);
  const edgePanRef = useRef(null);
  const cameraRef = useRef(null);
  const detectionLevelRef = useRef(0);
  const [layout, setLayout] = useState(() => getFitLayout(0, 0, effectiveAspect));
  const [camera, setCamera] = useState(() => ({ x: 0, y: 0, scale: effectiveMinScale }));
  const [isPanning, setIsPanning] = useState(false);
  const [edgePanDirection, setEdgePanDirection] = useState(0);
  const [edgePanSpeed, setEdgePanSpeed] = useState(0);
  const [consoleOpenTargetId, setConsoleOpenTargetId] = useState(null);
  const [expandedSoftwareDrops, setExpandedSoftwareDrops] = useState({});
  const [interferenceRenderState, setInterferenceRenderState] = useState({ visible: false, settling: false });
  const shouldDetectMouse = !isMonitorView && !showCoordinates;

  useEffect(() => {
    let timeoutId;

    if (interferenceActive) {
      setInterferenceRenderState({ visible: true, settling: false });
      return undefined;
    }

    setInterferenceRenderState((current) => {
      if (!current.visible) {
        return current;
      }
      timeoutId = window.setTimeout(() => {
        setInterferenceRenderState({ visible: false, settling: false });
      }, 900);
      return { visible: true, settling: true };
    });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [interferenceActive]);

  // Close device console when the selected target changes or closes
  useEffect(() => {
    if (!selectedTargetId || selectedTargetId !== consoleOpenTargetId) {
      setConsoleOpenTargetId(null);
    }
  }, [selectedTargetId, consoleOpenTargetId]);

  useEffect(() => {
    setExpandedSoftwareDrops({});
  }, [selectedTargetId]);

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

        return clampCamera({ ...current, scale: effectiveMinScale }, nextLayout);
      });
    }

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [layout.mapHeight, layout.mapWidth, effectiveAspect, effectiveMinScale]);

  useEffect(() => () => emitCursorDetectionLevel(0), []);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => () => {
    if (panInertiaRef.current?.frameId) {
      window.cancelAnimationFrame(panInertiaRef.current.frameId);
    }
    if (edgePanRef.current?.frameId) {
      window.cancelAnimationFrame(edgePanRef.current.frameId);
    }
  }, []);

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
      scale: effectiveMinScale,
    }, layout));
  }, [effectiveMinScale, externalCamera, isMonitorView, layout]);

  function handleHotspotClick(event, target) {
    if (isMonitorView) {
      return;
    }

    event.stopPropagation();
    onSelectTarget?.(target.id);
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

  function expandSoftwareDrop(targetId) {
    setExpandedSoftwareDrops((current) => current[targetId] ? current : { ...current, [targetId]: true });
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

  function stopPanInertia() {
    if (panInertiaRef.current?.frameId) {
      window.cancelAnimationFrame(panInertiaRef.current.frameId);
    }
    panInertiaRef.current = null;
  }

  function stopEdgePan() {
    if (edgePanRef.current?.frameId) {
      window.cancelAnimationFrame(edgePanRef.current.frameId);
    }
    edgePanRef.current = null;
    setEdgePanDirection(0);
    setEdgePanSpeed(0);
  }

  function startEdgePan(direction, speed = PAN_EDGE_FAST_SPEED) {
    if (isMonitorView || disablePan || !layout.mapWidth || !layout.mapHeight) {
      return;
    }

    if (edgePanRef.current?.direction === direction && edgePanRef.current?.speed === speed) {
      return;
    }

    stopPanInertia();
    stopEdgePan();
    setEdgePanDirection(direction);
    setEdgePanSpeed(speed);

    edgePanRef.current = {
      direction,
      speed,
      frameId: null,
      lastTime: performance.now(),
    };

    function step(now) {
      const current = edgePanRef.current;

      if (!current || current.direction !== direction) {
        return;
      }

      const elapsedSeconds = Math.min(0.05, Math.max(0, now - current.lastTime) / 1000);
      current.lastTime = now;

      const currentCamera = cameraRef.current || camera;
      const nextCamera = clampCamera({
        ...currentCamera,
        x: currentCamera.x + direction * current.speed * elapsedSeconds,
      }, layout);

      cameraRef.current = nextCamera;
      setCamera(nextCamera);

      if (edgePanRef.current) {
        edgePanRef.current.frameId = window.requestAnimationFrame(step);
      }
    }

    edgePanRef.current.frameId = window.requestAnimationFrame(step);
  }

  function updateEdgePanFromPointer(event) {
    if (isMonitorView || disablePan || panRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const totalZoneWidth = PAN_EDGE_FAST_ZONE_WIDTH + PAN_EDGE_SLOW_ZONE_WIDTH;

    if (pointerX <= PAN_EDGE_FAST_ZONE_WIDTH) {
      startEdgePan(1, PAN_EDGE_FAST_SPEED);
    } else if (pointerX <= totalZoneWidth) {
      startEdgePan(1, PAN_EDGE_SLOW_SPEED);
    } else if (pointerX >= rect.width - PAN_EDGE_FAST_ZONE_WIDTH) {
      startEdgePan(-1, PAN_EDGE_FAST_SPEED);
    } else if (pointerX >= rect.width - totalZoneWidth) {
      startEdgePan(-1, PAN_EDGE_SLOW_SPEED);
    } else {
      stopEdgePan();
    }
  }

  function startPanInertia(pan) {
    if (!pan?.lastCamera || !layout.mapWidth || !layout.mapHeight) {
      return false;
    }

    const velocity = pan.velocity || { x: 0, y: 0 };
    const projectedX = velocity.x * PAN_INERTIA_LOOKAHEAD_MS;
    const projectedY = velocity.y * PAN_INERTIA_LOOKAHEAD_MS;
    const projectedDistance = Math.sqrt(projectedX * projectedX + projectedY * projectedY);

    if (projectedDistance < PAN_INERTIA_MIN_DISTANCE) {
      return false;
    }

    const distanceScale = Math.min(1, PAN_INERTIA_MAX_DISTANCE / projectedDistance);
    const fromCamera = pan.lastCamera;
    const toCamera = clampCamera({
      ...fromCamera,
      x: fromCamera.x + projectedX * distanceScale,
      y: fromCamera.y + projectedY * distanceScale,
    }, layout);

    const dx = toCamera.x - fromCamera.x;
    const dy = toCamera.y - fromCamera.y;
    const clampedDistance = Math.sqrt(dx * dx + dy * dy);

    if (clampedDistance < PAN_INERTIA_MIN_DISTANCE) {
      return false;
    }

    stopPanInertia();
    const startedAt = performance.now();

    function step(now) {
      const progress = clamp((now - startedAt) / PAN_INERTIA_DURATION_MS, 0, 1);
      const eased = easeOutCubic(progress);
      const nextCamera = {
        ...fromCamera,
        x: fromCamera.x + dx * eased,
        y: fromCamera.y + dy * eased,
      };

      setCamera(nextCamera);

      if (progress < 1) {
        panInertiaRef.current.frameId = window.requestAnimationFrame(step);
      } else {
        panInertiaRef.current = null;
        onCameraCommit?.(nextCamera);
      }
    }

    panInertiaRef.current = {
      frameId: window.requestAnimationFrame(step),
    };
    return true;
  }

  function handleViewportPointerDown(event) {
    if (isMonitorView || disablePan) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(INTERACTIVE_TARGET_SELECTOR)) {
      return;
    }

    event.preventDefault();
    stopEdgePan();
    stopPanInertia();
    if (!pendingAction) {
      onCloseTarget?.();
    }
    const now = performance.now();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera,
      lastCamera: camera,
      lastPoint: { x: event.clientX, y: event.clientY, time: now },
      velocity: { x: 0, y: 0 },
    };
    setIsPanning(true);
  }

  function handleViewportPointerMove(event) {
    updateMouseDetection(event);
    updateEdgePanFromPointer(event);

    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    const nextCamera = {
      ...pan.camera,
      x: pan.camera.x + event.clientX - pan.x,
      y: pan.camera.y + event.clientY - pan.y,
    };
    const clampedCamera = clampCamera(nextCamera, layout);
    const now = performance.now();
    const elapsed = Math.max(1, now - pan.lastPoint.time);

    pan.velocity = {
      x: (event.clientX - pan.lastPoint.x) / elapsed,
      y: (event.clientY - pan.lastPoint.y) / elapsed,
    };
    pan.lastPoint = { x: event.clientX, y: event.clientY, time: now };
    pan.lastCamera = clampedCamera;

    setCamera(clampedCamera);
  }

  function finishPan(event) {
    const pan = panRef.current;

    if (pan?.pointerId !== event.pointerId) {
      return;
    }

    panRef.current = null;
    setIsPanning(false);
    stopEdgePan();
    const inertiaStarted = startPanInertia(pan);
    if (!inertiaStarted) {
      onCameraCommit?.(pan.lastCamera || camera);
    }
  }

  function cancelPan(event) {
    if (panRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panRef.current = null;
    setIsPanning(false);
    stopEdgePan();
    onCameraCommit?.(camera);
  }

  function handleViewportPointerLeave() {
    setMouseDetectionLevel(0);
    stopEdgePan();
  }

  return (
    <div
      ref={viewportRef}
      className={`scene-map-viewport ${isPanning ? "is-panning" : ""} ${interferenceActive ? `is-interference-active is-interference-v${interferenceVariant}` : ""} ${interferenceRenderState.settling ? "is-interference-settling" : ""}`}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={finishPan}
      onPointerCancel={cancelPan}
      onPointerLeave={handleViewportPointerLeave}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {!isMonitorView && !disablePan && (
        <>
          <div
            className={`scene-map-edge-pan-zone scene-map-edge-pan-zone--left scene-map-edge-pan-zone--fast ${edgePanDirection === 1 && edgePanSpeed === PAN_EDGE_FAST_SPEED ? "active" : ""}`}
            style={{ width: `${PAN_EDGE_FAST_ZONE_WIDTH}px` }}
            aria-hidden="true"
            onPointerEnter={() => startEdgePan(1, PAN_EDGE_FAST_SPEED)}
            onPointerDown={(event) => event.stopPropagation()}
          />
          <div
            className={`scene-map-edge-pan-zone scene-map-edge-pan-zone--left-inner scene-map-edge-pan-zone--slow ${edgePanDirection === 1 && edgePanSpeed === PAN_EDGE_SLOW_SPEED ? "active" : ""}`}
            style={{ left: `${PAN_EDGE_FAST_ZONE_WIDTH}px`, width: `${PAN_EDGE_SLOW_ZONE_WIDTH}px` }}
            aria-hidden="true"
            onPointerEnter={() => startEdgePan(1, PAN_EDGE_SLOW_SPEED)}
            onPointerDown={(event) => event.stopPropagation()}
          />
          <div
            className={`scene-map-edge-pan-zone scene-map-edge-pan-zone--right-inner scene-map-edge-pan-zone--slow ${edgePanDirection === -1 && edgePanSpeed === PAN_EDGE_SLOW_SPEED ? "active" : ""}`}
            style={{ right: `${PAN_EDGE_FAST_ZONE_WIDTH}px`, width: `${PAN_EDGE_SLOW_ZONE_WIDTH}px` }}
            aria-hidden="true"
            onPointerEnter={() => startEdgePan(-1, PAN_EDGE_SLOW_SPEED)}
            onPointerDown={(event) => event.stopPropagation()}
          />
          <div
            className={`scene-map-edge-pan-zone scene-map-edge-pan-zone--right scene-map-edge-pan-zone--fast ${edgePanDirection === -1 && edgePanSpeed === PAN_EDGE_FAST_SPEED ? "active" : ""}`}
            style={{ width: `${PAN_EDGE_FAST_ZONE_WIDTH}px` }}
            aria-hidden="true"
            onPointerEnter={() => startEdgePan(-1, PAN_EDGE_FAST_SPEED)}
            onPointerDown={(event) => event.stopPropagation()}
          />
        </>
      )}
      <div className="scene-focus-fade" aria-hidden="true" />
      <div
        className={`scene-map-world ${isMonitorView ? "is-monitor-view" : ""} ${shouldDetectMouse ? "hide-player-hotspots" : ""}`}
        style={{
          width: `${layout.mapWidth}px`,
          height: `${layout.mapHeight}px`,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      >
        <BackgroundLayer backgroundSrc={backgroundSrc} />
        <StructureLayer gameState={gameState} />
        <CameraRecordingOverlay />
        <ResonanceSpawnVFX
          spawn={resonanceSpawn}
          collectState={resonanceCollectState}
          onHoverStart={onResonanceHoverStart}
          onHoverEnd={onResonanceHoverEnd}
        />
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
            const inspectionDiscovery = getInspectionDiscovery(target.id, gameState, scenarioId, variant);
            const previewInspectionDiscovery = showInspectionDiscoveryPreview && target.id === selectedTargetId
              ? inspectionDiscovery || getInspectionDiscovery(
                target.id,
                { inspectionDiscoveries: { [getScenarioScopedTargetKey(scenarioId, variant, target.id)]: true } },
                scenarioId,
                variant,
              )
              : inspectionDiscovery;
            const hasActiveSoftwareDrop = pendingAction?.target === target.id
              || queuedForPlayer?.target === target.id
              || dropZoneState.targetId === target.id;
            const isSoftwareDropExpanded = expandedSoftwareDrops[target.id] || hasActiveSoftwareDrop;

            return (
              <Fragment key={`${target.id}-cards`}>
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
                  const stateLabel = getTargetStateLabel(target, gameState, scenarioId, variant);
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
                  className={`react-drop-slot ${isSoftwareDropExpanded ? "expanded" : ""} ${pendingAction?.target === target.id ? "loading" : ""} ${
                    dropZoneState.targetId === target.id && !pendingAction ? "staged" : ""
                  }`}
                  tabIndex={isMonitorView ? undefined : 0}
                  aria-label="Cargar software"
                  onMouseEnter={() => expandSoftwareDrop(target.id)}
                  onFocus={() => expandSoftwareDrop(target.id)}
                  onDragEnter={() => expandSoftwareDrop(target.id)}
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
                    <div className="software-drop-body">
                      <span className="software-drop-title">Cargar software</span>
                      <strong>{formatCardLabel(pendingAction)} cargando</strong>
                      <span>Vista espejo del jugador.</span>
                    </div>
                  ) : pendingAction?.target === target.id ? (
                    <SoftwareLoadMinigame
                      action={pendingAction}
                      onChange={onMinigameChange}
                      onSuccess={onMinigameSuccess}
                      onRetry={onMinigameRetry}
                      onCancel={onCancelPendingAction}
                    />
                  ) : queuedForPlayer?.target === target.id ? (
                    <div className="software-drop-body">
                      <span className="software-drop-title">Cargar software</span>
                      <strong>{formatCardLabel(queuedForPlayer)} espera pulso</strong>
                    </div>
                  ) : dropZoneState.targetId === target.id && (dropZoneState.cardId || dropZoneState.itemId) ? (
                    <div className="drop-zone-staged">
                      <span className="software-drop-title">Software preparado</span>
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
                    <div className="software-drop-body">
                      <span className="software-drop-title">Cargar software</span>
                      <span className="software-drop-hint">
                        {overlayActive ? "Resultado activo. Espera al pulso." : "Arrastra una accion a este puerto."}
                      </span>
                      <span className="software-drop-insert">Insertar aqui</span>
                      <span className="software-drop-ghost" aria-hidden="true" />
                    </div>
                  )}
                </section>
              </article>
              {previewInspectionDiscovery && (
                <aside
                  key={`${target.id}-inspection-card`}
                  className={`scene-inspection-card ${isOpen ? "open" : ""}`}
                  style={getDiscoveryCardStyle(target)}
                  aria-hidden={!isOpen}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="scene-inspection-card-image" aria-label={previewInspectionDiscovery.assetDev}>
                    <span>{previewInspectionDiscovery.assetDev}</span>
                  </div>
                  <strong>{previewInspectionDiscovery.cipherName}</strong>
                  <p>{previewInspectionDiscovery.description}</p>
                </aside>
              )}
              </Fragment>
            );
          })}
        </InteractiveLayer>

        {(showPulseAnomalyPreview || pulseAnomalyTargetIds.length > 0) && visibleTargets.map((target) => (
          target.id === selectedTargetId || pulseAnomalyTargetIds.includes(target.id) ? (
            <PulseAnomalyVFX
              key={`${target.id}-pulse-anomaly-preview`}
              className={`scene-pulse-anomaly-preview scene-pulse-anomaly-preview--${pulseAnomalyMode}`}
              style={getPulseAnomalyStyle(target)}
            />
          ) : null
        ))}

        {/* Drawing preview SVG — rendered inside scene-map-world so it follows the camera pan */}
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
      <PulseInterferenceOverlay
        visible={interferenceRenderState.visible}
        settling={interferenceRenderState.settling}
        variant={interferenceVariant}
      />
      <CriticalAnomalyCubes intensity={pulseCriticalIntensity} />
    </div>
  );
}
