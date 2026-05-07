import { useEffect, useMemo, useState } from "react";

const TYPE_INTERVAL_MS = 24;

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);
    handleChange();
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  return reducedMotion;
}

function useTypedLine(text, isActive, reducedMotion, delayMs = 0) {
  const [count, setCount] = useState(reducedMotion ? text.length : 0);

  useEffect(() => {
    if (!isActive || reducedMotion) {
      setCount(isActive ? text.length : 0);
      return undefined;
    }

    setCount(0);
    let intervalId = null;
    const startTimer = window.setTimeout(() => {
      let nextCount = 0;
      intervalId = window.setInterval(() => {
        nextCount += 1;
        setCount(nextCount);
        if (nextCount >= text.length) {
          window.clearInterval(intervalId);
        }
      }, TYPE_INTERVAL_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [delayMs, isActive, reducedMotion, text]);

  return text.slice(0, count);
}

export function CodexGuideOverlay({ tooltip, onClose }) {
  if (!tooltip) return null;

  return (
    <div className="codex-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="codex-guide-title">
      <div className="codex-guide-placeholder">
        <span className="codex-guide-kicker">codex://guia</span>
        <h2 id="codex-guide-title">{tooltip.title}</h2>
        <p>{tooltip.text}</p>
        <button type="button" className="codex-guide-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export function TooltipGlyph({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 8C15.7 8 9 13.4 9 20.2c0 4.7 3.2 8.8 8 10.8l-1.2 6.4 6.5-5.1c.6.1 1.1.1 1.7.1 8.3 0 15-5.4 15-12.2S32.3 8 24 8Z" />
      <path d="M17.8 20.3 22 16.1M22 24.5l-4.2-4.2M30.2 16.1 26 20.3l4.2 4.2" />
    </svg>
  );
}

export function HistoryGlyph({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M12 13h24M12 24h24M12 35h16" />
      <path d="M10 8h28c2 0 3 1 3 3v26c0 2-1 3-3 3H10c-2 0-3-1-3-3V11c0-2 1-3 3-3Z" />
    </svg>
  );
}

export function PlayerCodeTooltipLayer({ tooltip, expanded = false, unread = false, onOpen, onAbout }) {
  const reducedMotion = usePrefersReducedMotion();
  const titleLine = useMemo(() => (tooltip ? `codex:// ${tooltip.title.toLowerCase().replace(/\s+/g, "_")}` : ""), [tooltip]);
  const descriptionLine = useMemo(() => (tooltip ? `// ${tooltip.text}` : ""), [tooltip]);
  const typedTitle = useTypedLine(titleLine, Boolean(tooltip && expanded), reducedMotion);
  const titleDone = typedTitle.length >= titleLine.length;
  const typedDescription = useTypedLine(descriptionLine, titleDone, reducedMotion, 120);
  const descriptionDone = typedDescription.length >= descriptionLine.length;

  if (!tooltip) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        className="player-utility-btn player-utility-btn--tooltip"
        onClick={onOpen}
        aria-label={`Leer ayuda: ${tooltip.title}`}
      >
        {/* TODO: replace this bespoke SVG placeholder with the final Codex icon asset. */}
        <TooltipGlyph className="player-utility-icon" />
        {unread && <i aria-hidden="true" />}
      </button>
    );
  }

  return (
    <aside className="player-code-tooltip player-code-tooltip--expanded" aria-label={`${tooltip.title}. ${tooltip.text}`}>
      <p className="player-code-tooltip__line player-code-tooltip__line--title" aria-hidden="true">
        <span>{typedTitle}</span>
        {!titleDone && <span className="player-code-tooltip__cursor" />}
      </p>
      <p className="player-code-tooltip__line player-code-tooltip__line--description" aria-hidden="true">
        <span>{typedDescription}</span>
        {titleDone && !descriptionDone && <span className="player-code-tooltip__cursor" />}
      </p>
      <button
        type="button"
        className={`player-code-tooltip__about ${descriptionDone ? "is-visible" : ""}`}
        onClick={onAbout}
      >
        [ Acerca de... ]
      </button>
    </aside>
  );
}
