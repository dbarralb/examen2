import { useMemo } from "react";
import { ActionQueueChip } from "./ActionQueueChip.jsx";
import { NBadge, NProgress } from "./e2";
import { buildQueuedActionChipModels } from "../presentation/actionQueuePresentation.js";
import { getPulseBadgeStatus, getPulseProgress } from "../presentation/pulsePresentation.js";

export function ActionQueuePanel({
  pulseState,
  queuedActions,
  emptyMessage,
  ariaLabel,
  compactChips = false,
  stackClassName = "",
}) {
  const queuedActionChips = useMemo(() => buildQueuedActionChipModels(queuedActions), [queuedActions]);
  const pulseProgress = getPulseProgress(pulseState);
  const hasQueuedActions = queuedActionChips.length > 0 || (pulseState.actionCount || 0) > 0;
  const stackClasses = ["action-queue-stack"];

  if (stackClassName) {
    stackClasses.push(stackClassName);
  }

  return (
    <>
      <div className="gm-card-header-line">
        <NBadge status={getPulseBadgeStatus(pulseState.status)}>Pulso: {pulseState.status || "idle"}</NBadge>
        <span>{queuedActionChips.length} chips</span>
      </div>
      {pulseState.status !== "idle" && hasQueuedActions && (
        <NProgress
          value={pulseProgress.value}
          max={pulseProgress.max}
          label={pulseProgress.label}
          color={pulseState.status === "executing" ? "gold" : "blue"}
        />
      )}
      {queuedActionChips.length > 0 ? (
        <div className={stackClasses.join(" ")} aria-label={ariaLabel}>
          {queuedActionChips.map((chip) => (
            <ActionQueueChip key={chip.id} chip={chip} compact={compactChips} />
          ))}
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </>
  );
}
