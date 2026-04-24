export function getPulseBadgeStatus(status) {
  if (status === "executing") {
    return "warning";
  }

  if (status === "charging") {
    return "info";
  }

  return "muted";
}

export function getPulseProgress(pulseState) {
  const now = Date.now();

  if (pulseState.status === "charging" && pulseState.pulseChargeStartedAt && pulseState.pulseChargeEndsAt) {
    return {
      label: "Aviso de pulso",
      value: now - pulseState.pulseChargeStartedAt,
      max: pulseState.pulseChargeEndsAt - pulseState.pulseChargeStartedAt,
    };
  }

  if (pulseState.status === "executing") {
    return {
      label: "Ejecucion",
      value: 1,
      max: 1,
    };
  }

  return {
    label: "Pulso",
    value: 0,
    max: 1,
  };
}
