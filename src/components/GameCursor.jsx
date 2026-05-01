import { useEffect, useRef } from "react";
import mouseDetectionState1Url from "../../assets/mouse/Mouse_detection_state1.png";
import mouseDetectionState2Url from "../../assets/mouse/Mouse_detection_state2.png";
import mouseDetectionState3Url from "../../assets/mouse/Mouse_detection_state3.png";
import mouseDetectionState4Url from "../../assets/mouse/Mouse_detection_state4.png";
import mouseDetectionState5Url from "../../assets/mouse/Mouse_detection_state5.png";
import mouseIdleUrl from "../../assets/mouse/Mouse_idle.png";

const cursorTextures = {
  idle: mouseIdleUrl,
  detection1: mouseDetectionState1Url,
  detection2: mouseDetectionState2Url,
  detection3: mouseDetectionState3Url,
  detection4: mouseDetectionState4Url,
  detection5: mouseDetectionState5Url,
};

function getCursorState(level = 0) {
  const detectionLevel = Math.max(0, Math.min(5, Number(level) || 0));
  return detectionLevel > 0 ? `detection${detectionLevel}` : "idle";
}

export function GameCursor() {
  const cursorRef = useRef(null);
  const imageRef = useRef(null);
  const currentStateRef = useRef("idle");
  const flickerTimersRef = useRef([]);

  useEffect(() => {
    const updatePosition = (event) => {
      const cursor = cursorRef.current;
      if (!cursor) return;

      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) scale(var(--game-cursor-scale))`;
      cursor.classList.add("is-visible");
    };

    const hideCursor = () => cursorRef.current?.classList.remove("is-visible");

    window.addEventListener("pointermove", updatePosition, { passive: true });
    window.addEventListener("pointerdown", updatePosition, { passive: true });
    window.addEventListener("pointerenter", updatePosition, { passive: true });
    window.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      window.removeEventListener("pointermove", updatePosition);
      window.removeEventListener("pointerdown", updatePosition);
      window.removeEventListener("pointerenter", updatePosition);
      window.removeEventListener("pointerleave", hideCursor);
      window.removeEventListener("blur", hideCursor);
    };
  }, []);

  useEffect(() => {
    const clearFlicker = () => {
      flickerTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      flickerTimersRef.current = [];
      cursorRef.current?.classList.remove("is-switching");
    };

    const applyState = (state) => {
      const cursor = cursorRef.current;
      const image = imageRef.current;
      if (!cursor || !image || state === currentStateRef.current) return;

      const previousState = currentStateRef.current;
      const previousLevel = previousState.startsWith("detection") ? Number(previousState.replace("detection", "")) : 0;
      const nextLevel = state.startsWith("detection") ? Number(state.replace("detection", "")) : 0;

      clearFlicker();
      cursor.classList.remove(
        "is-idle",
        "is-detection",
        "is-detection-1",
        "is-detection-2",
        "is-detection-3",
        "is-detection-4",
        "is-detection-5"
      );
      cursor.classList.add(state === "idle" ? "is-idle" : "is-detection", `is-${state.replace("detection", "detection-")}`);

      if (nextLevel > previousLevel) {
        cursor.classList.add("is-switching");
        [0, 60, 120, 180, 240].forEach((delay, index) => {
          flickerTimersRef.current.push(window.setTimeout(() => {
            image.src = cursorTextures[index % 2 === 0 ? state : previousState];
          }, delay));
        });
        flickerTimersRef.current.push(window.setTimeout(() => {
          image.src = cursorTextures[state];
          cursor.classList.remove("is-switching");
        }, 300));
      } else {
        image.src = cursorTextures[state];
      }

      currentStateRef.current = state;
    };

    const handleCursorState = (event) => applyState(getCursorState(event.detail?.level));
    const resetCursor = () => applyState("idle");

    window.addEventListener("game-cursor-state", handleCursorState);
    window.addEventListener("pointerleave", resetCursor);
    window.addEventListener("blur", resetCursor);

    return () => {
      clearFlicker();
      window.removeEventListener("game-cursor-state", handleCursorState);
      window.removeEventListener("pointerleave", resetCursor);
      window.removeEventListener("blur", resetCursor);
    };
  }, []);

  return (
    <span
      ref={cursorRef}
      className="game-cursor is-idle"
      aria-hidden="true"
    >
      <img
        ref={imageRef}
        className="game-cursor-image"
        src={mouseIdleUrl}
        alt=""
        draggable="false"
      />
    </span>
  );
}
