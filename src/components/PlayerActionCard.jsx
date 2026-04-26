import { useEffect, useRef, useState } from "react";
import { buildActionInfoModel } from "../presentation/actionQueuePresentation.js";

const INFO_DELAY_MS = 500;
const MAX_USES = 3;

export function PlayerActionCard({
  card,
  isSelected,
  isCharging,
  isExhausted = false,
  usageCount = 0,
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

  const isWarning = usageCount === MAX_USES - 1; // last use before exhaustion

  return (
    <button
      className={`react-action-card ${isSelected ? "selected" : ""} ${isCharging ? "is-charging" : ""} ${isExhausted ? "is-exhausted" : ""} ${isWarning ? "is-warning" : ""}`}
      type="button"
      draggable={!isCharging && !isExhausted}
      disabled={isCharging || isExhausted}
      onClick={() => {
        if (!isCharging && !isExhausted) {
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
      <div className="action-card-usage" aria-label={`${usageCount} de ${MAX_USES} usos`}>
        {Array.from({ length: MAX_USES }, (_, i) => (
          <span key={i} className={`usage-pip ${i < usageCount ? "used" : ""}`} aria-hidden="true" />
        ))}
      </div>
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
