import { NButton } from "./newton";
import empollonPanelImage from "../../assets/Lobby/UI/Lobby_panel_empollon.png";
import guaperasPanelImage from "../../assets/Lobby/UI/Lobby_panel_guaperas.png";
import inputNameCardImage from "../../assets/Lobby/UI/Lobby_inputNamecard.png";
import manitasPanelImage from "../../assets/Lobby/UI/Lobby_panel_manitas.png";
import misticaPanelImage from "../../assets/Lobby/UI/Lobby_panel_mistica.png";

const panelImagesByRole = {
  empollon: empollonPanelImage,
  guaperas: guaperasPanelImage,
  bruto: guaperasPanelImage,
  manitas: manitasPanelImage,
  mistica: misticaPanelImage,
};

export function LobbyRolePanel({
  role,
  nameDraft,
  isBusy,
  isWaiting,
  canContinue,
  countdownSeconds,
  onNameChange,
  onNameCommit,
  onContinue,
  onChangeRole,
}) {
  const panelImage = panelImagesByRole[role.id] || empollonPanelImage;

  return (
    <aside className="lobby-role-panel lobby-fixed-panel" aria-label={`Ficha de ${role.label}`}>
      <img className="lobby-fixed-panel-image" src={panelImage} alt={`Ficha de ${role.label}`} draggable="false" />

      <div className="lobby-fixed-name" aria-label="Nombre de jugador">
        <img className="lobby-fixed-name-image" src={inputNameCardImage} alt="" aria-hidden="true" draggable="false" />
        <label className="sr-only" htmlFor="lobby-player-name">Nombre</label>
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
      </div>

      <div className="lobby-panel-action-area">
        {countdownSeconds !== null && (
          <strong className="lobby-countdown">Entrando en {countdownSeconds}</strong>
        )}
        <NButton
          variant={isWaiting ? "danger" : "primary"}
          size="lg"
          onClick={isWaiting ? onChangeRole : onContinue}
          disabled={isBusy || (!isWaiting && !canContinue)}
        >
          {isWaiting ? "Cambiar rol" : "Continuar"}
        </NButton>
      </div>
    </aside>
  );
}
