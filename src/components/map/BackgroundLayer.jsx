import mapBackgroundFallback from "../../../assets/Pantalla de juego/Background_Green.png";
import { backgroundTiles } from "../../data/mapData.js";

export function BackgroundLayer() {
  const hasTiles = backgroundTiles.tiles.some((t) => t.src !== null);

  if (!hasTiles) {
    return (
      <div className="map-layer map-layer-background">
        <img className="scene-map-background" src={mapBackgroundFallback} alt="Mapa del instituto" draggable="false" />
      </div>
    );
  }

  return (
    <div className="map-layer map-layer-background">
      {backgroundTiles.tiles.map((tile) => (
        <img
          key={tile.id}
          className="map-tile"
          src={tile.src}
          alt=""
          draggable="false"
          style={{
            position: "absolute",
            left: `${(tile.col / backgroundTiles.columns) * 100}%`,
            top: `${(tile.row / backgroundTiles.rows) * 100}%`,
            width: `${(1 / backgroundTiles.columns) * 100}%`,
            height: `${(1 / backgroundTiles.rows) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
