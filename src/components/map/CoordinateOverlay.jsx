import { useState } from "react";

const MAP_WIDTH = 1826;
const MAP_HEIGHT = 1080;

export function CoordinateOverlay({ camera, layout }) {
  const [coords, setCoords] = useState(null);

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const mapX = (pointerX - camera.x) / camera.scale;
    const mapY = (pointerY - camera.y) / camera.scale;
    const pctX = (mapX / layout.mapWidth) * 100;
    const pctY = (mapY / layout.mapHeight) * 100;
    const pxX = Math.round((pctX / 100) * MAP_WIDTH);
    const pxY = Math.round((pctY / 100) * MAP_HEIGHT);

    setCoords({ pctX: pctX.toFixed(1), pctY: pctY.toFixed(1), pxX, pxY });
  }

  function handlePointerLeave() {
    setCoords(null);
  }

  return (
    <>
      <div
        className="map-coordinate-capture"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
      {coords && (
        <div className="map-coordinate-badge" aria-live="off">
          <span>%: {coords.pctX}, {coords.pctY}</span>
          <span>px: {coords.pxX}, {coords.pxY}</span>
        </div>
      )}
    </>
  );
}
