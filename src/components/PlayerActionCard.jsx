import { buildActionInfoModel } from "../presentation/actionQueuePresentation.js";

const MAX_USES = 3;

export function PlayerActionCard({
  card,
  isSelected,
  isCharging,
  isExhausted = false,
  usageCount = 0,
  onSelect,
  onDragStart,
  onInfoStart,
  onInfoCancel,
}) {
  const actionInfo = buildActionInfoModel(card);

  function startInfoTimer() {
    onInfoStart?.(card.id, actionInfo);
  }

  function cancelInfoTimer() {
    onInfoCancel?.(card.id);
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
      aria-describedby="action-card-info-panel"
    >
      <img src={card.image} alt={card.label} />
      <div className="action-card-usage" aria-label={`${usageCount} de ${MAX_USES} usos`}>
        {Array.from({ length: MAX_USES }, (_, i) => (
          <span key={i} className={`usage-pip ${i < usageCount ? "used" : ""}`} aria-hidden="true" />
        ))}
      </div>
      {isCharging && <span>charging</span>}
    </button>
  );
}
