import { useEffect, useMemo, useRef, useState } from "react";
import { firebaseGet } from "../services/firebaseClient.js";
import { applyScenarioHotspotOverrides, getScenarioHotspots } from "../data/scenarioContent.js";
import { DEFAULT_SCENARIO_ID } from "../data/scenarioData.js";
import { cards } from "../data/gameData.js";
import { getRole } from "../data/roles.js";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { createPendingAction, enqueueLoadedAction, incrementCardUsage } from "../services/playerService.js";
import { createInitialGameState, normalizeRemoteList } from "../services/remoteState.js";
import {
  getActiveSessionCode,
  hasValidStoredSessionCode,
  normalizeSessionCode,
  storeSessionCode,
} from "../services/sessionAccess.js";
import { NodeGraph } from "../components/NodeGraph.jsx";
import { FusionMinigame } from "../components/FusionMinigame.jsx";

async function getDeviceState(roleId) {
  const [
    session,
    gameState,
    pulseState,
    queuedActions,
    playerBoard,
    hotspotOverrides,
    fusionSession,
    gmGraphType,
  ] = await Promise.all([
    firebaseGet("session"),
    firebaseGet("gameState"),
    firebaseGet("pulseState"),
    firebaseGet("queuedActions"),
    firebaseGet(`playerBoards/${roleId}`),
    firebaseGet("hotspotOverrides"),
    firebaseGet("fusionSession"),
    firebaseGet(`deviceConfig/${roleId}/graphType`),
  ]);
  return { session, gameState, pulseState, queuedActions, playerBoard, hotspotOverrides, fusionSession, gmGraphType };
}

