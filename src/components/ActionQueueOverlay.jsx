import { useEffect, useRef, useState } from "react";
import { buildQueuedActionChipModels } from "../presentation/actionQueuePresentation.js";
import { getPulseProgress } from "../presentation/pulsePresentation.js";
import { PulseSignalFrame } from "./PulseSignalFrame.jsx";

const MAX_VISIBLE_CHIPS = 8;

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

function getChipExecutionClass(chip, pulseState) {
  if (pulseState.status !== "executing") {
    return "";
  }

  if (chip.status === "resolved") {
    return " scene-action-chip--resolved";
  }

  if (chip.id === pulseState.currentActionId) {
    return " scene-action-chip--executing";
  }

  return "";
}

export function ActionQueueOverlay({ actions, pulseState = {}, resonanceValue = null, resonanceRewardFeedback = null }) {
  const chips = buildQueuedActionChipModels(actions || []).slice(0, MAX_VISIBLE_CHIPS);
  const isExecuting = pulseState.status === "executing";
  const hasQueuedActions = chips.length > 0 || (pulseState.actionCount || 0) > 0;
  const showExecutionProgress = isExecuting && hasQueuedActions;

  useTick(isExecuting);

  const pulseProgress = getPulseProgress(pulseState);
  const progressPercent = Math.min(100, Math.max(0, (pulseProgress.value / pulseProgress.max) * 100));

  return (
    <>
      <div className="scene-pulse-signal-zone">
        <PulseSignalFrame pulseState={pulseState} />
        {resonanceValue !== null && (
          <div className={`player-resonance-counter ${resonanceRewardFeedback ? "player-resonance-counter--reward" : ""}`} aria-label="Resonancia acumulada">
            <span>Resonancia</span>
            <strong>{resonanceValue}</strong>
            {resonanceRewardFeedback && (
              <em key={resonanceRewardFeedback.id}>+{resonanceRewardFeedback.amount}</em>
            )}
          </div>
        )}
      </div>

      <aside className={`scene-action-queue ${showExecutionProgress ? "scene-action-queue--executing" : ""}`} aria-label="Cola de acciones">
        {showExecutionProgress && (
          <div className="scene-action-queue__pulse" aria-live="polite">
            <span>{pulseProgress.label}</span>
            <strong>{Math.min(pulseState.actionIndex || 0, pulseState.actionCount || 0)}/{pulseState.actionCount || chips.length}</strong>
            <div className="scene-action-queue__pulse-track" aria-hidden="true">
              <i style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="scene-action-queue__chips">
          {chips.map((chip, index) => (
            <article
              key={chip.id}
              className={`scene-action-chip role-${chip.roleId || "unknown"}${getChipExecutionClass(chip, pulseState)}`}
              style={{ "--queue-index": index }}
              tabIndex={0}
              aria-label={`${chip.label}. Carga ${chip.charge ?? 0}`}
            >
              {chip.charge != null && (
                <strong className="scene-action-chip__charge">{chip.charge}</strong>
              )}
              <img className="scene-action-chip__image" src={chip.chipImage} alt="" draggable="false" />
              {chip.status === "resolved" && chip.charge != null && (
                <strong className="scene-action-chip__resolved-charge">+{chip.charge}</strong>
              )}
              <div className="scene-action-chip__burst" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="scene-action-chip__burst scene-action-chip__burst--entry" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="scene-action-chip__info" role="tooltip">
                <strong>{chip.cardLabel}</strong>
                <span>{chip.actionLabel} / {chip.targetLabel}</span>
                <small>{chip.playerLabel}</small>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
