import { buildQueuedActionChipModels } from "../presentation/actionQueuePresentation.js";

export function ActionQueueOverlay({ actions }) {
  const chips = buildQueuedActionChipModels(actions || []);

  if (chips.length === 0) {
    return null;
  }

  return (
    <aside className="scene-queue-overlay" aria-label="Cola de acciones">
      {chips.map((chip) => (
        <article key={chip.id} className="scene-queue-memory" tabIndex={0} aria-label={chip.label}>
          <img className="scene-queue-memory-image" src={chip.chipImage} alt="" draggable="false" />
          <div className="scene-queue-info" role="tooltip">
            <strong>{chip.cardLabel}</strong>
            <span>{chip.actionLabel} / {chip.targetLabel}</span>
          </div>
        </article>
      ))}
    </aside>
  );
}
