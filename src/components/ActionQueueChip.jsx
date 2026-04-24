export function ActionQueueChip({ chip, compact = false }) {
  return (
    <article
      className={`action-queue-chip action-queue-chip-${chip.statusAccentClassName} ${compact ? "compact" : ""}`}
      aria-label={chip.label}
    >
      <div className="action-queue-chip-body">
        <div className="action-queue-chip-visual" aria-hidden="true">
          <img className="action-queue-chip-image" src={chip.chipImage} alt="" />
          <span className={`action-queue-chip-sticker action-queue-chip-sticker-${chip.targetAccentClassName}`}>{chip.targetIcon}</span>
        </div>
        <div className="action-queue-chip-copy">
          <strong>{chip.cardLabel}</strong>
          <span>{chip.actionLabel} / {chip.targetLabel}</span>
        </div>
      </div>
      <div className="action-queue-chip-meta">
        <small>{chip.playerLabel}</small>
        <span className={`action-queue-chip-status action-queue-chip-status-${chip.statusAccentClassName}`}>
          {chip.statusIcon} {chip.statusLabel}
        </span>
      </div>
    </article>
  );
}
