import { useEffect, useMemo, useState } from "react";
import { E2Logo, NBadge, NButton, NCard, NTimer } from "../components/e2";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { playerRoles } from "../data/roles.js";
import { targets } from "../data/gameData.js";
import { DEFAULT_SCENARIO_ID, SCENARIO_VARIANTS, getScenario } from "../data/scenarioData.js";
import { getScenarioHotspots } from "../data/scenarioContent.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { forceStartGameWithReadyPlayers, getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { getAlarmRecommendations } from "../services/gameRules.js";
import { gmSceneEffects, toggleSceneEffect } from "../services/gmSceneControl.js";
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
  if (!action) return "Sin accion registrada.";
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
  const [sceneControlExpanded, setSceneControlExpanded] = useState(false);

  const session = remoteState?.session || {};
  const sessionState = remoteState?.sessionState || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 8), [remoteState]);
  const activeScenario = getScenario(sessionState.scenarioId || DEFAULT_SCENARIO_ID);
  const coordinateTargets = getScenarioHotspots(activeScenario.id, "A");
  const gameState = remoteState?.gameState || {};
  const readyPlayerCount = Object.values(remoteState?.lobby?.roleClaims || {}).filter(Boolean).length;

  // Firebase strips empty arrays — normalize to safe defaults
  const rawGmScene = gameState.gmSceneState || {};
  const gmSceneState = {
    activeVariant: rawGmScene.activeVariant || "normal",
    activeEffects: Array.isArray(rawGmScene.activeEffects) ? rawGmScene.activeEffects : [],
    history: Array.isArray(rawGmScene.history) ? rawGmScene.history : [],
  };
  const rawAlarm = gameState.alarmState || {};
  const alarmState = {
    level: rawAlarm.level ?? 0,
    noise: rawAlarm.noise ?? 0,
    triggers: Array.isArray(rawAlarm.triggers) ? rawAlarm.triggers : [],
  };
  const flags = gameState.flags || {};
  const alarmRecommendations = useMemo(
    () => getAlarmRecommendations(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alarmState.level, alarmState.noise],
  );

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
        if (!isCancelled()) setStatusMessage("No se pudo refrescar Firebase.");
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
    setStatusMessage("Reseteando...");
    try {
      const nextState = await resetGame();
      setRemoteState(nextState);
      setElapsedSeconds(0);
      setStatusMessage("Partida reseteada. Jugadores devueltos al acceso.");
    } catch {
      setStatusMessage("No se pudo resetear.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleForceStartGame() {
    setIsBusy(true);
    setStatusMessage("Iniciando partida...");
    try {
      const nextState = await forceStartGameWithReadyPlayers();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage(`Partida iniciada con ${readyPlayerCount || 1} jugador(es) preparado(s).`);
    } catch (error) {
      setStatusMessage(error.message || "No se pudo iniciar la partida.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartPulse() {
    setIsPulseBusy(true);
    setStatusMessage("Preparando pulso...");
    try {
      await startManualPulse({ onStatus(message) { setStatusMessage(message); } });
      await refresh();
    } catch (error) {
      setStatusMessage(error.message || "El pulso ha fallado.");
      await refresh();
    } finally {
      setIsPulseBusy(false);
    }
  }

  /** Assign a scenario variant (A-D) to a specific player role. */
  async function handleSetVariant(roleId, variant) {
    try {
      await firebasePatch(`playerBoards/${roleId}`, { variant, scenarioId: activeScenario.id });
      setStatusMessage(`${roleId}: variante ${variant}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo cambiar la variante.");
    }
  }

  async function handleToggleSceneEffect(effectId) {
    try {
      await toggleSceneEffect(effectId, "GM activó desde panel de escenario");
      setStatusMessage(`Efecto de escena actualizado: ${effectId}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo actualizar el efecto de escena.");
    }
  }

  return (
    <main className="react-screen react-gm-screen">
      <header className="react-screen-header">
        <E2Logo />
        <div>
          <NBadge status="info">Panel GM</NBadge>
          <NBadge status="muted">{activeScenario.label}</NBadge>
          <h1>Control GM</h1>
        </div>
      </header>

      {/* ---- Monitores de jugadores ---- */}
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
            boardTargets={coordinateTargets}
            scenarioId={activeScenario.id}
          />
        </section>
      )}

      <section className="react-gm-grid">
        {/* ---- Partida ---- */}
        <NCard title="Partida" gold>
          <NBadge status={getSessionBadgeStatus(session.status)}>
            {session.status === "in_game" ? "Partida en curso" : "Sin comenzar"}
          </NBadge>
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
            <NButton
              variant="secondary"
              onClick={handleForceStartGame}
              disabled={isBusy || session.status === "in_game" || readyPlayerCount < 1}
            >
              Iniciar partida
            </NButton>
            <NButton variant="danger" onClick={handleResetGame} disabled={isBusy}>Resetear</NButton>
            <NButton variant="ghost" onClick={() => setShowCoordinates((v) => !v)}>
              {showCoordinates ? "Ocultar coordenadas" : "Modo coordenadas"}
            </NButton>
          </div>
          <p className="react-status gm-start-rule">
            Inicio manual GM: disponible con {readyPlayerCount} jugador(es) preparado(s).
          </p>
        </NCard>

        {/* ---- Variantes por jugador ---- */}
        <NCard title={`Variantes — ${activeScenario.label}`}>
          <p className="react-status">
            Cada jugador vive una variante del escenario (A/B/C/D).
            Asigna aquí qué realidad ve cada uno.
          </p>
          <div className="gm-variant-grid">
            {playerRoles.map((role) => {
              const claim = remoteState?.lobby?.roleClaims?.[role.id];
              const variant = remoteState?.playerBoards?.[role.id]?.variant || "A";
              return (
                <div key={role.id} className="gm-variant-row">
                  <NBadge status={claim ? role.status : "muted"}>{role.label}</NBadge>
                  <div className="button-row">
                    {SCENARIO_VARIANTS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`gm-variant-btn ${variant === v ? "active" : ""}`}
                        onClick={() => handleSetVariant(role.id, v)}
                        disabled={session.status !== "in_game"}
                        title={`Variante ${v}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </NCard>

        {/* ---- Cola de acciones + pulso ---- */}
        <NCard title="Cola de acciones" glow>
          <ActionQueuePanel
            pulseState={pulseState}
            queuedActions={queuedActions}
            emptyMessage="No hay acciones esperando pulso."
            ariaLabel="Cola de acciones del pulso"
            stackClassName="gm"
          />
          <div className="button-row">
            <NButton
              onClick={handleStartPulse}
              disabled={isBusy || isPulseBusy || pulseState.status !== "idle"}
            >
              {isPulseBusy ? "Pulso en curso" : "Comenzar pulso"}
            </NButton>
            <NButton variant="ghost" disabled>Auto pulso</NButton>
          </div>
        </NCard>

        {/* ---- Historial ---- */}
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

      {/* ---- Control de Escenario (alarma + efectos GM) ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${sceneControlExpanded ? "expanded" : ""}`}
          onClick={() => setSceneControlExpanded((v) => !v)}
          aria-expanded={sceneControlExpanded}
        >
          <span>Control de Escenario</span>
          <span className="react-gm-monitors-toggle-badges">
            <NBadge status={alarmState.level === 0 ? "muted" : alarmState.level >= 3 ? "danger" : "warning"}>
              Alarma {alarmState.level}
            </NBadge>
            {gmSceneState.activeEffects.length > 0 && (
              <NBadge status="warning">
                {gmSceneState.activeEffects.length} efecto{gmSceneState.activeEffects.length > 1 ? "s" : ""} activo{gmSceneState.activeEffects.length > 1 ? "s" : ""}
              </NBadge>
            )}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{sceneControlExpanded ? "▲" : "▼"}</span>
        </button>
        {sceneControlExpanded && (
          <section className="react-gm-scene-control" aria-label="Control de escenario">
            {/* Métricas de alarma */}
            <div className="gm-scene-metrics">
              <div className="gm-scene-metric">
                <strong>Nivel de alarma:</strong>
                <NBadge status={alarmState.level === 0 ? "success" : alarmState.level >= 3 ? "danger" : "warning"}>
                  {alarmState.level} — {["normal", "sospecha", "alarma", "contencion"][alarmState.level] || "?"}
                </NBadge>
              </div>
              <div className="gm-scene-metric">
                <strong>Ruido acumulado:</strong> {alarmState.noise}
              </div>
              {alarmState.triggers?.length > 0 && (
                <div className="gm-scene-metric">
                  <strong>Últimos triggers:</strong>
                  <span>{alarmState.triggers.slice(-5).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Flags activos */}
            {Object.keys(flags).length > 0 && (
              <div className="gm-scene-flags">
                <strong>Flags activos:</strong>
                {Object.entries(flags).filter(([, v]) => v === true).map(([key]) => (
                  <NBadge key={key} status="success">{key}</NBadge>
                ))}
              </div>
            )}

            {/* Recomendaciones */}
            {alarmRecommendations.length > 0 && (
              <div className="gm-scene-recommendations">
                <strong>Recomendaciones:</strong>
                {alarmRecommendations.map((rec) => (
                  <div key={rec.id} className="gm-scene-rec">
                    <span>{rec.label}</span>
                    <small>{rec.reason}</small>
                  </div>
                ))}
              </div>
            )}

            {/* Efectos de escena */}
            <div className="gm-scene-effects">
              <strong>Efectos de escena:</strong>
              <div className="button-row">
                {gmSceneEffects.map((effect) => {
                  const isActive = gmSceneState.activeEffects.includes(effect.id);
                  return (
                    <button
                      key={effect.id}
                      type="button"
                      className={`gm-effect-btn ${isActive ? "active" : ""}`}
                      title={effect.description}
                      onClick={() => handleToggleSceneEffect(effect.id)}
                    >
                      {isActive ? "✓ " : ""}{effect.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variante de escena GM */}
            <div className="gm-scene-metric">
              <strong>Variante activa:</strong>
              <NBadge status={gmSceneState.activeVariant === "normal" ? "muted" : "warning"}>
                {gmSceneState.activeVariant}
              </NBadge>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
