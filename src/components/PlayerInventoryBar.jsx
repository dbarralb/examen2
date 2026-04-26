import { useState } from "react";
import { getItem } from "../data/gameData.js";

const SLOT_COUNT = 3;

export function PlayerInventoryBar({ slots = [], seenState = {}, onItemClick, onSlotDragStart, onSlotDrop, onDebugClear }) {
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const normalizedSlots = Array.from({ length: SLOT_COUNT }, (_, i) => slots[i] || null);

  function handleDragOver(event, slotIndex) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverSlot(slotIndex);
  }

  function handleDragLeave() {
    setDragOverSlot(null);
  }

  function handleDrop(event, slotIndex) {
    event.preventDefault();
    setDragOverSlot(null);
    const itemId = event.dataTransfer.getData("application/x-inv-item-id");
    if (itemId) {
      onSlotDrop?.(itemId, slotIndex);
    }
  }

  return (
    <div className="player-inv-bar" aria-label="Inventario del jugador">
      {/* TODO [DEUDA TÉCNICA]: Botón debug solo para testeo. Eliminar antes de producción. */}
      {onDebugClear && (
        <button type="button" className="player-inv-debug-clear" onClick={onDebugClear} title="[DEBUG] Vaciar inventario">✕</button>
      )}
      {normalizedSlots.map((slot, i) => {
        const item = slot ? getItem(slot.itemId) : null;
        const isDragOver = dragOverSlot === i;
        const isEmpty = !item;

        return (
          <div
            key={i}
            className={`player-inv-slot ${isEmpty ? "empty" : ""} ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(event) => handleDragOver(event, i)}
            onDragLeave={handleDragLeave}
            onDrop={(event) => handleDrop(event, i)}
          >
            {item ? (
              <button
                type="button"
                className={`player-inv-item ${!seenState[item.id]?.seen ? "unseen" : ""}`}
                draggable={item.type === "usable"}
                onDragStart={(event) => {
                  if (item.type !== "usable") return;
                  event.dataTransfer.setData("application/x-inv-item-id", item.id);
                  event.dataTransfer.effectAllowed = "move";
                  onSlotDragStart?.(item, i);
                }}
                onClick={() => onItemClick?.(item)}
                title={item.label}
              >
                <span className="player-inv-icon">{item.type === "usable" ? "✋" : "📄"}</span>
                <span className="player-inv-label">{item.label}</span>
              </button>
            ) : (
              <span className="player-inv-hint" aria-hidden="true">inv</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
