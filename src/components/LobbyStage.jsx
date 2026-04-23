import { useEffect } from "react";
import { NewtonLogo } from "./newton";
import { LobbyRolePanel } from "./LobbyRolePanel.jsx";
import { getLobbyRoles } from "../data/roles.js";
import { getClaimForRole, getPlayerDisplayName } from "../services/lobbyService.js";

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

      <LobbyRolePanel
        role={selectedRole}
        nameDraft={nameDraft}
        isBusy={isBusy}
        isWaiting={isWaiting}
        canContinue={Boolean(selectedRoleId)}
        countdownSeconds={countdownSeconds}
        onNameChange={onNameChange}
        onNameCommit={onNameCommit}
        onContinue={onContinue}
        onChangeRole={onChangeRole}
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
      </footer>

      <p className="lobby-status-debug" role="status" aria-live="polite">{status}</p>
    </main>
  );
}
