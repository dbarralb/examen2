const TOTAL_SLOTS = 6;

export function ObjectInventoryGrid({ items = [], seenState = {}, onItemClick, onItemDragStart, revealedSlots = [], containerOpen = null }) {
  if (containerOpen === null && items.length === 0) {
    return null;
  }

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => items[i] || null);

  // Closed container: show mystery "?" for occupied slots, empty for the rest
  if (containerOpen === false) {
    return (
      <div className="obj-inv-grid">
        {slots.map((item, i) => {
          if (item) {
            return (
              <div key={`mystery-${i}`} className="obj-inv-slot mystery" aria-label="Contenido desconocido">
                <span className="obj-inv-mystery" aria-hidden="true">?</span>
              </div>
            );
          }
          return <div key={`empty-${i}`} className="obj-inv-slot empty" aria-hidden="true" />;
        })}
      </div>
    );
  }

  return (
    <div className="obj-inv-grid">
      {slots.map((item, i) => {
        const isRevealed = revealedSlots.includes(i);

        if (!isRevealed) {
          return (
            <div
              key={`searching-${i}`}
              className="obj-inv-slot searching"
              aria-label="Buscando..."
              style={{ '--lupa-delay': `${i * 0.8}s` }}
            >
              <svg className="slot-progress" viewBox="0 0 36 36" width="26" height="26" aria-hidden="true">
                <circle className="slot-progress-track" cx="18" cy="18" r="15" />
                <circle className="slot-progress-bar" cx="18" cy="18" r="15" />
              </svg>
            </div>
          );
        }

        if (!item) {
          return (
            <div key={`empty-${i}`} className="obj-inv-slot empty reveal-in" aria-hidden="true">
              <span className="obj-inv-label">Vacío</span>
            </div>
          );
        }

        const isPickedUp = item.type === "usable" && seenState[item.id]?.pickedUp;
        const isUnseen = !seenState[item.id]?.seen;

        if (isPickedUp) {
          return (
            <div key={item.id} className="obj-inv-slot depleted reveal-in" title={item.label}>
              <span className="obj-inv-icon">·</span>
              <span className="obj-inv-label">Vacío</span>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            className={`obj-inv-slot reveal-in ${isUnseen ? "unseen" : ""}`}
            onClick={() => onItemClick?.(item)}
            draggable={item.type === "usable"}
            onDragStart={(event) => {
              if (item.type !== "usable") return;
              event.stopPropagation();
              event.dataTransfer.setData("application/x-inv-item-id", item.id);
              event.dataTransfer.effectAllowed = "move";
              onItemDragStart?.(item);
            }}
          >
            <span className="obj-inv-icon">{item.type === "usable" ? "✋" : "📄"}</span>
            <span className="obj-inv-label">{item.label}</span>
            {isUnseen && <span className="obj-inv-unseen-dot" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
