import { useId } from "react";

export function PulseAnomalyVFX({ className = "", style = null }) {
  const rawId = useId().replace(/:/g, "");
  const glowId = `${rawId}-pulse-anomaly-soft-glow`;
  const greenMagentaId = `${rawId}-pulse-anomaly-green-magenta`;
  const magentaGreenId = `${rawId}-pulse-anomaly-magenta-green`;

  return (
    <div className={`pulse-anomaly-vfx ${className}`.trim()} style={style} aria-hidden="true">
      <svg viewBox="0 0 100 220" preserveAspectRatio="none" focusable="false">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={greenMagentaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ED300" />
            <stop offset="42%" stopColor="#D41383" />
            <stop offset="70%" stopColor="#9ED300" />
            <stop offset="100%" stopColor="#D41383" />
          </linearGradient>
          <linearGradient id={magentaGreenId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D41383" />
            <stop offset="46%" stopColor="#9ED300" />
            <stop offset="100%" stopColor="#D41383" />
          </linearGradient>
        </defs>

        <path
          className="pulse-anomaly-vfx__glow"
          d="M54 4 C26 30 84 48 54 78 C24 108 80 124 52 154 C26 184 68 198 40 216"
          fill="none"
          stroke={`url(#${greenMagentaId})`}
          filter={`url(#${glowId})`}
        />
        <path
          className="pulse-anomaly-vfx__glow"
          d="M42 2 C74 34 22 62 52 90 C84 120 28 142 56 170 C82 196 44 206 60 218"
          fill="none"
          stroke={`url(#${magentaGreenId})`}
          filter={`url(#${glowId})`}
        />

        <path
          className="pulse-anomaly-vfx__core"
          d="M54 4 C26 30 84 48 54 78 C24 108 80 124 52 154 C26 184 68 198 40 216"
          fill="none"
          stroke={`url(#${greenMagentaId})`}
        />
        <path
          className="pulse-anomaly-vfx__core"
          d="M42 2 C74 34 22 62 52 90 C84 120 28 142 56 170 C82 196 44 206 60 218"
          fill="none"
          stroke={`url(#${magentaGreenId})`}
        />

        <path className="pulse-anomaly-vfx__thread" d="M55 80 C66 76 72 82 76 93" fill="none" stroke="#9ED300" />
        <path className="pulse-anomaly-vfx__thread pulse-anomaly-vfx__thread--slow" d="M48 119 C34 116 27 126 20 139" fill="none" stroke="#D41383" />
        <path className="pulse-anomaly-vfx__thread" d="M53 155 C66 150 78 154 86 166" fill="none" stroke="#9ED300" />
        <path className="pulse-anomaly-vfx__thread pulse-anomaly-vfx__thread--slow" d="M44 186 C31 186 22 194 16 207" fill="none" stroke="#D41383" />

        <line className="pulse-anomaly-vfx__spark" x1="50" y1="76" x2="59" y2="68" stroke="#9ED300" />
        <line className="pulse-anomaly-vfx__spark" x1="55" y1="151" x2="66" y2="146" stroke="#D41383" />
        <line className="pulse-anomaly-vfx__spark" x1="40" y1="186" x2="31" y2="193" stroke="#9ED300" />

        <circle className="pulse-anomaly-vfx__node" cx="53" cy="78" r="2.4" fill="#9ED300" />
        <circle className="pulse-anomaly-vfx__node pulse-anomaly-vfx__node--delay" cx="52" cy="154" r="3.4" fill="#ffffff" />
        <circle className="pulse-anomaly-vfx__node pulse-anomaly-vfx__node--late" cx="43" cy="188" r="2.2" fill="#D41383" />
      </svg>
    </div>
  );
}
