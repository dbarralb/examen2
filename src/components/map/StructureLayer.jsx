import { rooms, structures } from "../../data/mapData.js";
import { memo } from "react";

function StructureLayerComponent({ gameState }) {
  return (
    <div className="map-layer map-layer-structure">
      <svg
        className="map-structure-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {rooms.map((room) => (
          <path
            key={room.id}
            className="map-room"
            d={room.boundaryPath}
            data-room-id={room.id}
          />
        ))}

        {structures.map((struct) => {
          const visible = struct.visibleWhen ? struct.visibleWhen(gameState) : true;

          if (!visible) {
            return null;
          }

          const stateValue = gameState[struct.stateKey] || Object.keys(struct.appearances)[0];
          const appearance = struct.appearances[stateValue] || {};

          return (
            <path
              key={struct.id}
              className={`map-structure map-structure-${struct.type}`}
              d={struct.svgPath}
              stroke={appearance.stroke || "none"}
              fill={appearance.fill || "none"}
              strokeDasharray={appearance.dashArray || undefined}
              opacity={appearance.opacity ?? 1}
              data-structure-id={struct.id}
            />
          );
        })}
      </svg>
    </div>
  );
}

export const StructureLayer = memo(StructureLayerComponent);