function HotspotMinimap({ targets, selectedTargetId, onSelectTarget }) {
  return (
    <svg
      className="device-minimap"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Mapa de objetivos"
      role="group"
    >
      <rect x="0" y="0" width="100" height="100" className="device-minimap-bg" />
      {targets.map((target) => {
        const isSelected = target.id === selectedTargetId;
        return (
          <g
            key={target.id}
            onClick={() => onSelectTarget(target.id)}
            className={`device-minimap-hotspot device-minimap-hotspot--${target.hotspotClass || "generico"}${isSelected ? " device-minimap-hotspot--selected" : ""}`}
            role="button"
            aria-label={target.label}
            aria-pressed={isSelected}
          >
            <rect
              x={target.x}
              y={target.y}
              width={target.w}
              height={target.h}
              rx="1.5"
              className="device-minimap-rect"
            />
            <text
              x={target.x + target.w / 2}
              y={target.y + target.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="device-minimap-label"
            >
              {target.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DeviceScreen({ params }) {
  const roleIdParam = params.get("role") || "empollon";
  const codeParam = params.get("code") || "";
  const role = getRole(roleIdParam);

  const [authState, setAuthState] = useState("checking"); // "checking" | "enter_code" | "ready"
  const [codeInput, setCodeInput] = useState(codeParam);
  const [codeError, setCodeError] = useState("");
  const [remoteState, setRemoteState] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [queueStatus, setQueueStatus] = useState("idle"); // "idle" | "queuing" | "done" | "error"
  const [statusMsg, setStatusMsg] = useState("");
  const [nodeGraphActive, setNodeGraphActive] = useState(false);
  const [fusionDismissed, setFusionDismissed] = useState(false);
  const codeInputRef = useRef(null);
  const prevFusionIdRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await firebaseGet("session");

        if (codeParam) {
          const normalized = normalizeSessionCode(codeParam);
          const activeCode = getActiveSessionCode(session);
          const playerCodes = session?.playerCodes ? Object.values(session.playerCodes) : [];
          if (normalized === activeCode || playerCodes.includes(normalized)) {
            storeSessionCode(normalized);
            setAuthState("ready");
            return;
          }
        }

        if (hasValidStoredSessionCode(session)) {
          setAuthState("ready");
          return;
        }

        setAuthState("enter_code");
      } catch {
        setAuthState("enter_code");
        setCodeError("No se pudo conectar. Comprueba la red.");
      }
    })();
  }, []);

  async function handleCodeSubmit(e) {
    e.preventDefault();
    setCodeError("");
    const normalized = normalizeSessionCode(codeInput);

    if (normalized.length !== 6) {
      setCodeError("El codigo debe tener 6 digitos.");
      return;
    }

    try {
      const session = await firebaseGet("session");
      const activeCode = getActiveSessionCode(session);
      const playerCodes = session?.playerCodes ? Object.values(session.playerCodes) : [];

      if (normalized !== activeCode && !playerCodes.includes(normalized)) {
        setCodeError("Codigo incorrecto.");
        return;
      }

      storeSessionCode(normalized);
      setAuthState("ready");
    } catch {
      setCodeError("No se pudo verificar. Reintenta.");
    }
  }

  usePollingRefresh({
    intervalMs: 1500,
    enabled: authState === "ready",
    task: async ({ isCancelled }) => {
      try {
        const state = await getDeviceState(role.id);
        if (isCancelled()) return;

        if (state.session?.status !== "in_game") {
          setAuthState("enter_code");
          setCodeError("La sesion ha finalizado.");
          return;
        }

        if (!hasValidStoredSessionCode(state.session)) {
          setAuthState("enter_code");
          return;
        }

        setRemoteState(state);
      } catch { /* silent */ }
    },
  });

  const gameState = { ...createInitialGameState(), ...(remoteState?.gameState || {}) };
  const pulseState = remoteState?.pulseState || {};
  const playerBoard = remoteState?.playerBoard || {};
  const boardVariant = playerBoard.variant || "A";
  const boardScenarioId = playerBoard.scenarioId || DEFAULT_SCENARIO_ID;
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const resonanceValue = Number(gameState.resonance?.value || 0);
  const overlayActive = pulseState.status === "executing";
  const fusionSession = remoteState?.fusionSession || null;
  const gmGraphType = remoteState?.gmGraphType || null;
  const forcedGraphType = (gmGraphType && gmGraphType !== "random") ? gmGraphType : null;

  // Reset dismissed state when a new fusion session starts
  useEffect(() => {
    const newId = fusionSession?.id;
    if (newId && newId !== prevFusionIdRef.current) {
      prevFusionIdRef.current = newId;
      setFusionDismissed(false);
    }
  }, [fusionSession?.id]);

  const boardTargets = useMemo(() => (
    applyScenarioHotspotOverrides(
      getScenarioHotspots(boardScenarioId, boardVariant),
      remoteState?.hotspotOverrides || {},
      boardScenarioId,
      boardVariant,
    )
  ), [boardScenarioId, boardVariant, remoteState?.hotspotOverrides]);

  const selectedTarget = boardTargets.find((t) => t.id === selectedTargetId);
  const queuedForMe = queuedActions.find(
    (a) => a.role === role.id && ["queued", "executing"].includes(a.status || "queued"),
  );

  const fusionActive = fusionSession?.status === "pending"
    && (boardVariant === "A" || boardVariant === "B")
    && !fusionDismissed;

  async function handleNodeGraphResult({ actionKind }) {
    setNodeGraphActive(false);
    const card = cards.find((c) => c.roles.includes(role.id) && c.actionKind === actionKind);
    if (!card || !selectedTargetId) return;

    setQueueStatus("queuing");
    setStatusMsg("");
    try {
      const pending = createPendingAction({
        card,
        targetId: selectedTargetId,
        roleId: role.id,
        scenarioId: boardScenarioId,
        variant: boardVariant,
      });
      await enqueueLoadedAction(pending);
      incrementCardUsage(role.id, card.id, 0).catch(() => {});
      setQueueStatus("done");
      setStatusMsg("Accion en cola para el siguiente pulso.");
    } catch {
      setQueueStatus("error");
      setStatusMsg("No se pudo encolar. Reintenta.");
    }
  }

  useEffect(() => {
    if (!queuedForMe && queueStatus === "done") {
      setQueueStatus("idle");
      setStatusMsg("");
    }
  }, [queuedForMe, queueStatus]);

  if (authState === "checking") {
    return (
      <main className="device-screen device-screen--checking">
        <div className="device-check-spinner" aria-label="Verificando..." />
        <span>Verificando sesion...</span>
      </main>
    );
  }

  if (authState === "enter_code") {
    return (
      <main className="device-screen device-screen--auth">
        <div className="device-auth-panel">
          <div className="device-auth-logo">E2</div>
          <h1 className="device-auth-title">Dispositivo</h1>
          <p className="device-auth-subtitle">{role.label}</p>
          <form className="device-auth-form" onSubmit={handleCodeSubmit}>
            <label htmlFor="device-code-input">Codigo de sesion</label>
            <input
              ref={codeInputRef}
              id="device-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={codeInput}
              maxLength={6}
              placeholder="000000"
              className="device-code-input"
              autoFocus
              onChange={(e) => setCodeInput(e.target.value)}
            />
            {codeError && <span className="device-code-error" role="alert">{codeError}</span>}
            <button type="submit" className="device-code-submit">Conectar</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="device-screen device-screen--active">
      <header className="device-header">
        <span className={`device-role-badge device-role-badge--${role.id}`}>{role.label}</span>
        <div className="device-resonance">
          <span className="device-resonance-icon">✦</span>
          <strong>{resonanceValue}</strong>
        </div>
        <span className="device-variant-badge">Realidad {boardVariant}</span>
      </header>

      {fusionActive ? (
        <div className="device-fusion-wrap">
          <FusionMinigame
            fusionSession={fusionSession}
            variant={boardVariant}
            onSuccess={() => {
              window.setTimeout(() => setFusionDismissed(true), 3500);
            }}
          />
        </div>
      ) : (
        <>
          <section className="device-map-section">
            <p className="device-section-title">Selecciona objetivo</p>
            <HotspotMinimap
              targets={boardTargets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={(id) => {
                setSelectedTargetId(id);
                setNodeGraphActive(false);
              }}
            />
          </section>

          <section className="device-action-section">
            {selectedTarget ? (
              <>
                <div className="device-target-row">
                  <span className="device-target-label">Objetivo</span>
                  <strong className="device-target-name">{selectedTarget.label}</strong>
                </div>

                {nodeGraphActive ? (
                  <NodeGraph
                    timerSeconds={15}
                    forcedGraphType={forcedGraphType}
                    onResult={handleNodeGraphResult}
                    onCancel={() => setNodeGraphActive(false)}
                  />
                ) : (
                  <button
                    type="button"
                    className="device-new-action-btn"
                    disabled={overlayActive || !!queuedForMe || queueStatus === "queuing"}
                    onClick={() => setNodeGraphActive(true)}
                  >
                    {queueStatus === "queuing"
                      ? "Cargando..."
                      : queuedForMe
                        ? "En cola..."
                        : overlayActive
                          ? "Pulso activo"
                          : "Nueva Accion →"}
                  </button>
                )}

                {statusMsg && <p className="device-status-msg">{statusMsg}</p>}
              </>
            ) : (
              <p className="device-action-hint">Toca un objetivo en el mapa para empezar</p>
            )}

            {queuedForMe && (
              <div className="device-queued-info">
                <span>En cola: {queuedForMe.card}</span>
                <span>→ {boardTargets.find((t) => t.id === queuedForMe.target)?.label || queuedForMe.target}</span>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
