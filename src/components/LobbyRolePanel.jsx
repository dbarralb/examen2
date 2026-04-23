import brutoPanelImage from "../../assets/Lobby/UI/Lobby_panel_bruto.png";
import empollonPanelImage from "../../assets/Lobby/UI/Lobby_panel_empollon.png";
import manitasPanelImage from "../../assets/Lobby/UI/Lobby_panel_manitas.png";
import misticaPanelImage from "../../assets/Lobby/UI/Lobby_panel_mistica.png";

const panelImagesByRole = {
  bruto: brutoPanelImage,
  empollon: empollonPanelImage,
  manitas: manitasPanelImage,
  mistica: misticaPanelImage,
};

export function LobbyRolePanel({
  role,
  nameDraft,
  isClaimedByOther,
  onNameChange,
  onNameCommit,
}) {
  const panelImage = panelImagesByRole[role.id] || empollonPanelImage;

  return (
    <aside className="lobby-role-panel lobby-fixed-panel" aria-label={`Ficha de ${role.label}`}>
      <img className="lobby-fixed-panel-image" src={panelImage} alt={`Ficha de ${role.label}`} draggable="false" />

      <section className="lobby-player-name lobby-fixed-name" aria-label="Nombre de jugador">
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

      <p className="lobby-fixed-state">{isClaimedByOther ? "Rol ocupado" : "Seleccionar"}</p>
    </aside>
  );
}
