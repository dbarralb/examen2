export function LobbyRolePanel({
  role,
  nameDraft,
  actionSlot = null,
  onNameChange,
  onNameCommit,
}) {
  return (
    <aside className="lobby-role-panel e2-panel" aria-label={`Ficha de ${role.label}`}>
      <div className="lobby-panel-kicker">operator profile</div>
      <h2>{role.label}</h2>
      <p>{role.text}</p>

      <dl className="lobby-role-specs">
        <div>
          <dt>Especialidad</dt>
          <dd>{role.kicker}</dd>
        </div>
        <div>
          <dt>Cartas</dt>
          <dd>{role.cards}</dd>
        </div>
      </dl>

      <label className="lobby-name-field" htmlFor="lobby-player-name">
        <span>Operator ID</span>
        <input
          id="lobby-player-name"
          value={nameDraft}
          maxLength={24}
          placeholder="// nombre..."
          onChange={(event) => onNameChange?.(event.target.value)}
          onBlur={onNameCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>

      {actionSlot}
    </aside>
  );
}
