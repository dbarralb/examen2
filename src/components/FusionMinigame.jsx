import { useEffect, useRef, useState } from "react";
import { firebaseGet, firebasePatch } from "../services/firebaseClient.js";

const CHAIN_LENGTH = 3;

function getMyKey(variant) {
  return variant === "A" ? "variantA" : "variantB";
}

function getOtherKey(variant) {
  return variant === "A" ? "variantB" : "variantA";
}

export function FusionMinigame({ fusionSession, variant, onSuccess }) {
  const [step, setStep] = useState(0);           // 0..CHAIN_LENGTH tapped nodes
  const [status, setStatus] = useState("playing"); // "playing" | "waiting" | "success"
  const [writing, setWriting] = useState(false);
  const myKey = getMyKey(variant);
  const otherKey = getOtherKey(variant);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Sync external fusionSession state into local status
  useEffect(() => {
    if (fusionSession?.status === "success" && status !== "success") {
      setStatus("success");
      window.setTimeout(() => onSuccessRef.current?.(), 3200);
    }
    if (fusionSession?.[myKey]?.ready && status === "playing") {
      setStatus("waiting");
      setStep(CHAIN_LENGTH);
    }
  }, [fusionSession, myKey, status]);

  async function handleNodeTap(nodeIndex) {
    if (status !== "playing" || nodeIndex !== step || writing) return;

    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep < CHAIN_LENGTH) return;

    // Completed — write ready state to Firebase
    setStatus("waiting");
    setWriting(true);
    const now = Date.now();
    try {
      await firebasePatch("fusionSession", {
        [`${myKey}/ready`]: true,
        [`${myKey}/completedAt`]: now,
      });

      // Check if the other variant is already ready
      const session = await firebaseGet("fusionSession");
      const other = session?.[otherKey];
      if (other?.ready) {
        await firebasePatch("fusionSession", { status: "success" });
      }
    } catch {
      // Firebase write failed — let GM handle it; stay in waiting
    } finally {
      setWriting(false);
    }
  }

  const otherReady = Boolean(fusionSession?.[otherKey]?.ready);

  if (status === "success" || fusionSession?.status === "success") {
    return (
      <div className="fusion-minigame fusion-minigame--success">
        <div className="fusion-success-glow" />
        <p className="fusion-result-text">FUSION<br />COMPLETADA</p>
      </div>
    );
  }

  return (
    <div className="fusion-minigame">
      <p className="fusion-title">FUSION DE REALIDADES</p>
      <p className="fusion-subtitle">VARIANTE {variant}</p>

      <div className="fusion-circuit">
        {Array.from({ length: CHAIN_LENGTH }, (_, i) => {
          const tapped = i < step;
          const isCurrent = i === step && status === "playing";
          const isEnd = i === CHAIN_LENGTH - 1;
          return (
            <div key={i} className="fusion-circuit-seg">
              <button
                type="button"
                className={[
                  "fusion-node",
                  tapped ? "fusion-node--tapped" : "",
                  isCurrent ? "fusion-node--current" : "",
                  isEnd ? "fusion-node--end" : "",
                ].filter(Boolean).join(" ")}
                disabled={status !== "playing" || i !== step}
                onClick={() => handleNodeTap(i)}
              >
                {tapped ? "●" : isEnd ? "◈" : "○"}
              </button>
              {i < CHAIN_LENGTH - 1 && (
                <div className={`fusion-connector${tapped ? " fusion-connector--active" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="fusion-variant-hint">
        {variant === "A" ? "Componente exterior" : "Componente interior"}
      </p>

      {status === "waiting" && (
        <div className="fusion-waiting">
          {writing ? (
            <div className="fusion-waiting-spinner" />
          ) : otherReady ? (
            <p className="fusion-sync-ok">Sincronizando... ◈</p>
          ) : (
            <>
              <div className="fusion-waiting-spinner" />
              <p>Esperando Variante {variant === "A" ? "B" : "A"}…</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
