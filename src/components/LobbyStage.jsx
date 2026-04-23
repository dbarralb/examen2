import { useEffect } from "react";
import { NBadge, NButton, NewtonLogo } from "./newton";
import { getLobbyRoles } from "../data/roles.js";
import { getClaimForRole, getPlayerDisplayName, isRoleClaimedByOther } from "../services/lobbyService.js";

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
  nameDraft,
  onNameChange,
  onNameCommit,
  onSelectRole,
  onContinue,
  onChangeRole,
}) {
  const roles = getLobbyRoles();
  const isWaiting = mode === "waiting";
  const title = isWaiting ? "Esperando jugadores..." : "Selecciona un rol";
  const ownDisplayName = getPlayerDisplayName(ownPlayer, lobby.players);

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

  return (
    <main className={`react-screen lobby-screen ${isWaiting ? "lobby-screen-waiting" : "lobby-screen-select"} ${isTransitioning ? "lobby-transitioning" : ""}`}>
      <header className="lobby-banner">
        <h1>{title}</h1>
      </header>

      <aside className="lobby-role-panel">
        <NBadge status={selectedRole.status}>{selectedRole.kicker}</NBadge>
        <h2>{selectedRole.label}</h2>
        <p>{selectedRole.text}</p>
        <small>Cartas: {selectedRole.cards}</small>
        <section className="lobby-player-name" aria-label="Nombre de jugador">
          <label htmlFor="lobby-player-name">Nombre</label>
          <input
            id="lobby-player-name"
            value={nameDraft}
            maxLength={24}
            onChange={(event) => onNameChange?.(event.target.value)}
            onBlur={onNameCommit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </section>
        <span>{isRoleClaimedByOther(lobby, selectedRole.id) ? "Rol ocupado" : "Seleccionar"}</span>
      </aside>

      <section className="lobby-character-row" aria-label="Personajes disponibles">
        {roles.map((role) => {
          const claim = getClaimForRole(lobby, role.id);
          const isOwnPreview = selectedRoleId === role.id;
          const isSelected = isWaiting ? Boolean(claim) : Boolean(claim || isOwnPreview);
          const showSelector = isWaiting ? Boolean(claim) : isOwnPreview;
          const playerForClaim = claim?.clientId ? lobby.players[claim.clientId] : null;
          const labelName = claim?.name || getPlayerDisplayName(playerForClaim, lobby.players);

          return (
            <button
              key={role.id}
              className={`lobby-character ${isOwnPreview ? "previewed" : ""} ${claim ? "claimed" : ""}`}
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
        <div className="lobby-action-area">
          {countdownSeconds !== null && (
            <strong className="lobby-countdown">Entrando en {countdownSeconds}</strong>
          )}
          <NButton
            variant={isWaiting ? "danger" : "primary"}
            size="lg"
            onClick={isWaiting ? onChangeRole : onContinue}
            disabled={isBusy || (!isWaiting && !selectedRoleId)}
          >
            {isWaiting ? "Cambiar rol" : "Continuar"}
          </NButton>
        </div>
      </footer>

      <p className="lobby-status" role="status" aria-live="polite">{status}</p>
    </main>
  );
}
