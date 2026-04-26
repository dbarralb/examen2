import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NBadge, NCard, NProgress, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueueOverlay } from "../components/ActionQueueOverlay.jsx";
import { PlayerActionCard } from "../components/PlayerActionCard.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { createSoftwareLoadMinigame } from "../components/SoftwareLoadMinigame.jsx";
import { cards, getCard, getContainerOpenState, getTargetStateLabel, objectImages, targets } from "../data/gameData.js";
import { getEcosForRoom, getRoom, getZone } from "../data/roomData.js";
import { saveEcoToCodex } from "../services/codexService.js";
import { saveHorusDecision } from "../services/sessionService.js";
import { ItemModal } from "../components/ItemModal.jsx";
import { PlayerInventoryBar } from "../components/PlayerInventoryBar.jsx";
import { getRole } from "../data/roles.js";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { getRemoteState } from "../services/gmService.js";
import { createInitialGameState, createInitialTargetFeedback, getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { getSession, hasValidStoredSessionCode } from "../services/sessionAccess.js";
import { createPendingAction, enqueueLoadedAction, findQueuedActionForCurrentPlayer, incrementCardUsage, markItemSeen, pickUpItem, sendPlayerChatMessage, setPendingItemUsage, updatePlayerView } from "../services/playerService.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { targetItems } from "../data/gameData.js";

const SOFTWARE_LOAD_DIRECTIONS = ["up", "down", "left", "right"];
const SUCCESS_CLOSE_DELAY_MS = 2000;
const PLAYER_VIEW_STALE_MS = 15000;
const SEARCHING_SLOT_TIME = 10; // seconds per slot before revealing content
const SLOT_STAGGER_MS = 800;    // ms between each slot's search start

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
  const [chatDraft, setChatDraft] = useState("");
  const [dropZoneState, setDropZoneState] = useState({ cardId: null, itemId: null, targetId: null });
  const [openedItem, setOpenedItem] = useState(null);
  const [playerInventory, setPlayerInventory] = useState([null, null, null]);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [revealedSlots, setRevealedSlots] = useState({}); // { [targetId]: number[] }
  const [ecoToast, setEcoToast] = useState(null);
  const revealedSlotsRef = useRef({});
  const prevEcoStateRef = useRef({});
  const searchTimersRef = useRef([]);
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
  const itemSeenState = remoteState?.itemSeenState || {};
  const cardUsage = remoteState?.cardUsage?.[role.id] || {};
  const sessionState = remoteState?.sessionState || {};
  const currentSalaId = sessionState.salaId || "sala1_el_cierre";
  const currentZoneId = sessionState.zoneId || "inicio";
  const currentRoom = getRoom(currentSalaId);
  const activeZone = getZone(currentSalaId, currentZoneId);
  const ecoState = remoteState?.ecoState || {};
  const remoteInventorySlots = remoteState?.playerInventories?.[role.id]?.slots;
  const queuedForPlayer = findQueuedActionForCurrentPlayer(queuedActions, role.id);
  const overlayActive = isResultOverlayActive(pulseState);
  const elapsedSeconds = getGameTimerElapsedSeconds(session.gameTimer);

  // Hórus decision: show 3 options in Z4 once the decision puzzle is solved
  const isHorusRoom = currentSalaId?.startsWith("horus_run_");
  const horusDecisionMade = sessionState.horusDecision != null;
  const puzzleState = remoteState?.puzzleState || {};
  const horusDecisionPuzzleSolved = isHorusRoom && currentZoneId === "z4" &&
    Object.entries(puzzleState).some(([id, p]) => id.startsWith("ph_") && id.endsWith("_decision") && p?.solved);
  const showHorusDecision = isHorusRoom && currentZoneId === "z4" && !horusDecisionMade && !isGmMonitorView;

  // null = not a container; true = open; false = closed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedContainerOpen = useMemo(
    () => (selectedTargetId ? getContainerOpenState(selectedTargetId, gameState) : null),
    // gameState ref changes every poll but getContainerOpenState only reads specific keys —
    // the returned boolean is stable unless the actual container state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTargetId, gameState.lockerState],
  );

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
            }
          }

          setRemoteState(state);
        }
      } catch (error) {
        // Error de red silencioso; el siguiente ciclo reintentara.
      }
    },
  });

  useEffect(() => {
    function handleDragEnd() { setIsDraggingItem(false); }
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.clearTimeout(successCloseTimerRef.current);
      window.clearTimeout(viewPublishTimerRef.current);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    if (remoteInventorySlots) {
      setPlayerInventory([
        remoteInventorySlots[0] || null,
        remoteInventorySlots[1] || null,
        remoteInventorySlots[2] || null,
      ]);
    }
  }, [remoteInventorySlots]);

  useEffect(() => {
    if (isGmMonitorView) return;
    const ecoDefs = getEcosForRoom(currentSalaId);
    const prev = prevEcoStateRef.current;
    for (const eco of ecoDefs) {
      if (ecoState[eco.id]?.discovered && !prev[eco.id]?.discovered) {
        setEcoToast(eco);
        saveEcoToCodex(eco.id, eco.text, eco.codexLevel || 1, currentSalaId);
        const timer = window.setTimeout(() => setEcoToast(null), 4000);
        prevEcoStateRef.current = { ...ecoState };
        return () => window.clearTimeout(timer);
      }
    }
    prevEcoStateRef.current = { ...ecoState };
  }, [ecoState, currentSalaId, isGmMonitorView]);

  useEffect(() => {
    searchTimersRef.current.forEach(clearTimeout);
    searchTimersRef.current = [];

    // Don't search if no card is open, or if the target is a closed container
    if (!selectedTargetId || selectedContainerOpen === false) return;

    const targetId = selectedTargetId;
    const alreadyRevealed = revealedSlotsRef.current[targetId] || [];

    for (let i = 0; i < 6; i++) {
      if (alreadyRevealed.includes(i)) continue;
      const delay = i * SLOT_STAGGER_MS + SEARCHING_SLOT_TIME * 1000;
      const timer = setTimeout(() => {
        revealedSlotsRef.current = {
          ...revealedSlotsRef.current,
          [targetId]: [...new Set([...(revealedSlotsRef.current[targetId] || []), i])],
        };
        setRevealedSlots({ ...revealedSlotsRef.current });
      }, delay);
      searchTimersRef.current.push(timer);
    }

    return () => {
      searchTimersRef.current.forEach(clearTimeout);
    };
  }, [selectedTargetId, selectedContainerOpen]);

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

    if (session.status !== "in_game" || overlayActive || !card || !card.roles.includes(role.id) || pendingAction || queuedForPlayer || (cardUsage[cardId] || 0) >= 3) {
      return;
    }

    const minigame = createSoftwareLoadMinigame(createSoftwareLoadSequence());
    setPendingAction({
      ...createPendingAction({ card, targetId, roleId: role.id, minigame }),
      targetStateSignature: getTargetStateSignature(targetId, gameState),
    });
    setSelectedTargetId(targetId);
  }

  function handleDropZoneDrop(event, targetId) {
    event.preventDefault();
    if (overlayActive || pendingAction || queuedForPlayer) return;

    const itemId = event.dataTransfer.getData("application/x-inv-item-id");
    const cardId = event.dataTransfer.getData("application/x-card-id") || selectedCardId;

    setDropZoneState((current) => ({
      targetId,
      cardId: cardId || current.cardId || null,
      itemId: itemId || current.itemId || null,
    }));
    setSelectedTargetId(targetId);
  }

  function handleLoadConfirm(targetId, cancel = false) {
    if (cancel) {
      setDropZoneState({ cardId: null, itemId: null, targetId: null });
      return;
    }

    const { cardId, itemId } = dropZoneState;
    setDropZoneState({ cardId: null, itemId: null, targetId: null });

    if (itemId && !cardId) {
      // Item-only load — record pending item usage and skip action card
      setPendingItemUsage(role.id, itemId, targetId).catch(() => {});
      return;
    }

    if (cardId) {
      if (itemId) {
        setPendingItemUsage(role.id, itemId, targetId).catch(() => {});
      }
      startLoad(cardId, targetId);
    }
  }

  async function handleHorusDecision(decision) {
    try {
      await saveHorusDecision(decision);
    } catch {
      // Error de red silencioso; el siguiente ciclo reintentará.
    }
  }

  function handleItemClick(item) {
    setOpenedItem(item);
    if (!itemSeenState[item.id]?.seen) {
      markItemSeen(item.id).catch(() => {});
    }
  }

  // TODO [DEUDA TÉCNICA]: Función debug solo para testeo. Eliminar antes de producción.
  async function handleDebugClearInventory() {
    setPlayerInventory([null, null, null]);
    const pickedUpResets = {};
    Object.values(targetItems).flat().forEach((item) => {
      if (item.type === "usable") pickedUpResets[`itemSeenState/${item.id}/pickedUp`] = null;
    });
    await firebasePatch("", {
      [`playerInventories/${role.id}/slots`]: [null, null, null],
      ...pickedUpResets,
    }).catch(() => {});
  }

  async function handleInventorySlotDrop(itemId, slotIndex) {
    const taken = playerInventory[slotIndex] !== null;
    if (taken) return;

    const optimistic = [...playerInventory];
    optimistic[slotIndex] = { itemId };
    setPlayerInventory(optimistic);

    try {
      await pickUpItem(role.id, itemId, slotIndex);
    } catch {
      setPlayerInventory(playerInventory);
    }
  }

  function cancelPendingAction() {
    if (pendingAction) {
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
  }

  async function completePendingMinigame() {
    const actionToQueue = pendingAction;

    if (!actionToQueue) {
      return;
    }

    try {
      await enqueueLoadedAction(actionToQueue);
      incrementCardUsage(role.id, actionToQueue.card, cardUsage[actionToQueue.card] || 0).catch(() => {});
      const state = await getRemoteState();
      setRemoteState(state);
      window.clearTimeout(successCloseTimerRef.current);
      successCloseTimerRef.current = window.setTimeout(() => {
        setPendingAction(null);
        setSelectedTargetId(null);
      }, SUCCESS_CLOSE_DELAY_MS);
    } catch (error) {
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
    } catch (error) {
      // Error de red silencioso.
    }
  }

  return (
    <main className={`react-screen react-player-screen react-player-functional ${isGmMonitorView ? "react-player-monitor-view" : ""}`}>
      <section className="player-scene-preview player-scene-live">
        {gameState.alarmState === "on" && <img className="react-alarm-overlay" src={objectImages.alarm.on} alt="Alarma activa" />}
        <div className="player-topbar">
          <NewtonLogo compact />
          <NBadge status={role.status}>{role.label}</NBadge>
          {activeZone && <NBadge status="info">{activeZone.label}</NBadge>}
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
          onCloseTarget={() => {
            setSelectedTargetId(null);
            setDropZoneState({ cardId: null, itemId: null, targetId: null });
          }}
          onDrop={handleDropZoneDrop}
          onCancelPendingAction={cancelPendingAction}
          onMinigameChange={updatePendingMinigame}
          onMinigameRetry={retryPendingMinigame}
          onMinigameSuccess={completePendingMinigame}
          isMonitorView={isGmMonitorView}
          externalCamera={effectiveCamera}
          onCameraChange={isGmMonitorView ? undefined : handleCameraChange}
          itemSeenState={itemSeenState}
          dropZoneState={isGmMonitorView ? {} : dropZoneState}
          onItemClick={isGmMonitorView ? undefined : handleItemClick}
          onItemDragStart={isGmMonitorView ? undefined : () => setIsDraggingItem(true)}
          onDropZoneDrop={isGmMonitorView ? undefined : handleDropZoneDrop}
          onLoadConfirm={isGmMonitorView ? undefined : handleLoadConfirm}
          revealedSlots={isGmMonitorView ? {} : revealedSlots}
          activeZone={activeZone}
        />
        {overlayActive && (
          <aside className="react-result-overlay">
            <strong>{pulseState.resultOverlay.message || "Accion resuelta."}</strong>
            <NProgress value={getOverlayProgress(pulseState)} label="Resultado de pulso" />
          </aside>
        )}
        {ecoToast && !isGmMonitorView && (
          <aside className="eco-toast" role="status" aria-live="polite">
            <span className="eco-toast-label">ECO</span>
            <span className="eco-toast-text">"{ecoToast.text}"</span>
          </aside>
        )}
        {showHorusDecision && (
          <aside className="horus-decision-panel">
            <h2>Hórus espera vuestra decisión</h2>
            <p>Elegid el camino. No hay vuelta atrás.</p>
            <div className="horus-decision-options">
              <button className="horus-decision-btn horus-integration" onClick={() => handleHorusDecision("integration")}>
                <strong>Integración</strong>
                <span>Unirse al sistema</span>
              </button>
              <button className="horus-decision-btn horus-rejection" onClick={() => handleHorusDecision("rejection")}>
                <strong>Rechazo</strong>
                <span>Rechazar el sistema</span>
              </button>
              <button className="horus-decision-btn horus-deception" onClick={() => handleHorusDecision("deception")}>
                <strong>Simulación</strong>
                <span>Engañar al sistema</span>
              </button>
            </div>
            {horusDecisionMade && <NBadge status="success">Decisión registrada: {sessionState.horusDecision}</NBadge>}
          </aside>
        )}
        {!isGmMonitorView && <div className="react-card-deck scene-action-deck" aria-label="Cartas de accion">
          {visibleCards.map((card) => {
            const isCharging = pendingAction?.card === card.id;
            const uses = cardUsage[card.id] || 0;
            const isExhausted = uses >= 3;
            return (
              <PlayerActionCard
                key={card.id}
                card={card}
                usageCount={uses}
                isSelected={selectedCardId === card.id}
                isCharging={isCharging}
                isExhausted={isExhausted}
                onSelect={isExhausted ? undefined : setSelectedCardId}
                onDragStart={(event, draggedCard, charging) => {
                  if (isCharging || isExhausted) {
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
        {!isGmMonitorView && <ActionQueueOverlay actions={queuedActions} pulseState={pulseState} />}
        {!isGmMonitorView && (
          <PlayerInventoryBar
            slots={playerInventory}
            seenState={itemSeenState}
            onItemClick={handleItemClick}
            onSlotDragStart={() => setIsDraggingItem(true)}
            onSlotDrop={handleInventorySlotDrop}
            onDebugClear={handleDebugClearInventory}
            isDraggingItem={isDraggingItem}
          />
        )}
        <ItemModal item={openedItem} onClose={() => setOpenedItem(null)} />
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
