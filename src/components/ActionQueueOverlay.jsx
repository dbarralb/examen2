import { useEffect, useRef, useState } from "react";
import { buildQueuedActionChipModels } from "../presentation/actionQueuePresentation.js";
import { getPulseBadgeStatus, getPulseProgress } from "../presentation/pulsePresentation.js";
import { NBadge, NProgress } from "./newton/index.js";

function useTick(active) {
  const [, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 80);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);
}

export function ActionQueueOverlay({ actions, pulseState = {} }) {
  const chips = buildQueuedActionChipModels(actions || []);
  const status = pulseState.status || "idle";
  const isCharging = status === "charging";
  const isExecuting = status === "executing";
  const showPulse = isCharging || isExecuting;

  useTick(isCharging);

  const pulseProgress = getPulseProgress(pulseState);

  if (chips.length === 0 && !showPulse) {
    return null;
  }

  return (
    <aside className="scene-queue-overlay" aria-label="Cola de acciones">
      {showPulse && (
        <div className="scene-queue-pulse">
          <NBadge status={getPulseBadgeStatus(status)}>
            {isExecuting ? "Ejecutando pulso" : "Aviso de pulso"}
          </NBadge>
          <NProgress
            value={pulseProgress.value}
            max={pulseProgress.max}
            label={pulseProgress.label}
            color={isExecuting ? "gold" : "blue"}
          />
        </div>
      )}
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
