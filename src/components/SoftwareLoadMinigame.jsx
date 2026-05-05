import { useEffect, useMemo, useRef, useState } from "react";
import { NButton } from "./e2";

const DIRECTION_META = {
  up: { label: "arriba" },
  down: { label: "abajo" },
  left: { label: "izquierda" },
  right: { label: "derecha" },
};

const KEY_DIRECTIONS = {
  ArrowUp: "up",
  KeyW: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  KeyS: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  KeyA: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  KeyD: "right",
  d: "right",
  D: "right",
};

const ATTEMPT_DURATION_MS = 10000;

function getKeyDirection(event) {
  return KEY_DIRECTIONS[event.code] || KEY_DIRECTIONS[event.key];
}

function getTimerTone(timeRatio) {
  if (timeRatio > 0.5) {
    return "green";
  }

  if (timeRatio > 0.2) {
    return "yellow";
  }

  return "red";
}

function DirectionArrowIcon() {
  return (
    <svg
      className="software-load-arrow-icon"
      viewBox="0 0 64 64"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M32 5 57 31H43v28H21V31H7L32 5Z" />
    </svg>
  );
}

export function createSoftwareLoadMinigame(sequence) {
  return {
    sequence,
    status: "ready",
    currentIndex: 0,
    startedAt: null,
    endsAt: null,
    result: null,
    pulsedIndex: null,
    wrongIndex: null,
    wrongFlashId: 0,
    successPulseId: 0,
  };
}

export function SoftwareLoadMinigame({ action, onChange, onSuccess, onRetry, onCancel }) {
  const minigame = action.minigame || createSoftwareLoadMinigame(["up", "down", "left", "right", "up", "down", "left", "right", "up", "down"]);
  const minigameRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const pressedRef = useRef(null);
  const successHandledRef = useRef(false);
  const sequence = minigame.sequence || [];
  const confirmedCount = minigame.status === "success" ? sequence.length : minigame.currentIndex;
  const total = sequence.length || 1;
  const isTerminal = ["success", "failed"].includes(minigame.status);
  const remainingMs = minigame.endsAt ? Math.max(0, minigame.endsAt - now) : ATTEMPT_DURATION_MS;
  const remainingRatio = remainingMs / ATTEMPT_DURATION_MS;
  const timerTone = getTimerTone(remainingRatio);
  const timerLabel = minigame.startedAt ? `${Math.ceil(remainingMs / 1000)}s` : "10s";
  const dotTone = minigame.status === "failed" || minigame.wrongIndex !== null ? "red" : "green";

  const arrowItems = useMemo(() => {
    return sequence.map((direction, index) => {
      let state = "idle";

      if (index < minigame.currentIndex || minigame.status === "success") {
        state = "confirmed";
      } else if (index === minigame.pulsedIndex) {
        state = "pulsed";
      }

      return {
        direction,
        index,
        state,
        isWrong: index === minigame.wrongIndex,
        label: DIRECTION_META[direction]?.label || direction,
      };
    });
  }, [minigame.currentIndex, minigame.pulsedIndex, minigame.status, minigame.wrongIndex, sequence]);

  useEffect(() => {
    minigameRef.current?.focus();
  }, [action.id]);

  useEffect(() => {
    if (minigame.status !== "running") {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [minigame.status]);

  useEffect(() => {
    if (minigame.status !== "running" || !minigame.endsAt || remainingMs > 0) {
      return;
    }

    pressedRef.current = null;
    onChange({
      ...minigame,
      status: "failed",
      currentIndex: 0,
      result: "failed",
      pulsedIndex: null,
      wrongIndex: null,
    });
  }, [minigame, onChange, remainingMs]);

  useEffect(() => {
    if (minigame.status === "success" && !successHandledRef.current) {
      successHandledRef.current = true;
      onSuccess?.();
    }
  }, [minigame.status, onSuccess]);

  function updateMinigame(nextMinigame) {
    onChange(nextMinigame);
  }

  function handleKeyDown(event) {
    const direction = getKeyDirection(event);

    if (!direction || isTerminal || pressedRef.current) {
      return;
    }

    event.preventDefault();

    const expectedDirection = sequence[minigame.currentIndex];
    const attemptStartedAt = minigame.startedAt || Date.now();
    const runningBase = {
      ...minigame,
      status: "running",
      startedAt: attemptStartedAt,
      endsAt: minigame.endsAt || attemptStartedAt + ATTEMPT_DURATION_MS,
      result: null,
    };

    if (direction !== expectedDirection) {
      pressedRef.current = { direction, isCorrect: false };
      updateMinigame({
        ...runningBase,
        currentIndex: 0,
        pulsedIndex: minigame.currentIndex,
        wrongIndex: minigame.currentIndex,
        wrongFlashId: minigame.wrongFlashId + 1,
      });
      return;
    }

    pressedRef.current = { direction, isCorrect: true, index: minigame.currentIndex };
    updateMinigame({
      ...runningBase,
      pulsedIndex: minigame.currentIndex,
      wrongIndex: null,
    });
  }

  function handleKeyUp(event) {
    const direction = getKeyDirection(event);
    const pressed = pressedRef.current;

    if (!direction || !pressed || pressed.direction !== direction) {
      return;
    }

    event.preventDefault();
    pressedRef.current = null;

    if (!pressed.isCorrect) {
      updateMinigame({
        ...minigame,
        currentIndex: 0,
        pulsedIndex: null,
      });
      return;
    }

    const nextIndex = pressed.index + 1;
    const isComplete = nextIndex >= sequence.length;

    updateMinigame({
      ...minigame,
      status: isComplete ? "success" : "running",
      currentIndex: nextIndex,
      result: isComplete ? "success" : null,
      pulsedIndex: null,
      wrongIndex: null,
      successPulseId: minigame.successPulseId + 1,
    });
  }

  return (
    <div
      ref={minigameRef}
      className={`software-load-minigame software-load-${minigame.status}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label="Minijuego de carga de software"
    >
      <div className="software-load-header">
        <div className="software-load-title">
          <span
            key={`${dotTone}-${minigame.successPulseId}-${minigame.wrongFlashId}`}
            className={`software-load-dot ${dotTone}`}
            aria-hidden="true"
          />
          <strong>{minigame.status === "success" ? "Carga de software completada" : minigame.status === "failed" ? "Carga de software fallida" : "Carga de software"}</strong>
        </div>
        <span className={`software-load-timer ${timerTone}`}>{timerLabel}</span>
      </div>
      <div className="software-load-progress" aria-label={`${confirmedCount} de ${total} aciertos`}>
        {sequence.map((direction, index) => (
          <span key={`${direction}-${index}`} className={index < confirmedCount ? "filled" : ""} />
        ))}
      </div>
      <div className="software-load-arrows" aria-hidden="true">
        {arrowItems.map((arrow) => (
          <span
            key={`${arrow.direction}-${arrow.index}-${minigame.wrongFlashId}`}
            className={`software-load-arrow direction-${arrow.direction} state-${arrow.state} ${arrow.isWrong ? "is-wrong" : ""}`}
            title={arrow.label}
          >
            <span className="software-load-arrow-index">{String(arrow.index + 1).padStart(2, "0")}</span>
            <DirectionArrowIcon />
          </span>
        ))}
      </div>
      {!isTerminal && <small>Pulsa WASD o las flechas en orden para completar la carga.</small>}
      {minigame.status === "failed" && (
        <div className="software-load-actions">
          <NButton size="sm" onClick={onRetry}>Reintentar</NButton>
          <NButton variant="danger" size="sm" onClick={onCancel}>Cancelar</NButton>
        </div>
      )}
    </div>
  );
}
