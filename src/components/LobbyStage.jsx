import { useEffect, useRef, useState } from "react";
import { E2Logo } from "./e2";
import { LobbyRolePanel } from "./LobbyRolePanel.jsx";
import { getLobbyRoles } from "../data/roles.js";
import { getClaimForRole, getPlayerDisplayName, getPreviewingPlayer } from "../services/lobbyService.js";

function getRolePanelState({ claim, isOwnPreview, isWaiting, previewingPlayer }) {
  if (claim) {
    return {
      label: isWaiting ? "listo" : "reservado",
      className: "claimed",
    };
  }

  if (isOwnPreview) {
    return {
      label: isWaiting ? "tu rol" : "seleccionando",
      className: "previewed",
    };
  }

  if (previewingPlayer) {
    return {
      label: "seleccionando",
      className: "other-previewing",
    };
  }

  return {
    label: "disponible",
    className: "available",
  };
}

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
  const title = isWaiting ? "Awaiting squad" : "Select operator";
  const subtitle = isWaiting ? "all operators must lock profile before breach" : "preview role, set name, hold to lock";
  const actionLabel = isWaiting ? "Cambiar rol" : "Mantener para confirmar";
  const isActionDisabled = isBusy || (!isWaiting && !selectedRoleId);
  const holdDurationMs = 1000;
  const ownDisplayName = getPlayerDisplayName(ownPlayer, lobby.players);
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
    <main className={`react-screen lobby-screen e2-screen ${isWaiting ? "lobby-screen-waiting" : "lobby-screen-select"} ${isTransitioning ? "lobby-transitioning" : ""}`}>
      <header className="lobby-command-bar">
        <E2Logo />
        <div className="lobby-title-block">
          <span>// lobby node</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="lobby-command-status" aria-live="polite">
          {countdownSeconds !== null ? (
            <>
              <span>launch</span>
              <strong>{countdownSeconds}s</strong>
            </>
          ) : (
            <>
              <span>sync</span>
              <strong>{isWaiting ? "armed" : "online"}</strong>
            </>
          )}
        </div>
      </header>

      <section className="lobby-layout">
        <LobbyRolePanel
          role={selectedRole}
          nameDraft={nameDraft}
          actionSlot={(
            <div className="lobby-panel-action-area">
              {!isWaiting && (
                <div className="lobby-hold-hint" aria-hidden="true">
                  <span>[hold]</span>
                  <span>1000ms lock window</span>
                </div>
              )}
              {countdownSeconds !== null && (
                <strong className="lobby-countdown">Entrando en {countdownSeconds}</strong>
              )}
              <button
                className={`lobby-action-button ${isHoldingAction ? "is-holding" : ""}`}
                type="button"
                onPointerDown={startContinueHold}
                onPointerUp={cancelContinueHold}
                onPointerLeave={cancelContinueHold}
                onPointerCancel={cancelContinueHold}
                onClick={handleActionClick}
                disabled={isActionDisabled}
                style={{ "--lobby-hold-duration": `${holdDurationMs}ms` }}
              >
                <span>{actionLabel}</span>
              </button>
            </div>
          )}
          onNameChange={onNameChange}
          onNameCommit={onNameCommit}
        />

        <section className="lobby-role-grid" aria-label="Personajes disponibles">
          {roles.map((role) => {
            const claim = getClaimForRole(lobby, role.id);
            const isOwnPreview = selectedRoleId === role.id;
            const previewingPlayer = !claim ? getPreviewingPlayer(lobby, role.id) : null;
            const playerForClaim = claim?.clientId ? lobby.players[claim.clientId] : null;
            const labelName = claim?.name || getPlayerDisplayName(playerForClaim, lobby.players);
            const previewName = previewingPlayer ? getPlayerDisplayName(previewingPlayer, lobby.players) : null;
            const state = getRolePanelState({ claim, isOwnPreview, isWaiting, previewingPlayer });
            const playerName = claim ? labelName : isOwnPreview ? ownDisplayName : previewName;

            return (
              <button
                key={role.id}
                className={`lobby-role-card role-${role.id} ${state.className} ${isOwnPreview ? "selected" : ""}`}
                type="button"
                onClick={() => onSelectRole?.(role.id)}
                aria-pressed={isOwnPreview}
              >
                <span className="lobby-role-card-index">{role.id.slice(0, 2)}</span>
                <span className="lobby-role-card-status">{state.label}</span>
                <strong>{role.label}</strong>
                <span className="lobby-role-card-kicker">{role.kicker}</span>
                <span className="lobby-role-card-cards">{role.cards}</span>
                <span className="lobby-role-card-player">
                  {playerName || (state.className === "available" ? "sin operador" : "resolviendo...")}
                </span>
              </button>
            );
          })}
        </section>
      </section>

      <footer className="lobby-system-log">
        <span aria-hidden="true">&gt;</span>
        <p role="status" aria-live="polite">{status}</p>
      </footer>
    </main>
  );
}
