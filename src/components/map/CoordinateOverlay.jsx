import { useState } from "react";

export function CoordinateOverlay({ camera, layout, onCoordClick, onCursorMove, drawingState }) {
  const [coords, setCoords] = useState(null);

  function toMapCoords(clientX, clientY, rect) {
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const mapX = (pointerX - camera.x) / camera.scale;
    const mapY = (pointerY - camera.y) / camera.scale;
    const pctX = (mapX / layout.mapWidth) * 100;
    const pctY = (mapY / layout.mapHeight) * 100;
    return { pctX, pctY };
  }

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const { pctX, pctY } = toMapCoords(event.clientX, event.clientY, rect);
    setCoords({ pctX: pctX.toFixed(1), pctY: pctY.toFixed(1), rawX: pctX, rawY: pctY });
    onCursorMove?.({ x: +pctX.toFixed(2), y: +pctY.toFixed(2) });
  }

  function handlePointerLeave() {
    setCoords(null);
    onCursorMove?.(null);
  }

  function handleClick(event) {
    if (!onCoordClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { pctX, pctY } = toMapCoords(event.clientX, event.clientY, rect);
    onCoordClick({ x: +pctX.toFixed(2), y: +pctY.toFixed(2) });
  }

  const isDrawing = !!onCoordClick;
  const cursorCoords = coords;

  // Determine what to show in the SVG preview (rendered inside scene-map-world via drawingState)
  // The SVG preview is rendered by SceneMap using drawingState; here we just display the badge.

  return (
    <>
      <div
        className={`map-coordinate-capture${isDrawing ? " is-drawing" : ""}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={isDrawing ? handleClick : undefined}
      />
      {coords && (
        <div className="map-coordinate-badge" aria-live="off">
          <span>%: {coords.pctX}, {coords.pctY}</span>
          {isDrawing && <span className="map-coordinate-badge__hint">{
            drawingState?.captureHint || "Clic para colocar punto"
          }</span>}
        </div>
      )}
    </>
  );
}
