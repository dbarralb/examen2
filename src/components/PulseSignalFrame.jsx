import { getPulseScheduleProgress } from "../presentation/pulsePresentation.js";

export const PULSE_SIGNAL_PHASES = {
  stable: {
    label: "estable",
    className: "stable",
  },
  unstable: {
    label: "inestable",
    className: "unstable",
  },
  critical: {
    label: "critica",
    className: "critical",
  },
  executing: {
    label: "error",
    className: "executing",
  },
};

export function PulseSignalFrame({ pulseState = {} }) {
  const status = pulseState.status || "idle";
  const isExecuting = status === "executing";
  const schedule = getPulseScheduleProgress(pulseState);
  const phase = isExecuting ? PULSE_SIGNAL_PHASES.executing : PULSE_SIGNAL_PHASES[schedule.phase] || PULSE_SIGNAL_PHASES.stable;

  return (
    <div
      className={`pulse-signal-frame pulse-signal-frame--${phase.className}`}
      data-phase={phase.className}
      aria-label="Senal de estabilidad temporal"
    >
      <div className="pulse-signal-frame__glitch" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="pulse-signal-frame__screen">
        {isExecuting ? (
          <div className="pulse-signal-frame__error">
            <strong>Error</strong>
            <span>senal perdida</span>
          </div>
        ) : (
          <svg className="pulse-signal-frame__wave" viewBox="0 0 240 70" preserveAspectRatio="none" focusable="false">
            <path className="pulse-signal-frame__wave-shadow" d="M0 35 C18 18 30 52 48 35 S78 52 96 35 S126 18 144 35 S174 52 192 35 S222 18 240 35" />
            <path className="pulse-signal-frame__wave-core" d="M0 35 C18 18 30 52 48 35 S78 52 96 35 S126 18 144 35 S174 52 192 35 S222 18 240 35" />
            <path className="pulse-signal-frame__wave-noise" d="M0 38 L15 31 L28 43 L44 28 L58 39 L75 34 L92 45 L110 26 L128 37 L148 31 L164 43 L184 29 L204 39 L220 33 L240 42" />
          </svg>
        )}
      </div>
    </div>
  );
}
