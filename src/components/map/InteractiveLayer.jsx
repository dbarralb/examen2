import { targets as allTargets } from "../../data/gameData.js";
import { markDefinitions } from "../../data/mapData.js";

export function InteractiveLayer({ gameState, selectedTargetId, isMonitorView, onHotspotClick, children, visibleTargets }) {
  const targets = visibleTargets || allTargets;
  const visibleMarks = markDefinitions.filter((mark) => mark.visibleWhen(gameState));

  const rectTargets = targets.filter((t) => !t.points?.length);
  const polyTargets = targets.filter((t) => t.points?.length >= 3);

  return (
    <div className="map-layer map-layer-interactive">
      {/* Polygon hotspots rendered as SVG with viewBox 0-100 matching % coordinate system */}
      {polyTargets.length > 0 && (
        <svg
          className="map-hotspot-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="false"
        >
          {polyTargets.map((target) => (
            <polygon
              key={target.id}
              className={`scene-map-hotspot-poly ${selectedTargetId === target.id ? "selected" : ""}`}
              points={target.points.map((p) => `${p.x},${p.y}`).join(" ")}
              onClick={(event) => {
                if (!isMonitorView) onHotspotClick(event, target);
              }}
            >
              <title>{target.label}</title>
            </polygon>
          ))}
        </svg>
      )}

      {/* Rectangle hotspots as positioned buttons */}
      {rectTargets.map((target) => (
        <button
          key={target.id}
          className={`scene-map-hotspot ${selectedTargetId === target.id ? "selected" : ""}`}
          style={{ left: `${target.x}%`, top: `${target.y}%`, width: `${target.w}%`, height: `${target.h}%` }}
          type="button"
          title={target.label}
          disabled={isMonitorView}
          onClick={(event) => onHotspotClick(event, target)}
        >
          <span>{target.label}</span>
        </button>
      ))}

      {visibleMarks.map((mark) => (
        <div
          key={mark.id}
          className={`map-mark map-mark-${mark.type} ${mark.animation ? `map-mark-${mark.animation}` : ""}`}
          style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
          title={mark.label}
          aria-label={mark.label}
        >
          <span className="map-mark-placeholder">{mark.type === "danger" ? "!" : mark.type === "clue" ? "?" : "i"}</span>
        </div>
      ))}

      {children}
    </div>
  );
}
