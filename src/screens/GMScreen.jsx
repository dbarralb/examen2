import { useEffect, useMemo, useState } from "react";
import { NBadge, NButton, NCard, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { cards, targets } from "../data/gameData.js";
import { getEcosForRoom, getRoom, getPuzzlesForRoom, getZonesForRoom } from "../data/roomData.js";
import { computeTeamProfile, getProfileLabel } from "../services/teamProfile.js";
import { playerRoles } from "../data/roles.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { enqueueDebugRandomActions, forceStartDebugGame, getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { startManualPulse } from "../services/pulseService.js";
import { getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";
import { completeSala } from "../services/sessionService.js";

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
  const lobbyClaims = useMemo(() => Object.values(remoteState?.lobby?.roleClaims || {}).filter(Boolean), [remoteState]);
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 6), [remoteState]);

  const puzzleState = remoteState?.puzzleState || {};
  const availableOutputs = sessionState.availableOutputs || [];
  const currentSalaId = sessionState.salaId || "sala1_el_cierre";
  const currentZoneId = sessionState.zoneId || "inicio";
  const currentRoom = getRoom(currentSalaId);
  const salaZones = getZonesForRoom(currentSalaId);
  const salaPuzzles = getPuzzlesForRoom(currentSalaId);
  const salaEcos = getEcosForRoom(currentSalaId);
  const ecoState = remoteState?.ecoState || {};
  const teamMetrics = remoteState?.teamMetrics || {};
  const teamProfile = computeTeamProfile(teamMetrics);
  const allPuzzlesSolved = salaPuzzles.length > 0 && salaPuzzles.every((p) => puzzleState[p.id]?.solved);
  const isGameOver = sessionState.gameOver === true;

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
      } catch (error) {
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

    return () => {
      window.clearInterval(clockTimer);
    };
  }, [remoteState?.session?.gameTimer]);

  async function handleStartGame() {
    setIsBusy(true);
    setStatusMessage("Iniciando partida...");

    try {
      const nextState = await startGame();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage("Lobby abierto. Codigo generado.");
    } catch (error) {
      setStatusMessage("No se pudo iniciar la partida.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResetGame() {
    setIsBusy(true);
    setStatusMessage("Reseteando partida...");

    try {
      const nextState = await resetGame();
      setRemoteState(nextState);
      setElapsedSeconds(0);
      setStatusMessage("Partida reseteada. Jugadores devueltos al acceso.");
    } catch (error) {
      setStatusMessage("No se pudo resetear la partida.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleForceStartDebug() {
    setIsBusy(true);
    setStatusMessage("Forzando inicio debug...");

    try {
      const nextState = await forceStartDebugGame();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage("Inicio debug forzado. La partida esta en curso.");
    } catch (error) {
      setStatusMessage(error.message || "No se pudo forzar el inicio debug.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDebugRandomActions() {
    setIsBusy(true);
    setStatusMessage("Encolando acciones debug...");

    try {
      const count = await enqueueDebugRandomActions(queuedActions, cards, targets, playerRoles);
      const nextState = await getRemoteState();
      setRemoteState(nextState);
      setStatusMessage(count > 0 ? `${count} accion(es) debug encoladas.` : "Todos los jugadores ya tienen accion.");
    } catch (error) {
      setStatusMessage("No se pudo encolar acciones debug.");
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

  async function handleCompleteSala() {
    setIsBusy(true);
    setStatusMessage("Completando sala...");
    try {
      const result = await completeSala(sessionState, teamMetrics);
      if (result.gameOver) {
        setStatusMessage("Partida completada. Todas las salas resueltas.");
      } else {
        setStatusMessage(`Sala completada. Siguiente: ${result.nextSala?.label || "desconocida"}`);
      }
      await refresh();
    } catch {
      setStatusMessage("No se pudo completar la sala.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleZoneChange(zoneId) {
    try {
      await firebasePatch("sessionState", { zoneId });
      setStatusMessage(`Zona cambiada: ${salaZones.find((z) => z.id === zoneId)?.label || zoneId}`);
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
          <h1>Control de sesion</h1>
        </div>
      </header>
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${monitorsExpanded ? "expanded" : ""}`}
          onClick={() => setMonitorsExpanded((v) => !v)}
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
            Codigo: {session.accessCode || "sin generar"}
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
          <NTimer seconds={elapsedSeconds} />
          <p className="react-status" role="status" aria-live="polite">{statusMessage}</p>
          <div className="button-row">
            <NButton onClick={handleStartGame} disabled={isBusy}>Abrir lobby</NButton>
            <NButton variant="danger" onClick={handleResetGame} disabled={isBusy}>Resetear</NButton>
          </div>
          <div className="gm-debug-tools" aria-label="Herramientas debug temporales">
            <NBadge status="warning">Debug temporal</NBadge>
            <p>Forzar inicio salta la espera de 4 jugadores y arranca con al menos 1 rol confirmado.</p>
            <NButton
              variant="ghost"
              size="sm"
              onClick={handleForceStartDebug}
              disabled={isBusy || session.status === "in_game" || lobbyClaims.length < 1}
            >
              Forzar inicio
            </NButton>
            <NButton
              variant="ghost"
              size="sm"
              onClick={() => setShowCoordinates((v) => !v)}
            >
              {showCoordinates ? "Ocultar coordenadas" : "Modo coordenadas"}
            </NButton>
            <NButton
              variant="ghost"
              size="sm"
              onClick={handleDebugRandomActions}
              disabled={isBusy || session.status !== "in_game"}
            >
              Acciones random
            </NButton>
          </div>
        </NCard>
        <NCard title={currentRoom ? `Sala: ${currentRoom.label}` : "Sala"}>
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
          {salaPuzzles.length > 0 && (
            <div className="gm-puzzle-list" aria-label="Estado de puzzles">
              {salaPuzzles.map((puzzle) => {
                const ps = puzzleState[puzzle.id];
                const isSolved = ps?.solved === true;
                const inputsMet = puzzle.requiredInputs.every((inp) => availableOutputs.includes(inp));
                const isBlocked = !isSolved && puzzle.requiredInputs.length > 0 && !inputsMet;
                return (
                  <div key={puzzle.id} className={`gm-puzzle-row ${isSolved ? "solved" : ""} ${isBlocked ? "blocked" : ""}`}>
                    <span className="gm-puzzle-status">{isSolved ? "✓" : isBlocked ? "⊘" : "○"}</span>
                    <span className="gm-puzzle-label">{puzzle.label}</span>
                    <NBadge status={isSolved ? "success" : isBlocked ? "muted" : "warning"}>
                      {isSolved ? "Resuelto" : isBlocked ? "Bloqueado" : "Pendiente"}
                    </NBadge>
                    {puzzle.requiredInputs.length > 0 && !isSolved && (
                      <span className="gm-puzzle-inputs">
                        {puzzle.requiredInputs.map((inp) => (
                          <span key={inp} className={`gm-puzzle-input ${availableOutputs.includes(inp) ? "met" : ""}`}>{inp}</span>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {salaEcos.length > 0 && (
            <div className="gm-eco-list" aria-label="Ecos de la sala">
              {salaEcos.map((eco) => {
                const discovered = ecoState[eco.id]?.discovered === true;
                return (
                  <div key={eco.id} className={`gm-eco-row ${discovered ? "discovered" : ""}`}>
                    <span className="gm-eco-status">{discovered ? "◈" : "◇"}</span>
                    <span className="gm-eco-text">{discovered ? `"${eco.text}"` : "Eco oculto"}</span>
                    <NBadge status={discovered ? "success" : "muted"}>{discovered ? "Capturado" : "Oculto"}</NBadge>
                  </div>
                );
              })}
            </div>
          )}
          <div className="gm-metrics-panel" aria-label="Métricas de equipo">
            <div className="gm-metrics-profile">
              <NBadge status="info">{getProfileLabel(teamProfile)}</NBadge>
            </div>
            <div className="gm-metrics-bars">
              {[
                { key: "forceCount", label: "Fuerza", color: "var(--color-amber, #f5a623)" },
                { key: "analysisCount", label: "Análisis", color: "var(--color-accent, #7c6fe0)" },
                { key: "repairCount", label: "Reparación", color: "var(--color-lime, #7ed957)" },
                { key: "ecoCount", label: "Ecos", color: "var(--color-cream, #f0e6d3)" },
              ].map((m) => (
                <div key={m.key} className="gm-metric-row">
                  <span className="gm-metric-label">{m.label}</span>
                  <span className="gm-metric-value" style={{ color: m.color }}>{teamMetrics[m.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          {allPuzzlesSolved && !isGameOver && (
            <div className="gm-complete-sala">
              <NButton
                variant="danger"
                onClick={handleCompleteSala}
                disabled={isBusy || isPulseBusy}
              >
                Completar sala
              </NButton>
            </div>
          )}
          {isGameOver && (
            <div className="gm-complete-sala">
              <NBadge status="success">Partida completada</NBadge>
            </div>
          )}
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
          <p className="react-status">Los monitores y resolucion de pulsos se portaran en la siguiente fase.</p>
        </NCard>
      </section>
    </main>
  );
}
