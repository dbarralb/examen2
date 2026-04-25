import { targets } from "../../data/gameData.js";
import { markDefinitions } from "../../data/mapData.js";

export function InteractiveLayer({ gameState, selectedTargetId, isMonitorView, onHotspotClick, children }) {
  const visibleMarks = markDefinitions.filter((mark) => mark.visibleWhen(gameState));

  return (
    <div className="map-layer map-layer-interactive">
      {targets.map((target) => (
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
