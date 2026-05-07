import { useEffect, useRef, useState } from "react";
import { useGesture } from "@use-gesture/react";

const SCALE_MIN = 0.4;
const SCALE_MAX = 4.0;

const FAMILY_ICON = {
  informacion: "⊞",
  contenedor: "▣",
  dispositivo: "⚡",
  objeto: "◆",
  persona: "●",
};

const PORT_ICON = {
  PORT_INFO: "◎",
  PORT_MECH: "⚙",
};

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

export function NetworkCanvas({ targets, onPortSelect, selectedHotspotId, blocked }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1.0 });
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const transformRef = useRef(transform);

  useEffect(() => {
    transformRef.current = transform;
  });

  useGesture(
    {
      onDrag: ({ offset: [x, y] }) => {
        setTransform((t) => ({ ...t, x, y }));
      },
      onPinch: ({ offset: [s] }) => {
        setTransform((t) => ({ ...t, scale: clamp(s, SCALE_MIN, SCALE_MAX) }));
      },
    },
    {
      target: containerRef,
      drag: {
        from: () => [transformRef.current.x, transformRef.current.y],
        filterTaps: true,
      },
      pinch: {
        from: () => [transformRef.current.scale, 0],
        scaleBounds: { min: SCALE_MIN, max: SCALE_MAX },
      },
      eventOptions: { passive: false },
    },
  );

  const zoomLayer = transform.scale < 0.7 ? "macro" : transform.scale < 2.0 ? "medio" : "micro";

  function handleNodeClick(nodeId) {
    setExpandedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }

  function handlePortClick(e, hotspotId, portType) {
    e.stopPropagation();
    if (!blocked) {
      onPortSelect(hotspotId, portType);
    }
  }

  const hintText = blocked
    ? "Chip en cola. Espera el pulso."
    : zoomLayer === "macro"
      ? "Acerca para ver los nodos"
      : expandedNodeId
        ? "Toca un puerto para hackear"
        : "Toca un nodo para ver sus puertos";

  return (
    <div ref={containerRef} className="nc-container">
      <svg
        className="nc-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Red de nodos del escenario"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "center center",
          touchAction: "none",
        }}
      >
        {/* Macro layer: room cluster */}
        {zoomLayer === "macro" && (
          <>
            <rect x="4" y="4" width="92" height="92" rx="3" className="nc-cluster" />
            <text x="50" y="50" className="nc-cluster-label">Almacen</text>
          </>
        )}

        {/* Nodes — hidden at macro zoom */}
        {zoomLayer !== "macro" && targets.map((target) => {
          const cx = target.x + target.w / 2;
          const cy = target.y + target.h / 2;
          const isSelected = target.id === selectedHotspotId;
          const isExpanded = target.id === expandedNodeId;
          const showPorts = isExpanded || zoomLayer === "micro";
          const ports = target.ports || [];

          return (
            <g
              key={target.id}
              onClick={() => handleNodeClick(target.id)}
              className={["nc-node-group", isSelected ? "nc-node-group--selected" : ""].filter(Boolean).join(" ")}
              role="button"
              tabIndex={0}
              aria-label={target.label}
              aria-expanded={isExpanded}
              onKeyDown={(e) => e.key === "Enter" && handleNodeClick(target.id)}
            >
              {/* Invisible hit area */}
              <circle cx={cx} cy={cy} r="10" fill="transparent" />

              {/* Node circle */}
              <circle
                cx={cx}
                cy={cy}
                r="7"
                className={[
                  "nc-node",
                  `nc-node--${target.family}`,
                  isSelected ? "nc-node--selected" : "",
                ].filter(Boolean).join(" ")}
              />

              {/* Family icon */}
              <text x={cx} y={cy} className="nc-node-icon">
                {FAMILY_ICON[target.family] || "●"}
              </text>

              {/* Label */}
              <text x={cx} y={cy + 10} className="nc-node-label">
                {target.label}
              </text>

              {/* Ports — shown when expanded or at micro zoom */}
              {showPorts && ports.map((port, i) => {
                const portCx = ports.length === 1 ? cx : cx + (i === 0 ? -9 : 9);
                const portCy = cy + 20;
                return (
                  <g
                    key={port.id}
                    onClick={(e) => handlePortClick(e, target.id, port.type)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${port.label} — ${target.label}`}
                    onKeyDown={(e) => e.key === "Enter" && handlePortClick(e, target.id, port.type)}
                    className={`nc-port-group${blocked ? " nc-port-group--blocked" : ""}`}
                  >
                    {/* Invisible hit target */}
                    <circle cx={portCx} cy={portCy} r="7" className="nc-port-hit" />
                    {/* Visible port */}
                    <circle cx={portCx} cy={portCy} r="4.5" className={`nc-port nc-port--${port.type}`} />
                    {/* Port icon */}
                    <text x={portCx} y={portCy} className="nc-port-icon">
                      {PORT_ICON[port.type]}
                    </text>
                    {/* Port label */}
                    <text x={portCx} y={portCy + 7} className="nc-port-label">
                      {port.label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <p className="nc-hint">{hintText}</p>
    </div>
  );
}
