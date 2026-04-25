import { useEffect, useRef, useState } from "react";
import { NewtonLogo } from "./newton";
import { LobbyRolePanel } from "./LobbyRolePanel.jsx";
import { getLobbyRoles } from "../data/roles.js";
import { getClaimForRole, getPlayerDisplayName } from "../services/lobbyService.js";
import changeButtonImage from "../../assets/Lobby/UI/Lobby_Button_Change.png";
import continueButtonImage from "../../assets/Lobby/UI/Lobby_Button_Continue.png";
import mouseHoldIcon from "../../assets/Lobby/UI/Icons/Mouse_Hold_icon.png";

const selectorImage = "/assets/Lobby/Selector.png";

export function LobbyStage({
  mode = "select",
  lobby,
  selectedRoleId,
  ownPlayer,
  selectedRole,
  status,
  countdownSeconds,
  isBusy,
  isTransitioning,
  holdCancelVersion = 0,
  nameDraft,
  onNameChange,
  onNameCommit,
  onSelectRole,
  onContinueHoldStart,
  onContinueHoldCancel,
  onContinueHoldComplete,
  onChangeRole,
}) {
  const roles = getLobbyRoles();
  const isWaiting = mode === "waiting";
  const title = isWaiting ? "Esperando jugadores..." : "Selecciona un rol";
  const ownDisplayName = getPlayerDisplayName(ownPlayer, lobby.players);
  const actionImage = isWaiting ? changeButtonImage : continueButtonImage;
  const actionLabel = isWaiting ? "Cambiar rol" : "Continuar";
  const isActionDisabled = isBusy || (!isWaiting && !selectedRoleId);
  const holdDurationMs = 1000;
  const [isHoldingAction, setIsHoldingAction] = useState(false);
  const holdTimerRef = useRef(null);
  const holdCompletedRef = useRef(false);
  const isHoldingActionRef = useRef(false);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function resetContinueHoldFeedback() {
    clearHoldTimer();
    holdCompletedRef.current = false;
    isHoldingActionRef.current = false;
    setIsHoldingAction(false);
  }

  useEffect(() => {
    function preventLobbyZoom(event) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    }

    function preventLobbyZoomKeys(event) {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (["+", "=", "-", "_", "0"].includes(event.key)) {
        event.preventDefault();
      }
    }

    window.addEventListener("wheel", preventLobbyZoom, { passive: false });
    window.addEventListener("keydown", preventLobbyZoomKeys);

    return () => {
      window.removeEventListener("wheel", preventLobbyZoom);
      window.removeEventListener("keydown", preventLobbyZoomKeys);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearHoldTimer();
      holdCompletedRef.current = false;
      isHoldingActionRef.current = false;
    };
  }, []);

  useEffect(() => {
    resetContinueHoldFeedback();
  }, [holdCancelVersion]);

  function startContinueHold(event) {
    if (isWaiting || isActionDisabled || event.button !== 0 || isHoldingAction) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    holdCompletedRef.current = false;
    isHoldingActionRef.current = true;
    setIsHoldingAction(true);
    onContinueHoldStart?.();

    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      holdCompletedRef.current = true;
      isHoldingActionRef.current = false;
      setIsHoldingAction(false);
      onContinueHoldComplete?.();
    }, holdDurationMs);
  }

  function cancelContinueHold() {
    if (!isHoldingActionRef.current || holdCompletedRef.current) {
      return;
    }

    clearHoldTimer();
    holdCompletedRef.current = false;
    isHoldingActionRef.current = false;
    setIsHoldingAction(false);
    onContinueHoldCancel?.();
  }

  function handleActionClick(event) {
    if (isWaiting) {
      onChangeRole?.();
      return;
    }

    event.preventDefault();
  }

  return (
    <main className={`react-screen lobby-screen ${isWaiting ? "lobby-screen-waiting" : "lobby-screen-select"} ${isTransitioning ? "lobby-transitioning" : ""}`}>
      <header className="lobby-banner">
        <h1>{title}</h1>
      </header>

      <LobbyRolePanel
        role={selectedRole}
        nameDraft={nameDraft}
        actionSlot={(
          <div className="lobby-panel-action-area">
            {countdownSeconds !== null && (
              <strong className="lobby-countdown">Entrando en {countdownSeconds}</strong>
            )}
            {!isWaiting && (
              <div className="lobby-hold-hint" aria-hidden="true">
                <span>Manten</span>
                <img src={mouseHoldIcon} alt="" draggable="false" />
                <span>para confirmar</span>
              </div>
            )}
            <button
              className={`lobby-image-action-button ${isHoldingAction ? "is-holding" : ""}`}
              type="button"
              onPointerDown={startContinueHold}
              onPointerUp={cancelContinueHold}
              onPointerCancel={cancelContinueHold}
              onClick={handleActionClick}
              disabled={isActionDisabled}
              aria-label={actionLabel}
              style={{ "--lobby-hold-duration": `${holdDurationMs}ms` }}
            >
              <img src={actionImage} alt="" aria-hidden="true" draggable="false" />
            </button>
          </div>
        )}
        onNameChange={onNameChange}
        onNameCommit={onNameCommit}
      />

      <section className="lobby-character-row" aria-label="Personajes disponibles">
        {roles.map((role) => {
          const claim = getClaimForRole(lobby, role.id);
          const isOwnPreview = selectedRoleId === role.id;
          const isSelected = Boolean(claim || isOwnPreview);
          const showSelector = isOwnPreview;
          const playerForClaim = claim?.clientId ? lobby.players[claim.clientId] : null;
          const labelName = claim?.name || getPlayerDisplayName(playerForClaim, lobby.players);

          return (
            <button
              key={role.id}
              className={`lobby-character lobby-character-${role.id} ${isOwnPreview ? "previewed" : ""} ${claim ? "claimed" : ""}`}
              type="button"
              onClick={() => onSelectRole?.(role.id)}
            >
              {showSelector && <img className="lobby-selector" src={selectorImage} alt="" aria-hidden="true" draggable="false" />}
              <img className="lobby-character-image" src={isSelected ? role.lobby.selectedImage : role.lobby.idleImage} alt={role.label} draggable="false" />
              <span className="lobby-character-meta">
                {claim ? (
                  <>
                    <strong>{role.label}</strong>
                    <span className="lobby-character-player">{labelName}</span>
                    <em>Listo</em>
                  </>
                ) : isOwnPreview && !isWaiting ? (
                  <>
                    <strong>{role.label}</strong>
                    <span className="lobby-character-player">{ownDisplayName}</span>
                    <em>Seleccionando...</em>
                  </>
                ) : (
                  <>
                    <strong>{role.label}</strong>
                    <em>Disponible</em>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </section>

      <footer className="lobby-footer">
        <NewtonLogo compact />
        <div className="lobby-footer-action-area">
          {countdownSeconds !== null && (
            <strong className="lobby-countdown">Entrando en {countdownSeconds}</strong>
          )}
          {!isWaiting && (
            <div className="lobby-hold-hint" aria-hidden="true">
              <span>Mantén</span>
              <img src={mouseHoldIcon} alt="" draggable="false" />
              <span>para confirmar</span>
            </div>
          )}
          <button
            className={`lobby-image-action-button ${isHoldingAction ? "is-holding" : ""}`}
            type="button"
            onPointerDown={startContinueHold}
            onPointerUp={cancelContinueHold}
            onPointerCancel={cancelContinueHold}
            onClick={handleActionClick}
            disabled={isActionDisabled}
            aria-label={actionLabel}
            style={{ "--lobby-hold-duration": `${holdDurationMs}ms` }}
          >
            <img src={actionImage} alt="" aria-hidden="true" draggable="false" />
          </button>
        </div>
      </footer>

      <p className="lobby-status-debug" role="status" aria-live="polite">{status}</p>
    </main>
  );
}
