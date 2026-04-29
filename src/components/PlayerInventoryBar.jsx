import { useState } from "react";
import { getItem } from "../data/gameData.js";

const SLOT_COUNT = 3;
const SLOT_BG = "/assets/Pantalla de juego/Inventory/Player_slots.png";
const SLOT_BG_ACTIVE = "/assets/Pantalla de juego/Inventory/Player_slots_Active.png";
const ITEM_PLACEHOLDER = "/assets/Pantalla de juego/Inventory/Inventory_Slot_Object_usable_placeholder.png";

export function PlayerInventoryBar({ slots = [], onItemClick, onSlotDragStart, onSlotDrop, isDraggingItem = false, getItemById = getItem }) {
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
      {normalizedSlots.map((slot, i) => {
        const item = slot ? getItemById(slot.itemId) : null;
        const isDragOver = dragOverSlot === i;
        const bgSrc = isDraggingItem && !item ? SLOT_BG_ACTIVE : SLOT_BG;

        return (
          <div
            key={i}
            className={`player-inv-slot ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(event) => handleDragOver(event, i)}
            onDragLeave={handleDragLeave}
            onDrop={(event) => handleDrop(event, i)}
          >
            <img src={bgSrc} className="slot-bg" alt="" draggable="false" />
            {item && (
              <button
                type="button"
                className="slot-item-btn"
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
                <img src={ITEM_PLACEHOLDER} className="slot-item-img" alt={item.label} draggable="false" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
