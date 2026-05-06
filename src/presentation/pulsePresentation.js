export function getPulseBadgeStatus(status) {
  if (status === "executing") {
    return "warning";
  }

  if (status === "charging") {
    return "info";
  }

  return "muted";
}

export function getPulseScheduleProgress(pulseState = {}) {
  const schedule = pulseState.schedule || {};
  const now = Date.now();

  if (!schedule.nextPulseAt || !schedule.scheduledAt) {
    return {
      label: "Proximo pulso no programado",
      value: 0,
      max: 1,
      remainingMs: null,
      phase: "unknown",
      proximity: 0,
    };
  }

  const total = Math.max(1, schedule.nextPulseAt - schedule.scheduledAt);
  const elapsed = Math.max(0, Math.min(total, now - schedule.scheduledAt));
  const remainingMs = Math.max(0, schedule.nextPulseAt - now);
  const proximity = elapsed / total;

  return {
    label: "Proximo pulso",
    value: elapsed,
    max: total,
    remainingMs,
    phase: proximity >= 0.82 ? "critical" : proximity >= 0.48 ? "unstable" : "stable",
    proximity,
  };
}

export function formatPulseCountdown(ms) {
  if (ms === null || ms === undefined) {
    return "--:--";
  }

  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getPulseProgress(pulseState) {
  const now = Date.now();

  if (pulseState.status === "idle") {
    const schedule = getPulseScheduleProgress(pulseState);
    return {
      label: schedule.label,
      value: schedule.value,
      max: schedule.max,
    };
  }

  if (pulseState.status === "charging" && pulseState.pulseChargeStartedAt && pulseState.pulseChargeEndsAt) {
    return {
      label: "Aviso de pulso",
      value: now - pulseState.pulseChargeStartedAt,
      max: pulseState.pulseChargeEndsAt - pulseState.pulseChargeStartedAt,
    };
  }

  if (pulseState.status === "executing" && pulseState.pulseStartAt && pulseState.pulseEndsAt) {
    return {
      label: "Ejecucion",
      value: now - pulseState.pulseStartAt,
      max: pulseState.pulseEndsAt - pulseState.pulseStartAt,
    };
  }

  return {
    label: "Pulso",
    value: 0,
    max: 1,
  };
}
