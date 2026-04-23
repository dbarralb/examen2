import { useEffect, useMemo, useState } from "react";
import { LobbyStage } from "../components/LobbyStage.jsx";
import { getRole } from "../data/roles.js";
import { claimRole, getLobbySnapshot, getOwnLobbyPlayer, getPlayerDisplayName, normalizeLobby, touchLobbyPlayer, updatePlayerName, updatePreviewRole } from "../services/lobbyService.js";
import { hasValidStoredSessionCode } from "../services/sessionAccess.js";

export function RoleSelectScreen({ navigation }) {
  const [lobby, setLobby] = useState(() => normalizeLobby(null));
  const [selectedRoleId, setSelectedRoleId] = useState("empollon");
  const [nameDraft, setNameDraft] = useState("");
  const [status, setStatus] = useState("Validando sesion...");
  const [isBusy, setIsBusy] = useState(false);

  const selectedRole = useMemo(() => getRole(selectedRoleId), [selectedRoleId]);
  const ownPlayer = getOwnLobbyPlayer(lobby);

  useEffect(() => {
    let cancelled = false;

    async function refresh({ touch = false } = {}) {
      try {
        const snapshot = touch ? await touchLobbyPlayer() : await getLobbySnapshot();

        if (cancelled) {
          return;
        }

        if (!hasValidStoredSessionCode(snapshot.remoteState.session)) {
          navigation.go("access");
          return;
        }

        const nextLobby = snapshot.lobby;
        const nextOwnPlayer = getOwnLobbyPlayer(nextLobby);

        setLobby(nextLobby);
        setSelectedRoleId(nextOwnPlayer?.previewRole || selectedRoleId || "empollon");

        if (document.activeElement?.id !== "lobby-player-name" && nextOwnPlayer) {
          setNameDraft(getPlayerDisplayName(nextOwnPlayer, nextLobby.players));
        }

        if (snapshot.remoteState.session?.status === "in_game" && nextOwnPlayer?.confirmedRole) {
          navigation.go("player", { role: nextOwnPlayer.confirmedRole });
          return;
        }

        setStatus("Elige un personaje y pulsa Continuar para reservarlo.");
      } catch (error) {
        if (!cancelled) {
          setStatus("Sin conexion con el lobby. Reintentando...");
        }
      }
    }

    refresh({ touch: true });
    const timer = window.setInterval(refresh, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [navigation, selectedRoleId]);

  async function handleSelectRole(roleId) {
    setSelectedRoleId(roleId);
    setStatus("Rol en previsualizacion. Pulsa Continuar para reservarlo.");

    try {
      await updatePreviewRole(roleId);
      const snapshot = await getLobbySnapshot();
      setLobby(snapshot.lobby);
    } catch (error) {
      setStatus("No se pudo sincronizar la previsualizacion.");
    }
  }

  async function handleCommitName() {
    try {
      await updatePlayerName(nameDraft);
      const snapshot = await getLobbySnapshot();
      setLobby(snapshot.lobby);
    } catch (error) {
      setStatus("No se pudo guardar el nombre.");
    }
  }

  async function handleContinue() {
    setIsBusy(true);
    setStatus("Reservando rol...");

    try {
      await updatePlayerName(nameDraft);
      const result = await claimRole(selectedRoleId);

      if (!result.ok) {
        setStatus("Ese rol acaba de ser reservado. Puedes ver su tarjeta o elegir otro.");
        const snapshot = await getLobbySnapshot();
        setLobby(snapshot.lobby);
        return;
      }

      navigation.go("waiting", { role: selectedRoleId });
    } catch (error) {
      setStatus("No se pudo reservar el rol. Reintenta en un momento.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <LobbyStage
      mode="select"
      lobby={lobby}
      selectedRoleId={selectedRoleId}
      ownPlayer={ownPlayer}
      selectedRole={selectedRole}
      status={status}
      countdownSeconds={null}
      isBusy={isBusy}
      nameDraft={nameDraft}
      onNameChange={setNameDraft}
      onNameCommit={handleCommitName}
      onSelectRole={handleSelectRole}
      onContinue={handleContinue}
    />
  );
}
