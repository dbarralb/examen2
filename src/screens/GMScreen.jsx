import { useEffect, useMemo, useState } from "react";
import { NBadge, NButton, NCard, NTimer, NewtonLogo } from "../components/newton";
import { ActionQueuePanel } from "../components/ActionQueuePanel.jsx";
import { SceneMap } from "../components/SceneMap.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";
import { getRoom, SALA1_ROOM_ID } from "../data/roomData.js";
import { playerRoles } from "../data/roles.js";
import { targets } from "../data/gameData.js";
import { formatCardLabel } from "../presentation/actionQueuePresentation.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { forceStartGame, getRemoteState, resetGame, startGame } from "../services/gmService.js";
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
  const [sceneControlExpanded, setSceneControlExpanded] = useState(false);

  const session = remoteState?.session || {};
  const sessionState = remoteState?.sessionState || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 8), [remoteState]);
  const currentSalaId = sessionState.salaId || "sandbox";
  const currentRoom = getRoom(currentSalaId);
  const gameState = remoteState?.gameState || {};
  // Firebase strips empty arrays → normalize to safe defaults
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
  const isSala1 = currentSalaId === SALA1_ROOM_ID;
  const alarmRecommendations = useMemo(
    () => (isSala1 ? getAlarmRecommendations(gameState) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSala1, alarmState.level, alarmState.noise, flags.photographed, flags.camera_fooled],
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

  async function handleForceStartGame() {
    setIsBusy(true);
    setStatusMessage("Forzando inicio (modo debug)...");

    try {
      const nextState = await forceStartGame();
      setRemoteState(nextState);
      setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
      setStatusMessage("Partida iniciada directamente. Sin esperar jugadores.");
    } catch {
      setStatusMessage("No se pudo forzar el inicio.");
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

  async function handleSalaChange(salaId) {
    try {
      const room = getRoom(salaId);
      const firstZone = room?.zones?.[0]?.id || "all";
      await firebasePatch("sessionState", { salaId, zoneId: firstZone });
      setStatusMessage(`Sala cambiada: ${room?.label || salaId}`);
      await refresh();
    } catch {
      setStatusMessage("No se pudo cambiar de sala.");
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
        <NewtonLogo />
        <div>
          <NBadge status="info">Panel GM</NBadge>
          <NBadge status={isSala1 ? "success" : "muted"}>{isSala1 ? "Sala 1 — Despacho" : "Sandbox"}</NBadge>
          <h1>{isSala1 ? "Control Sala 1" : "Control sandbox"}</h1>
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
            <NButton variant="ghost" onClick={handleForceStartGame} disabled={isBusy} title="Inicia la partida sin esperar a que todos los jugadores estén listos">
              Debug: iniciar ya
            </NButton>
            <NButton variant="danger" onClick={handleResetGame} disabled={isBusy}>Resetear</NButton>
            <NButton variant="ghost" onClick={() => setShowCoordinates((value) => !value)}>
              {showCoordinates ? "Ocultar coordenadas" : "Modo coordenadas"}
            </NButton>
          </div>
        </NCard>

        <NCard title={currentRoom ? `Sala: ${currentRoom.label}` : "Sala"}>
          {/* Selector de sala */}
          <div className="gm-sala-selector" aria-label="Selector de sala">
            <button
              type="button"
              className={`gm-zone-btn ${currentSalaId === "sandbox" ? "active" : ""}`}
              onClick={() => handleSalaChange("sandbox")}
              disabled={session.status !== "in_game"}
            >
              Sandbox
            </button>
            <button
              type="button"
              className={`gm-zone-btn ${currentSalaId === SALA1_ROOM_ID ? "active" : ""}`}
              onClick={() => handleSalaChange(SALA1_ROOM_ID)}
              disabled={session.status !== "in_game"}
            >
              Sala 1 — Despacho
            </button>
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

      {/* ---- Panel Control de Escenario (Sala 1) ---- */}
      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${sceneControlExpanded ? "expanded" : ""}`}
          onClick={() => setSceneControlExpanded((v) => !v)}
          aria-expanded={sceneControlExpanded}
        >
          <span>Control de Escenario</span>
          <span className="react-gm-monitors-toggle-badges">
            {isSala1 && (
              <>
                <NBadge status={alarmState.level === 0 ? "muted" : alarmState.level >= 3 ? "danger" : "warning"}>
                  Alarma {alarmState.level}
                </NBadge>
                {gmSceneState.activeEffects.length > 0 && (
                  <NBadge status="warning">{gmSceneState.activeEffects.length} efecto{gmSceneState.activeEffects.length > 1 ? "s" : ""} activo{gmSceneState.activeEffects.length > 1 ? "s" : ""}</NBadge>
                )}
              </>
            )}
            {!isSala1 && <NBadge status="muted">Solo disponible en Sala 1</NBadge>}
          </span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{sceneControlExpanded ? "▲" : "▼"}</span>
        </button>
        {sceneControlExpanded && (
          <section className="react-gm-scene-control" aria-label="Control de escenario">
            {!isSala1 ? (
              <p className="react-status">Cambia a Sala 1 para usar el control de escenario.</p>
            ) : (
              <>
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

                {/* Flags clave */}
                <div className="gm-scene-flags">
                  <strong>Flags:</strong>
                  {[
                    ["examStolen", "Examen robado"],
                    ["replacedExam", "Examen sustituido"],
                    ["copyInInventory", "Copia en mano"],
                    ["usedForce", "Fuerza usada"],
                    ["usedBypass", "Bypass usado"],
                    ["photographed", "Fotografiado"],
                    ["camera_fooled", "Cámara engañada"],
                    ["resolvedByMainPath", "Ruta principal"],
                  ].map(([key, label]) => (
                    <NBadge key={key} status={flags[key] ? "success" : "muted"}>{label}</NBadge>
                  ))}
                </div>

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

                {/* Botones de efectos */}
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

                {/* Variante activa */}
                <div className="gm-scene-metric">
                  <strong>Variante de escena:</strong>
                  <NBadge status={gmSceneState.activeVariant === "normal" ? "muted" : "warning"}>
                    {gmSceneState.activeVariant}
                  </NBadge>
                </div>
              </>
            )}
          </section>
        )}
      </div>

    </main>
  );
}
