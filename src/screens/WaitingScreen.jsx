import { useEffect, useMemo, useState } from "react";
import { LobbyStage } from "../components/LobbyStage.jsx";
import { getRole } from "../data/roles.js";
import {
  areAllRolesClaimed,
  ensureLobbyCountdown,
  getCountdownRemainingMs,
  getLobbySnapshot,
  getOwnLobbyPlayer,
  getPlayerDisplayName,
  normalizeLobby,
  releaseOwnRoleClaim,
  tryStartGameFromLobby,
  updatePlayerName,
} from "../services/lobbyService.js";
import { hasValidStoredSessionCode } from "../services/sessionAccess.js";

export function WaitingScreen({ navigation, params }) {
  const [lobby, setLobby] = useState(() => normalizeLobby(null));
  const [selectedRoleId, setSelectedRoleId] = useState(params.get("role") || "empollon");
  const [nameDraft, setNameDraft] = useState("");
  const [status, setStatus] = useState("Esperando jugadores...");
  const [now, setNow] = useState(Date.now());
  const [isBusy, setIsBusy] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const ownPlayer = getOwnLobbyPlayer(lobby);
  const confirmedRoleId = ownPlayer?.confirmedRole || selectedRoleId;
  const selectedRole = useMemo(() => getRole(selectedRoleId || confirmedRoleId), [selectedRoleId, confirmedRoleId]);
  const remainingMs = getCountdownRemainingMs(lobby, now);
  const countdownSeconds = remainingMs === null ? null : Math.max(1, Math.ceil(remainingMs / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const snapshot = await getLobbySnapshot();

        if (cancelled) {
          return;
        }

        if (!hasValidStoredSessionCode(snapshot.remoteState.session)) {
          navigation.go("access");
          return;
        }

        const nextLobby = snapshot.lobby;
        const nextOwnPlayer = getOwnLobbyPlayer(nextLobby);

        if (!nextOwnPlayer?.confirmedRole) {
          navigation.go("roles");
          return;
        }

        setLobby(nextLobby);
        setSelectedRoleId((current) => current || nextOwnPlayer.confirmedRole);

        if (document.activeElement?.id !== "lobby-player-name") {
          setNameDraft(getPlayerDisplayName(nextOwnPlayer, nextLobby.players));
        }

        if (snapshot.remoteState.session?.status === "in_game") {
          setStatus("Entrando en la partida...");
          setIsTransitioning(true);
          window.setTimeout(() => {
            if (!cancelled) {
              navigation.go("player", { role: nextOwnPlayer.confirmedRole });
            }
          }, 650);
          return;
        }

        if (areAllRolesClaimed(nextLobby)) {
          await ensureLobbyCountdown(nextLobby);
          const nextRemaining = getCountdownRemainingMs(nextLobby);

          if (nextRemaining === 0) {
            await tryStartGameFromLobby(nextLobby);
          }

          setStatus("Equipo completo. Preparando entrada...");
        } else {
          setStatus("Esperando a que los 4 jugadores esten listos.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("Sin conexion con el lobby. Reintentando...");
        }
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [navigation]);

  async function handleCommitName() {
    try {
      await updatePlayerName(nameDraft);
      const snapshot = await getLobbySnapshot();
      setLobby(snapshot.lobby);
    } catch (error) {
      setStatus("No se pudo guardar el nombre.");
    }
  }

  async function handleChangeRole() {
    setIsBusy(true);
    setStatus("Liberando rol...");

    try {
      await releaseOwnRoleClaim();
      navigation.go("roles");
    } catch (error) {
      setStatus("No se pudo cambiar de rol.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <LobbyStage
      mode="waiting"
      lobby={lobby}
      selectedRoleId={selectedRoleId}
      ownPlayer={ownPlayer}
      selectedRole={selectedRole}
      status={status}
      countdownSeconds={countdownSeconds}
      isBusy={isBusy}
      isTransitioning={isTransitioning}
      nameDraft={nameDraft}
      onNameChange={setNameDraft}
      onNameCommit={handleCommitName}
      onSelectRole={setSelectedRoleId}
      onChangeRole={handleChangeRole}
    />
  );
}
