import { createPortal } from "react-dom";

export function ItemModal({ item, onClose }) {
  if (!item) return null;

  return createPortal(
    <div
      className="item-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      onClick={onClose}
    >
      <div className="item-modal" onClick={(event) => event.stopPropagation()}>
        <header className="item-modal-header">
          <h2>{item.label}</h2>
          <button type="button" className="item-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <p className="item-modal-content">{item.content || "Sin contenido."}</p>
      </div>
    </div>,
    document.body
  );
}
