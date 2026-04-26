const TOTAL_SLOTS = 6;

export function ObjectInventoryGrid({ items = [], seenState = {}, onItemClick, onItemDragStart }) {
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => items[i] || null);

  return (
    <div className="obj-inv-grid">
      {slots.map((item, i) => {
        if (!item) {
          return <div key={`empty-${i}`} className="obj-inv-slot empty" aria-hidden="true" />;
        }

        const isPickedUp = item.type === "usable" && seenState[item.id]?.pickedUp;
        const isUnseen = !seenState[item.id]?.seen;

        if (isPickedUp) {
          return (
            <div key={item.id} className="obj-inv-slot depleted" title={item.label}>
              <span className="obj-inv-icon">·</span>
              <span className="obj-inv-label">Vacío</span>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            className={`obj-inv-slot ${isUnseen ? "unseen" : ""}`}
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
