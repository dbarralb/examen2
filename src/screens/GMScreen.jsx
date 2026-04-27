import { useEffect, useMemo, useState } from "react";
import { NBadge, NButton, NCard, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { getRoom, getZonesForRoom } from "../data/roomData.js";
import { playerRoles } from "../data/roles.js";
import { targets } from "../data/gameData.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { startManualPulse } from "../services/pulseService.js";
import { getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";

function getSessionBadgeStatus(status) {
  return status === "in_game" ? "success" : "muted";
}

function getMonitorSrc(roleId) {
  const params = new URLSearchParams({
    screen: "player",
    role: roleId,
    view: "gm-monitor",
  });

  return `${window.location.pathname}?${params.toString()}`;
}

function getActionSummary(action) {
  if (!action) {
    return "Sin accion registrada.";
  }

  const target = targets.find((item) => item.id === action.target);
  return `${formatCardLabel(action)} -> ${target?.label || action.target || "objetivo"}`;
}

export function GMScreen() {
  const [remoteState, setRemoteState] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Conectando con Firebase...");
  const [isBusy, setIsBusy] = useState(false);
  const [isPulseBusy, setIsPulseBusy] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [monitorsExpanded, setMonitorsExpanded] = useState(false);

  const session = remoteState?.session || {};
  const sessionState = remoteState?.sessionState || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 8), [remoteState]);
  const currentSalaId = sessionState.salaId || "sandbox";
  const currentZoneId = sessionState.zoneId || "all";
  const currentRoom = getRoom(currentSalaId);
  const salaZones = getZonesForRoom(currentSalaId);

  async function refresh() {
    const nextState = await getRemoteState();
    setRemoteState(nextState);
    setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
    setStatusMessage("Sincronizado.");
  }

  usePollingRefresh({
    intervalMs: 1000,
    task: async ({ isCancelled }) => {
      try {
        const nextState = await getRemoteState();

        if (!isCancelled()) {
          setRemoteState(nextState);
          setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
          setStatusMessage("Sincronizado.");
        }
      } catch {
        if (!isCancelled()) {
          setStatusMessage("No se pudo refrescar Firebase.");
        }
      }
    },
  });

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setElapsedSeconds((current) => {
        const gameTimer = remoteState?.session?.gameTimer;
        return gameTimer?.status === "running" ? getGameTimerElapsedSeconds(gameTimer) : current;
      });
    }, 500);

    return () => window.clearInterval(clockTimer);
  }, [remoteState?.session?.gameTimer]);

  async function handleStartGame() {
    setIsBusy(true);
    setStatusMessage("Abriendo lobby...");

    try {
      const nextState = await startGame();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage("Lobby abierto. Codigo generado.");
    } catch {
      setStatusMessage("No se pudo abrir el lobby.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResetGame() {
    setIsBusy(true);
    setStatusMessage("Reseteando sandbox...");

    try {
      const nextState = await resetGame();
      setRemoteState(nextState);
      setElapsedSeconds(0);
      setStatusMessage("Sandbox reseteado. Jugadores devueltos al acceso.");
    } catch {
      setStatusMessage("No se pudo resetear el sandbox.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartPulse() {
    setIsPulseBusy(true);
    setStatusMessage("Preparando pulso...");

    try {
      await startManualPulse({
        onStatus(message) {
          setStatusMessage(message);
        },
      });
      await refresh();
    } catch (error) {
      setStatusMessage(error.message || "El pulso ha fallado.");
      await refresh();
    } finally {
      setIsPulseBusy(false);
    }
  }

  async function handleZoneChange(zoneId) {
    try {
      await firebasePatch("sessionState", { zoneId });
      setStatusMessage(`Zona sandbox cambiada: ${salaZones.find((zone) => zone.id === zoneId)?.label || zoneId}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo cambiar de zona.");
    }
  }

  return (
    <main className="react-screen react-gm-screen">
      <header className="react-screen-header">
        <NewtonLogo />
        <div>
          <NBadge status="info">Panel GM</NBadge>
          <h1>Control sandbox</h1>
        </div>
      </header>

      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${monitorsExpanded ? "expanded" : ""}`}
          onClick={() => setMonitorsExpanded((value) => !value)}
          aria-expanded={monitorsExpanded}
        >
          <span>Monitores de jugadores</span>
          <span className="react-gm-monitors-toggle-badges">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              return <NBadge key={role.id} status={claim ? "success" : "muted"}>{role.label}</NBadge>;
            })}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{monitorsExpanded ? "▲" : "▼"}</span>
        </button>
        {monitorsExpanded && (
          <section className="react-gm-monitor-wall" aria-label="Monitores de jugadores">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              const lastAction = remoteState?.lastRoleActions?.[role.id];

              return (
                <article key={role.id} className="react-gm-monitor">
                  <header>
                    <strong>{role.label}</strong>
                    <NBadge status={claim ? "success" : "muted"}>{claim ? "Conectado" : "Sin jugador"}</NBadge>
                  </header>
                  <iframe title={`Monitor ${role.label}`} src={getMonitorSrc(role.id)} />
                  <footer>{getActionSummary(lastAction)}</footer>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {showCoordinates && (
        <section className="react-gm-coordinate-map" aria-label="Mapa de coordenadas">
          <SceneMap
            gameState={remoteState?.gameState || {}}
            targetFeedback={remoteState?.targetFeedback || {}}
            selectedTargetId={null}
            pendingAction={null}
            queuedForPlayer={null}
            overlayActive={false}
            showCoordinates
          />
        </section>
      )}

      <section className="react-gm-grid">
        <NCard title="Partida" gold>
          <NBadge status={getSessionBadgeStatus(session.status)}>{session.status === "in_game" ? "Partida en curso" : "Sin comenzar"}</NBadge>
          <p className="session-code">
            GM: {session.accessCode || "sin generar"}
            {session.accessCode && (
              <button
                className="session-code-copy"
                type="button"
                onClick={() => navigator.clipboard.writeText(session.accessCode)}
                title="Copiar codigo"
              >
                Copiar
              </button>
            )}
          </p>
          {session.playerCodes && (
            <div className="player-codes-grid">
              {Object.entries(session.playerCodes).map(([label, code]) => (
                <div key={label} className="player-code-item">
                  <span className="player-code-label">{label}</span>
                  <span className="player-code-value">{code}</span>
                  <button
                    className="session-code-copy"
                    type="button"
                    onClick={() => navigator.clipboard.writeText(code)}
                    title={`Copiar codigo ${label}`}
                  >
                    Copiar
                  </button>
                </div>
              ))}
            </div>
          )}
          <NTimer seconds={elapsedSeconds} />
          <p className="react-status" role="status" aria-live="polite">{statusMessage}</p>
          <div className="button-row">
            <NButton onClick={handleStartGame} disabled={isBusy}>Abrir lobby</NButton>
            <NButton variant="danger" onClick={handleResetGame} disabled={isBusy}>Resetear</NButton>
            <NButton variant="ghost" onClick={() => setShowCoordinates((value) => !value)}>
              {showCoordinates ? "Ocultar coordenadas" : "Modo coordenadas"}
            </NButton>
          </div>
        </NCard>

        <NCard title={currentRoom ? `Sala: ${currentRoom.label}` : "Sala"}>
          <p className="react-status">Sandbox sin puzzles, ecos ni finales. Las zonas solo filtran hotspots visibles.</p>
          <div className="gm-zone-selector" aria-label="Selector de zona">
            {salaZones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={`gm-zone-btn ${zone.id === currentZoneId ? "active" : ""}`}
                onClick={() => handleZoneChange(zone.id)}
                disabled={session.status !== "in_game"}
              >
                {zone.label}
                {zone.targetIds.length > 0 && <span className="gm-zone-target-count">{zone.targetIds.length}</span>}
              </button>
            ))}
          </div>
        </NCard>

        <NCard title="Cola de acciones" glow>
          <ActionQueuePanel
            pulseState={pulseState}
            queuedActions={queuedActions}
            emptyMessage="No hay acciones esperando pulso."
            ariaLabel="Cola de acciones del pulso"
            stackClassName="gm"
          />
          <div className="button-row">
            <NButton onClick={handleStartPulse} disabled={isBusy || isPulseBusy || pulseState.status !== "idle"}>
              {isPulseBusy ? "Pulso en curso" : "Comenzar pulso"}
            </NButton>
            <NButton variant="ghost" disabled>Auto pulso</NButton>
          </div>
        </NCard>

        <NCard title="Historial">
          <div className="react-list">
            {actionLog.length === 0 ? (
              <p>Sin historial todavia.</p>
            ) : (
              actionLog.map((message, index) => (
                <article key={`${message}-${index}`} className="react-list-item">
                  <span>{message}</span>
                </article>
              ))
            )}
          </div>
        </NCard>
      </section>
    </main>
  );
}
