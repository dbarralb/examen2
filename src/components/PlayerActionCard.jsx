import { useEffect, useRef, useState } from "react";
import { buildActionInfoModel } from "../presentation/actionQueuePresentation.js";

const INFO_DELAY_MS = 500;

export function PlayerActionCard({
  card,
  isSelected,
  isCharging,
  onSelect,
  onDragStart,
}) {
  const [infoState, setInfoState] = useState("idle");
  const infoTimerRef = useRef(null);
  const actionInfo = buildActionInfoModel(card);
  const showInfo = infoState === "loading" || infoState === "ready";

  useEffect(() => () => window.clearTimeout(infoTimerRef.current), []);

  function startInfoTimer() {
    window.clearTimeout(infoTimerRef.current);
    setInfoState("loading");
    infoTimerRef.current = window.setTimeout(() => {
      setInfoState("ready");
    }, INFO_DELAY_MS);
  }

  function cancelInfoTimer() {
    window.clearTimeout(infoTimerRef.current);
    setInfoState("idle");
  }

  return (
    <button
      className={`react-action-card ${isSelected ? "selected" : ""} ${isCharging ? "is-charging" : ""}`}
      type="button"
      draggable={!isCharging}
      disabled={isCharging}
      onClick={() => {
        if (!isCharging) {
          onSelect?.(card.id);
        }
      }}
      onDragStart={(event) => onDragStart?.(event, card, isCharging)}
      onMouseEnter={startInfoTimer}
      onMouseLeave={cancelInfoTimer}
      onFocus={startInfoTimer}
      onBlur={cancelInfoTimer}
      aria-describedby={showInfo ? `${card.id}-action-info` : undefined}
    >
      <img src={card.image} alt={card.label} />
      {isCharging && <span>charging</span>}
      {showInfo && (
        <span id={`${card.id}-action-info`} className={`action-info-popover ${infoState}`} role="tooltip">
          {infoState === "loading" ? (
            <span className="action-info-loader" aria-label="Cargando informacion" />
          ) : (
            <>
              <strong>{actionInfo.cardLabel}</strong>
              <span className="action-info-family">{actionInfo.actionLabel}</span>
              <span className="action-info-description">{actionInfo.description}</span>
            </>
          )}
        </span>
      )}
    </button>
  );
}
