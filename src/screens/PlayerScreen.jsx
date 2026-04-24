import { useEffect, useMemo, useState } from "react";
import { NBadge, NCard, NProgress, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { cards, getCard, objectImages, targets } from "../data/gameData.js";
import { getRole } from "../data/roles.js";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { getRemoteState } from "../services/gmService.js";
import { createInitialGameState, createInitialTargetFeedback, getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { getSession, hasValidStoredSessionCode } from "../services/sessionAccess.js";
import { createPendingAction, enqueueLoadedAction, findQueuedActionForCurrentPlayer, getPlayerName } from "../services/playerService.js";
import { updatePlayerName } from "../services/lobbyService.js";

function isResultOverlayActive(pulseState) {
  const overlay = pulseState?.resultOverlay;
  return Boolean(overlay?.visible && (!overlay.endsAt || overlay.endsAt > Date.now()));
}

function getOverlayProgress(pulseState) {
  const overlay = pulseState?.resultOverlay;

  if (!overlay?.startedAt || !overlay?.endsAt) {
    return 0;
  }

  return ((Date.now() - overlay.startedAt) / (overlay.endsAt - overlay.startedAt)) * 100;
}

export function PlayerScreen({ navigation, params }) {
  const role = getRole(params.get("role") || "empollon");
  const visibleCards = useMemo(() => cards.filter((card) => card.roles.includes(role.id)), [role.id]);
  const [remoteState, setRemoteState] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState("Conectando con Firebase...");
  const [nameDraft, setNameDraft] = useState(() => getPlayerName());

  const session = remoteState?.session || {};
  const gameState = { ...createInitialGameState(), ...(remoteState?.gameState || {}) };
  const targetFeedback = { ...createInitialTargetFeedback(), ...(remoteState?.targetFeedback || {}) };
  const pulseState = remoteState?.pulseState || {};
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 5), [remoteState]);
  const queuedForPlayer = findQueuedActionForCurrentPlayer(queuedActions, role.id);
  const overlayActive = isResultOverlayActive(pulseState);
  const elapsedSeconds = getGameTimerElapsedSeconds(session.gameTimer);

  usePollingRefresh({
    intervalMs: 1000,
    task: async ({ isCancelled }) => {
      try {
        const sessionState = await getSession();

        if (isCancelled()) {
          return;
        }

        if (!hasValidStoredSessionCode(sessionState)) {
          navigation.go("access");
          return;
        }

        if (sessionState.status !== "in_game") {
          navigation.go("access");
          return;
        }

        const state = await getRemoteState();

        if (!isCancelled()) {
          setRemoteState(state);
          setStatus("Sincronizado.");
        }
      } catch (error) {
        if (!isCancelled()) {
          setStatus("No se pudo refrescar Firebase.");
        }
      }
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 150);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pendingAction) {
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const action = await enqueueLoadedAction(pendingAction);
        setPendingAction(null);
        setStatus(`${formatCardLabel(action)} queda lista para el siguiente pulso.`);
        const state = await getRemoteState();
        setRemoteState(state);
      } catch (error) {
        setPendingAction(null);
        setStatus("No se pudo encolar la accion. Reintenta cuando vuelva Firebase.");
      }
    }, Math.max(0, pendingAction.endsAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [pendingAction]);

  function startLoad(cardId, targetId) {
    const card = getCard(cardId);

    if (session.status !== "in_game") {
      setStatus("La partida no esta en curso.");
      return;
    }

    if (overlayActive) {
      setStatus("Espera a que termine la notificacion del pulso.");
      return;
    }

    if (!card || !card.roles.includes(role.id)) {
      setStatus("Esa carta no pertenece a tu rol.");
      return;
    }

    if (pendingAction) {
      setStatus("Ya hay una accion cargandose.");
      return;
    }

    if (queuedForPlayer) {
      setStatus("Ya tienes una accion esperando este pulso.");
      return;
    }

    setPendingAction(createPendingAction({ card, targetId, roleId: role.id }));
    setStatus(`${formatCardLabel(card)} cargando sobre ${targets.find((target) => target.id === targetId)?.label || targetId}.`);
  }

  function handleDrop(event, targetId) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("application/x-card-id") || selectedCardId;
    startLoad(cardId, targetId);
  }

  function cancelPendingAction() {
    if (pendingAction) {
      setStatus(`${formatCardLabel(pendingAction)} cancelada antes de entrar en cola.`);
      setPendingAction(null);
    }
  }

  async function handleNameCommit() {
    try {
      await updatePlayerName(nameDraft);
      setStatus("Nombre actualizado.");
    } catch (error) {
      setStatus("No se pudo guardar el nombre.");
    }
  }

  const pendingProgress = pendingAction ? ((now - pendingAction.loadStartedAt) / pendingAction.durationMs) * 100 : 0;

  return (
    <main className="react-screen react-player-screen react-player-functional">
      <section className="player-scene-preview player-scene-live">
        {gameState.alarmState === "on" && <img className="react-alarm-overlay" src={objectImages.alarm.on} alt="Alarma activa" />}
        <div className="player-topbar">
          <NewtonLogo compact />
          <NBadge status={role.status}>{role.label}</NBadge>
          <NTimer seconds={elapsedSeconds} />
        </div>
        <SceneMap
          gameState={gameState}
          targetFeedback={targetFeedback}
          selectedTargetId={selectedTargetId}
          pendingAction={pendingAction}
          queuedForPlayer={queuedForPlayer}
          overlayActive={overlayActive}
          pendingProgress={pendingProgress}
          onSelectTarget={setSelectedTargetId}
          onCloseTarget={() => setSelectedTargetId(null)}
          onDrop={handleDrop}
          onCancelPendingAction={cancelPendingAction}
        />
        {overlayActive && (
          <aside className="react-result-overlay">
            <strong>{pulseState.resultOverlay.message || "Accion resuelta."}</strong>
            <NProgress value={getOverlayProgress(pulseState)} label="Resultado de pulso" />
          </aside>
        )}
        <div className="react-card-deck scene-action-deck" aria-label="Cartas de accion">
          {visibleCards.map((card) => (
            <button
              key={card.id}
              className={`react-action-card ${selectedCardId === card.id ? "selected" : ""}`}
              type="button"
              draggable
              onClick={() => setSelectedCardId(card.id)}
              onDragStart={(event) => {
                setSelectedCardId(card.id);
                event.dataTransfer.setData("application/x-card-id", card.id);
                event.dataTransfer.effectAllowed = "copy";
              }}
            >
              <img src={card.image} alt={card.label} />
            </button>
          ))}
        </div>
      </section>
      <aside className="player-hud-panel">
        <NCard title={`Dispositivo: ${role.label}`} glow>
          <label className="player-name-editor" htmlFor="player-name-in-game">
            <span>Jugador</span>
            <input
              id="player-name-in-game"
              value={nameDraft}
              maxLength={24}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={handleNameCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </label>
          <p>{role.text}</p>
          <p className="react-status" role="status" aria-live="polite">{status}</p>
        </NCard>
        <NCard title="Cola" className="player-side-card">
          <ActionQueuePanel
            pulseState={pulseState}
            queuedActions={queuedActions}
            emptyMessage="No hay acciones esperando pulso."
            ariaLabel="Cola de acciones"
            compactChips
          />
        </NCard>
        <NCard title="Historial" className="player-side-card">
          <div className="react-list">
            {actionLog.map((message, index) => (
              <article key={`${message}-${index}`} className="react-list-item">
                <span>{message}</span>
              </article>
            ))}
          </div>
        </NCard>
      </aside>
    </main>
  );
}
