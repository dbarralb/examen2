import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NBadge, NCard, NProgress, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueueOverlay } from "../components/ActionQueueOverlay.jsx";
import { PlayerActionCard } from "../components/PlayerActionCard.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { createSoftwareLoadMinigame } from "../components/SoftwareLoadMinigame.jsx";
import { cards, getCard, getTargetStateLabel, objectImages, targets } from "../data/gameData.js";
import { getRole } from "../data/roles.js";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { getRemoteState } from "../services/gmService.js";
import { createInitialGameState, createInitialTargetFeedback, getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { getSession, hasValidStoredSessionCode } from "../services/sessionAccess.js";
import { createPendingAction, enqueueLoadedAction, findQueuedActionForCurrentPlayer, getPlayerName, sendPlayerChatMessage, updatePlayerView } from "../services/playerService.js";
import { updatePlayerName } from "../services/lobbyService.js";

const SOFTWARE_LOAD_DIRECTIONS = ["up", "down", "left", "right"];
const SUCCESS_CLOSE_DELAY_MS = 2000;
const PLAYER_VIEW_STALE_MS = 15000;

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

function getTargetStateSignature(targetId, gameState) {
  const target = targets.find((item) => item.id === targetId);

  if (!target) {
    return "";
  }

  return getTargetStateLabel(target, gameState);
}

export function PlayerScreen({ navigation, params }) {
  const role = getRole(params.get("role") || "empollon");
  const isGmMonitorView = params.get("view") === "gm-monitor";
  const visibleCards = useMemo(() => cards.filter((card) => card.roles.includes(role.id)), [role.id]);
  const [remoteState, setRemoteState] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [status, setStatus] = useState("Conectando con Firebase...");
  const [nameDraft, setNameDraft] = useState(() => getPlayerName());
  const [chatDraft, setChatDraft] = useState("");
  const successCloseTimerRef = useRef(null);
  const chatListRef = useRef(null);
  const latestCameraRef = useRef(null);
  const viewPublishTimerRef = useRef(null);

  const session = remoteState?.session || {};
  const gameState = { ...createInitialGameState(), ...(remoteState?.gameState || {}) };
  const targetFeedback = { ...createInitialTargetFeedback(), ...(remoteState?.targetFeedback || {}) };
  const pulseState = remoteState?.pulseState || {};
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 5), [remoteState]);
  const chatMessages = useMemo(() => normalizeRemoteList(remoteState?.chatMessages).slice(-18), [remoteState]);
  const lastRoleAction = remoteState?.lastRoleActions?.[role.id];
  const mirroredView = isGmMonitorView ? remoteState?.playerViews?.[role.id] : null;
  const isMirrorFresh = Boolean(mirroredView?.updatedAt && Date.now() - mirroredView.updatedAt < PLAYER_VIEW_STALE_MS);
  const effectiveSelectedTargetId = isGmMonitorView ? (isMirrorFresh ? mirroredView.selectedTargetId : null) : selectedTargetId;
  const effectivePendingAction = isGmMonitorView ? (isMirrorFresh ? mirroredView.pendingAction : null) : pendingAction;
  const effectiveCamera = isGmMonitorView && isMirrorFresh ? mirroredView.camera : null;
  const queuedForPlayer = findQueuedActionForCurrentPlayer(queuedActions, role.id);
  const overlayActive = isResultOverlayActive(pulseState);
  const elapsedSeconds = getGameTimerElapsedSeconds(session.gameTimer);

  usePollingRefresh({
    intervalMs: 1000,
    task: async ({ isCancelled }) => {
      try {
        if (!isGmMonitorView) {
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
        }

        const state = await getRemoteState();

        if (!isCancelled()) {
          let cancelledRemoteLoad = false;

          if (pendingAction) {
            const nextGameState = { ...createInitialGameState(), ...(state?.gameState || {}) };
            const nextSignature = getTargetStateSignature(pendingAction.target, nextGameState);

            if (pendingAction.targetStateSignature && nextSignature !== pendingAction.targetStateSignature) {
              cancelledRemoteLoad = true;
              setPendingAction(null);
              setSelectedTargetId(pendingAction.target);
              setStatus("Carga cancelada: el objeto cambio de estado remoto.");
            }
          }

          setRemoteState(state);
          if (!pendingAction && !cancelledRemoteLoad) {
            setStatus("Sincronizado.");
          }
        }
      } catch (error) {
        if (!isCancelled()) {
          setStatus("No se pudo refrescar Firebase.");
        }
      }
    },
  });

  useEffect(() => () => {
    window.clearTimeout(successCloseTimerRef.current);
    window.clearTimeout(viewPublishTimerRef.current);
  }, []);

  useEffect(() => {
    const chatList = chatListRef.current;

    if (chatList) {
      chatList.scrollTop = chatList.scrollHeight;
    }
  }, [chatMessages]);

  function createSoftwareLoadSequence() {
    return Array.from({ length: 10 }, () => SOFTWARE_LOAD_DIRECTIONS[Math.floor(Math.random() * SOFTWARE_LOAD_DIRECTIONS.length)]);
  }

  function queuePlayerViewPublish() {
    if (isGmMonitorView) {
      return;
    }

    window.clearTimeout(viewPublishTimerRef.current);
    viewPublishTimerRef.current = window.setTimeout(async () => {
      try {
        await updatePlayerView(role, {
          selectedTargetId,
          selectedCardId,
          camera: latestCameraRef.current,
          pendingAction,
        });
      } catch (error) {
        // La vista espejo es telemetria de GM; no debe bloquear al jugador.
      }
    }, 120);
  }

  const handleCameraChange = useCallback((nextCamera) => {
    latestCameraRef.current = nextCamera;
    queuePlayerViewPublish();
  }, [isGmMonitorView, pendingAction, role, selectedCardId, selectedTargetId]);

  useEffect(() => {
    queuePlayerViewPublish();
  }, [selectedTargetId, selectedCardId, pendingAction?.id, pendingAction?.target, pendingAction?.card, pendingAction?.status, pendingAction?.minigame?.status, pendingAction?.minigame?.result]);

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

    const minigame = createSoftwareLoadMinigame(createSoftwareLoadSequence());
    setPendingAction({
      ...createPendingAction({ card, targetId, roleId: role.id, minigame }),
      targetStateSignature: getTargetStateSignature(targetId, gameState),
    });
    setSelectedTargetId(targetId);
    setStatus(`${formatCardLabel(card)} cargando software sobre ${targets.find((target) => target.id === targetId)?.label || targetId}.`);
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

  function updatePendingMinigame(nextMinigame) {
    setPendingAction((current) => current ? { ...current, minigame: nextMinigame } : current);
  }

  function retryPendingMinigame() {
    setPendingAction((current) => {
      if (!current?.minigame) {
        return current;
      }

      return {
        ...current,
        minigame: createSoftwareLoadMinigame(current.minigame.sequence),
      };
    });
    setStatus("Reintentando carga de software.");
  }

  async function completePendingMinigame() {
    const actionToQueue = pendingAction;

    if (!actionToQueue) {
      return;
    }

    try {
      const action = await enqueueLoadedAction(actionToQueue);
      setStatus(`${formatCardLabel(action)} queda lista para el siguiente pulso.`);
      const state = await getRemoteState();
      setRemoteState(state);
      window.clearTimeout(successCloseTimerRef.current);
      successCloseTimerRef.current = window.setTimeout(() => {
        setPendingAction(null);
        setSelectedTargetId(null);
      }, SUCCESS_CLOSE_DELAY_MS);
    } catch (error) {
      setStatus("No se pudo encolar la accion. Reintenta cuando vuelva Firebase.");
      setPendingAction((current) => {
        if (!current?.minigame) {
          return current;
        }

        return {
          ...current,
          minigame: {
            ...current.minigame,
            status: "failed",
            result: "failed",
          },
        };
      });
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

  async function handleChatSubmit(event) {
    event.preventDefault();

    try {
      const message = await sendPlayerChatMessage(role, chatDraft);

      if (!message) {
        return;
      }

      setChatDraft("");
      setRemoteState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          chatMessages: {
            ...(current.chatMessages || {}),
            [message.id]: message,
          },
        };
      });
      setStatus("Mensaje enviado.");
    } catch (error) {
      setStatus("No se pudo enviar el mensaje.");
    }
  }

  return (
    <main className={`react-screen react-player-screen react-player-functional ${isGmMonitorView ? "react-player-monitor-view" : ""}`}>
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
          selectedTargetId={effectiveSelectedTargetId}
          pendingAction={effectivePendingAction}
          queuedForPlayer={queuedForPlayer}
          overlayActive={overlayActive}
          onSelectTarget={setSelectedTargetId}
          onCloseTarget={() => setSelectedTargetId(null)}
          onDrop={handleDrop}
          onCancelPendingAction={cancelPendingAction}
          onMinigameChange={updatePendingMinigame}
          onMinigameRetry={retryPendingMinigame}
          onMinigameSuccess={completePendingMinigame}
          isMonitorView={isGmMonitorView}
          externalCamera={effectiveCamera}
          onCameraChange={isGmMonitorView ? undefined : handleCameraChange}
        />
        {overlayActive && (
          <aside className="react-result-overlay">
            <strong>{pulseState.resultOverlay.message || "Accion resuelta."}</strong>
            <NProgress value={getOverlayProgress(pulseState)} label="Resultado de pulso" />
          </aside>
        )}
        {!isGmMonitorView && <div className="react-card-deck scene-action-deck" aria-label="Cartas de accion">
          {visibleCards.map((card) => {
            const isCharging = pendingAction?.card === card.id;
            return (
              <PlayerActionCard
                key={card.id}
                card={card}
                isSelected={selectedCardId === card.id}
                isCharging={isCharging}
                onSelect={setSelectedCardId}
                onDragStart={(event, draggedCard, charging) => {
                  if (isCharging) {
                    event.preventDefault();
                    return;
                  }

                  setSelectedCardId(draggedCard.id);
                  event.dataTransfer.setData("application/x-card-id", draggedCard.id);
                  event.dataTransfer.effectAllowed = "copy";
                }}
              />
            );
          })}
        </div>}
        {!isGmMonitorView && <ActionQueueOverlay actions={queuedActions} />}
        {isGmMonitorView && (
          <aside className="player-monitor-action-strip">
            <strong>{role.label}</strong>
            <span>
              {isMirrorFresh && mirroredView?.selectedTargetId
                ? `Viendo ${targets.find((target) => target.id === mirroredView.selectedTargetId)?.label || mirroredView.selectedTargetId}`
                : lastRoleAction
                  ? `${formatCardLabel(lastRoleAction)} -> ${targets.find((target) => target.id === lastRoleAction.target)?.label || lastRoleAction.target}`
                  : "Sin accion registrada."}
            </span>
          </aside>
        )}
      </section>
      {!isGmMonitorView && <aside className="player-hud-panel">
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
        <NCard title="Historial" className="player-side-card">
          <div className="react-list">
            {actionLog.map((message, index) => (
              <article key={`${message}-${index}`} className="react-list-item">
                <span>{message}</span>
              </article>
            ))}
          </div>
        </NCard>
        <NCard title="Chat" className="player-side-card player-chat-card">
          <div ref={chatListRef} className="react-chat-list" aria-label="Mensajes de chat">
            {chatMessages.length === 0 ? (
              <p>Sin mensajes todavia.</p>
            ) : (
              chatMessages.map((message) => (
                <article key={message.id || `${message.author}-${message.createdAt}`} className={`react-chat-message role-${message.role || "event"}`}>
                  <strong>{message.author || "Sistema"}</strong>
                  <span>{message.text}</span>
                </article>
              ))
            )}
          </div>
          <form className="react-chat-form" onSubmit={handleChatSubmit}>
            <input
              value={chatDraft}
              maxLength={120}
              placeholder="Mensaje..."
              aria-label="Mensaje de chat"
              onChange={(event) => setChatDraft(event.target.value)}
            />
            <button type="submit" disabled={!chatDraft.trim()}>Enviar</button>
          </form>
        </NCard>
      </aside>}
    </main>
  );
}
