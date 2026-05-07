import { useEffect, useMemo, useRef, useState } from "react";
import { firebaseGet, firebasePatch } from "../services/firebaseClient.js";
import { applyScenarioHotspotOverrides, getScenarioHotspots } from "../data/scenarioContent.js";
import { DEFAULT_SCENARIO_ID } from "../data/scenarioData.js";
import { cards } from "../data/gameData.js";
import { ACTION_KINDS } from "../data/actionTypes.js";
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
import { NetworkCanvas } from "../components/NetworkCanvas.jsx";

function getActionKindLabel(actionKind) {
  if (actionKind === ACTION_KINDS.INSPECTION) return "Inspeccion";
  if (actionKind === ACTION_KINDS.INTERACTION) return "Interaccion";
  return "Accion";
}

async function getDeviceState(roleId) {
  const [
    session,
    gameState,
    pulseState,
    queuedActions,
    playerBoard,
    hotspotOverrides,
    fusionSession,
  ] = await Promise.all([
    firebaseGet("session"),
    firebaseGet("gameState"),
    firebaseGet("pulseState"),
    firebaseGet("queuedActions"),
    firebaseGet(`playerBoards/${roleId}`),
    firebaseGet("hotspotOverrides"),
    firebaseGet("fusionSession"),
  ]);
  return { session, gameState, pulseState, queuedActions, playerBoard, hotspotOverrides, fusionSession };
}


export function DeviceScreen({ params }) {
  const roleIdParam = params.get("role") || "empollon";
  const codeParam = params.get("code") || "";
  const role = getRole(roleIdParam);

  const [authState, setAuthState] = useState("checking"); // "checking" | "enter_code" | "ready"
  const [codeInput, setCodeInput] = useState(codeParam);
  const [codeError, setCodeError] = useState("");
  const [remoteState, setRemoteState] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null); // { hotspotId, portType }
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
  const sharedResonance = gameState.sharedResonance || gameState.resonanceByVariant?.[boardVariant] || gameState.resonance || { value: 0, spent: 0, discoveries: {} };
  const variantResonance = sharedResonance;
  const resonanceValue = Number(sharedResonance.value || 0);
  const overlayActive = pulseState.status === "executing";
  const fusionSession = remoteState?.fusionSession || null;

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

  const queuedForMe = queuedActions.find(
    (a) => a.role === role.id && ["queued", "executing"].includes(a.status || "queued"),
  );

  const fusionActive = fusionSession?.status === "pending"
    && (boardVariant === "A" || boardVariant === "B")
    && !fusionDismissed;

  async function handlePortSelect(hotspotId, portType) {
    if (overlayActive || !!queuedForMe || queueStatus === "queuing") return;

    if (resonanceValue < 1) {
      setStatusMsg("Sin resonancia. Recoge bolas de resonancia en la pantalla del jugador.");
      return;
    }

    setQueueStatus("queuing");
    setStatusMsg("");
    try {
      await firebasePatch("", {
        "gameState/sharedResonance/value": resonanceValue - 1,
        "gameState/sharedResonance/spent": (Number(sharedResonance.spent) || 0) + 1,
      });
      setSelectedPort({ hotspotId, portType });
      setNodeGraphActive(true);
    } catch {
      setStatusMsg("Error al conectarse al puerto. Reintenta.");
    } finally {
      setQueueStatus("idle");
    }
  }

  async function handleNodeGraphResult({ charge, success }) {
    setNodeGraphActive(false);

    if (!success) {
      setStatusMsg("Conexion fallida. La resonancia fue consumida.");
      setSelectedPort(null);
      return;
    }

    const targetId = selectedPort?.hotspotId;
    const portType = selectedPort?.portType;
    const actionKind = portType === "PORT_INFO" ? ACTION_KINDS.INSPECTION : ACTION_KINDS.INTERACTION;
    const card = cards.find((c) => c.roles.includes(role.id) && c.actionKind === actionKind);
    if (!card || !targetId) { setSelectedPort(null); return; }

    setQueueStatus("queuing");
    setStatusMsg("");
    try {
      const pending = createPendingAction({
        card,
        targetId,
        roleId: role.id,
        scenarioId: boardScenarioId,
        variant: boardVariant,
        charge,
      });
      await enqueueLoadedAction(pending);
      incrementCardUsage(role.id, card.id, 0).catch(() => {});
      setQueueStatus("done");
      setStatusMsg(`Chip creado. Carga: ${charge}. ${getActionKindLabel(actionKind)}. El pulso resolvera la accion.`);
    } catch {
      setQueueStatus("error");
      setStatusMsg("No se pudo encolar. Reintenta.");
    } finally {
      setSelectedPort(null);
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
      ) : nodeGraphActive ? (
        <>
          <p className="device-graph-copy">Conecta START con la salida. Los nodos que toques determinan la carga del chip.</p>
          <NodeGraph
            timerSeconds={10}
            onResult={handleNodeGraphResult}
            onCancel={() => {
              setNodeGraphActive(false);
              setSelectedPort(null);
              setStatusMsg("Conexion cancelada. La resonancia fue consumida.");
            }}
          />
        </>
      ) : (
        <>
          <NetworkCanvas
            targets={boardTargets}
            selectedHotspotId={selectedPort?.hotspotId || null}
            onPortSelect={handlePortSelect}
            blocked={overlayActive || !!queuedForMe || queueStatus === "queuing"}
          />
          {queuedForMe && (
            <div className="device-queued-info">
              <span>En cola: {queuedForMe.card}</span>
              <span>→ {boardTargets.find((t) => t.id === queuedForMe.target)?.label || queuedForMe.target}</span>
            </div>
          )}
          {statusMsg && <p className="device-status-msg">{statusMsg}</p>}
        </>
      )}
    </main>
  );
}
