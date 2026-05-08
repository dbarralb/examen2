import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export function CodexGuideOverlay({ tooltip, onClose, confirmLabel = "Cerrar", durationMs = 10000 }) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const startTimeRef = useRef(null);

  const schedule = useCallback((remaining) => {
    window.clearTimeout(timerRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(() => onClose?.(), remaining);
  }, [onClose]);

  useEffect(() => {
    if (!tooltip) return undefined;
    elapsedRef.current = 0;
    setPaused(false);
    schedule(durationMs);
    return () => window.clearTimeout(timerRef.current);
  }, [tooltip, durationMs, schedule]);

  const handleMouseEnter = useCallback(() => {
    if (startTimeRef.current !== null) {
      elapsedRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    window.clearTimeout(timerRef.current);
    setPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const remaining = Math.max(0, durationMs - elapsedRef.current);
    schedule(remaining);
    setPaused(false);
  }, [durationMs, schedule]);

  if (!tooltip) return null;

  return (
    <div
      className="codex-guide-overlay"
      role="status"
      aria-live="polite"
      aria-labelledby="codex-guide-title"
      style={{ "--guide-duration": `${durationMs}ms` }}
    >
      <div
        className={`codex-guide-placeholder${paused ? " is-paused" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="codex-guide-progress" aria-hidden="true" />
        <h2 id="codex-guide-title">{tooltip.title}</h2>
        <p>{tooltip.text}</p>
        {tooltip.hint && (
          <p className="codex-guide-hint">{tooltip.hint}</p>
        )}
        <button type="button" className="codex-guide-close" onClick={onClose}>{confirmLabel}</button>
      </div>
    </div>
  );
}

export function TooltipGlyph({ className = "" }) {
  return (
    <img
      src="/icons/icono_tooltip.png"
      className={className}
      aria-hidden="true"
      draggable="false"
      alt=""
    />
  );
}

export function HistoryGlyph({ className = "" }) {
  return (
    <img
      src="/icons/icono_historial.png"
      className={className}
      aria-hidden="true"
      draggable="false"
      alt=""
    />
  );
}

export function PlayerCodeTooltipLayer({ tooltip, expanded = false, unread = false, onOpen, onAbout }) {
  const reducedMotion = usePrefersReducedMotion();
  const titleLine = useMemo(() => (tooltip ? tooltip.title : ""), [tooltip]);
  const descriptionLine = useMemo(() => (tooltip ? `// ${tooltip.text}` : ""), [tooltip]);
  const hintLine = useMemo(() => (tooltip?.hint ? `// sistema: ${tooltip.hint}` : ""), [tooltip]);
  const typedTitle = useTypedLine(titleLine, Boolean(tooltip && expanded), reducedMotion);
  const titleDone = typedTitle.length >= titleLine.length;
  const typedDescription = useTypedLine(descriptionLine, titleDone, reducedMotion, 120);
  const descriptionDone = typedDescription.length >= descriptionLine.length;
  const typedHint = useTypedLine(hintLine, descriptionDone && Boolean(hintLine), reducedMotion, 80);
  const hintDone = !hintLine || typedHint.length >= hintLine.length;

  if (!expanded) {
    return (
      <button
        type="button"
        className={`player-utility-btn player-utility-btn--tooltip${unread ? " has-unread" : ""}`}
        onClick={onOpen}
        aria-label="Ver guias"
      >
        {unread && <i aria-hidden="true" />}
        <TooltipGlyph className="player-utility-icon" />
      </button>
    );
  }

  if (!tooltip) return null;

  return (
    <aside className="player-code-tooltip player-code-tooltip--expanded" aria-label={`${tooltip.title}. ${tooltip.text}`}>
      <div className="player-code-tooltip__image-placeholder" aria-hidden="true" />
      <div className="player-code-tooltip__body">
        <p className="player-code-tooltip__line player-code-tooltip__line--title" aria-hidden="true">
          <span>{typedTitle}</span>
          {!titleDone && <span className="player-code-tooltip__cursor" />}
        </p>
        <p className="player-code-tooltip__line player-code-tooltip__line--description" aria-hidden="true">
          <span>{typedDescription}</span>
          {titleDone && !descriptionDone && <span className="player-code-tooltip__cursor" />}
        </p>
        {tooltip.hint && (
          <p className="player-code-tooltip__line player-code-tooltip__line--hint" aria-hidden="true">
            <span>{typedHint}</span>
            {descriptionDone && !hintDone && <span className="player-code-tooltip__cursor" />}
          </p>
        )}
        <button
          type="button"
          className={`player-code-tooltip__about ${hintDone ? "is-visible" : ""}`}
          onClick={onAbout}
        >
          [ Acerca de... ]
        </button>
      </div>
    </aside>
  );
}
