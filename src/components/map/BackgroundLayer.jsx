import mapBackgroundFallback from "../../../assets/Pantalla de juego/Background_Green.png";
import { backgroundTiles } from "../../data/mapData.js";
import { memo } from "react";

function BackgroundLayerComponent({ backgroundSrc = null }) {
  const src = typeof backgroundSrc === "string" ? backgroundSrc : backgroundSrc?.src;
  const srcSet = typeof backgroundSrc === "object" ? backgroundSrc?.srcSet : null;
  const sizes = typeof backgroundSrc === "object" ? backgroundSrc?.sizes : null;
  const sources = typeof backgroundSrc === "object" && Array.isArray(backgroundSrc?.sources)
    ? backgroundSrc.sources
    : [];

  if (src) {
    return (
      <div className="map-layer map-layer-background">
        <picture>
          {sources.map((source) => (
            <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes || undefined} />
          ))}
          <img
            className="scene-map-background"
            src={src}
            srcSet={srcSet || undefined}
            sizes={sizes || undefined}
            alt="Tablero del jugador"
            draggable="false"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      </div>
    );
  }

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

export const BackgroundLayer = memo(BackgroundLayerComponent);
