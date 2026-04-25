import { useEffect, useMemo, useRef, useState } from "react";
import { NButton } from "./newton";
import arrowDownConfirmed from "../../assets/Pantalla de juego/Arrows/Arrow_Down_Confirmed.png";
import arrowDownIdle from "../../assets/Pantalla de juego/Arrows/Arrow_Down_Idle.png";
import arrowDownPulsed from "../../assets/Pantalla de juego/Arrows/Arrow_Down_Pulsed.png";
import arrowLeftConfirmed from "../../assets/Pantalla de juego/Arrows/Arrow_Left_Confirmed.png";
import arrowLeftIdle from "../../assets/Pantalla de juego/Arrows/Arrow_Left_Idle.png";
import arrowLeftPulsed from "../../assets/Pantalla de juego/Arrows/Arrow_Left_Pulsed.png";
import arrowRightConfirmed from "../../assets/Pantalla de juego/Arrows/Arrow_Right_Confirmed.png";
import arrowRightIdle from "../../assets/Pantalla de juego/Arrows/Arrow_Right_Idle.png";
import arrowRightPulsed from "../../assets/Pantalla de juego/Arrows/Arrow_Right_Pulsed.png";
import arrowUpConfirmed from "../../assets/Pantalla de juego/Arrows/Arrow_Up_Confirmed.png";
import arrowUpIdle from "../../assets/Pantalla de juego/Arrows/Arrow_Up_Idle.png";
import arrowUpPulsed from "../../assets/Pantalla de juego/Arrows/Arrow_Up_Pulsed.png";

const DIRECTION_ASSETS = {
  up: { idle: arrowUpIdle, pulsed: arrowUpPulsed, confirmed: arrowUpConfirmed, label: "arriba" },
  down: { idle: arrowDownIdle, pulsed: arrowDownPulsed, confirmed: arrowDownConfirmed, label: "abajo" },
  left: { idle: arrowLeftIdle, pulsed: arrowLeftPulsed, confirmed: arrowLeftConfirmed, label: "izquierda" },
  right: { idle: arrowRightIdle, pulsed: arrowRightPulsed, confirmed: arrowRightConfirmed, label: "derecha" },
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
        asset: DIRECTION_ASSETS[direction]?.[state] || DIRECTION_ASSETS.up[state],
        label: DIRECTION_ASSETS[direction]?.label || direction,
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
          <img
            key={`${arrow.direction}-${arrow.index}-${minigame.wrongFlashId}`}
            className={`software-load-arrow ${arrow.isWrong ? "is-wrong" : ""}`}
            src={arrow.asset}
            alt=""
            draggable="false"
          />
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
