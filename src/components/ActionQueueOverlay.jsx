import { useEffect, useRef, useState } from "react";
import { buildQueuedActionChipModel, buildQueuedActionChipModels } from "../presentation/actionQueuePresentation.js";
import { getPulseProgress } from "../presentation/pulsePresentation.js";
import { PulseSignalFrame } from "./PulseSignalFrame.jsx";

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
  const isExecuting = status === "executing";
  const currentResult = pulseState.currentActionResult;
  const resultChip = currentResult?.visible ? buildQueuedActionChipModel(currentResult) : null;

  useTick(true);

  const pulseProgress = getPulseProgress(pulseState);

  return (
    <aside className="scene-queue-overlay" aria-label="Cola de acciones">
      <PulseSignalFrame pulseState={pulseState} />
      <div className="scene-queue-strip">
        <div className="scene-queue-memories">
          {chips.map((chip) => (
            <article key={chip.id} className="scene-queue-memory" tabIndex={0} aria-label={chip.label}>
              <img className="scene-queue-memory-image" src={chip.chipImage} alt="" draggable="false" />
              <div className="scene-queue-info" role="tooltip">
                <strong>{chip.cardLabel}</strong>
                <span>{chip.actionLabel} / {chip.targetLabel}</span>
                <small>{chip.statusLabel}</small>
              </div>
            </article>
          ))}
        </div>
        {isExecuting && (
          <div className="scene-queue-result-slot" aria-live="polite">
            {resultChip && currentResult ? (
              <article className="scene-queue-result-card">
                <img className="scene-queue-result-image" src={resultChip.chipImage} alt="" draggable="false" />
                <div>
                  <span>{resultChip.playerLabel}</span>
                  <strong>{resultChip.cardLabel} / {resultChip.targetLabel}</strong>
                  <p>{currentResult.message}</p>
                </div>
              </article>
            ) : (
              <article className="scene-queue-result-card scene-queue-result-card--pending">
                <div>
                  <span>Pulso activo</span>
                  <strong>Resolviendo accion</strong>
                  <p>La senal esta procesando la cola.</p>
                </div>
              </article>
            )}
          </div>
        )}
      </div>
      {isExecuting && (
        <div className="scene-queue-cooldown">
          <span>Cooldown de pulso</span>
          <div className="scene-queue-cooldown-track" aria-hidden="true">
            <i style={{ width: `${Math.min(100, Math.max(0, (pulseProgress.value / pulseProgress.max) * 100))}%` }} />
          </div>
        </div>
      )}
    </aside>
  );
}
