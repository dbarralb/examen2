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
  const [testScriptExpanded, setTestScriptExpanded] = useState(false);
  const [pipelineExpanded, setPipelineExpanded] = useState(false);

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

      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${testScriptExpanded ? "expanded" : ""}`}
          onClick={() => setTestScriptExpanded((v) => !v)}
          aria-expanded={testScriptExpanded}
        >
          <span>Guion de testeo</span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{testScriptExpanded ? "▲" : "▼"}</span>
        </button>
        {testScriptExpanded && (
          <section className="gm-test-script">
            <TestScript
              sessionState={sessionState}
              teamMetrics={teamMetrics}
              puzzleState={puzzleState}
              gameState={remoteState?.gameState || {}}
              ecoState={ecoState}
              playerZones={remoteState?.playerZones || {}}
              queuedActions={queuedActions}
              availableOutputs={availableOutputs}
              allPuzzlesSolved={allPuzzlesSolved}
              currentSalaId={currentSalaId}
            />
          </section>
        )}
      </div>

      <div className="react-gm-monitors-collapsible">
        <button
          className={`react-gm-monitors-toggle ${pipelineExpanded ? "expanded" : ""}`}
          onClick={() => setPipelineExpanded((v) => !v)}
          aria-expanded={pipelineExpanded}
        >
          <span>Pipeline de prompts de escenarios</span>
          <span className="react-gm-monitors-toggle-arrow" aria-hidden="true">{pipelineExpanded ? "▲" : "▼"}</span>
        </button>
        {pipelineExpanded && (
          <iframe
            title="Pipeline de prompts"
            src={`${window.location.pathname}?screen=pipeline`}
            className="gm-pipeline-iframe"
          />
        )}
      </div>
    </main>
  );
}

function TestStepRow({ step, action, verify, passed }) {
  const icon = passed === true ? "✓" : passed === false ? "○" : "—";
  const cls = passed === true ? "solved" : "";
  return (
    <tr className={cls}>
      <td className="gm-test-status-cell">
        <span className={`gm-test-check ${passed === true ? "pass" : passed === false ? "pending" : "na"}`}>{icon}</span>
        {step}
      </td>
      <td>{action}</td>
      <td>{verify}</td>
    </tr>
  );
}

function TestScript({ sessionState, teamMetrics, puzzleState, gameState, ecoState, playerZones, queuedActions, availableOutputs, allPuzzlesSolved, currentSalaId }) {
  async function applyFirebasePreset(preset) {
    try {
      await firebasePatch("", preset);
    } catch {
      // silencioso
    }
  }

  const presetHorus = {
    "sessionState/salaId": "horus_run_force",
    "sessionState/zoneId": "inicio",
    "sessionState/completedSalas": ["sala1_el_cierre", "sala2_placeholder", "sala3_placeholder"],
    puzzleState: {},
    ecoState: {},
    playerZones: null,
  };

  const presetExamen = {
    "sessionState/salaId": "sala5_el_examen",
    "sessionState/zoneId": "inicio",
    "sessionState/completedSalas": ["sala1_el_cierre", "sala2", "sala3", "horus_run_force"],
    "sessionState/horusDecision": "integration",
    "sessionState/contradictionsFound": true,
    teamMetrics: { ecoCount: 5, forceCount: 1, analysisCount: 3, repairCount: 2, obedienceCount: 0, defyCount: 0 },
    playerZones: null,
  };

  // --- Derived checks from live state ---
  const pz = playerZones || {};
  const ps = puzzleState || {};
  const gs = gameState || {};
  const completedSalas = sessionState.completedSalas || [];
  const isHorusRoom = currentSalaId?.startsWith("horus_run_");
  const isSala1 = currentSalaId === "sala1_el_cierre";
  const isSala5Examen = currentSalaId === "sala5_el_examen";
  const isSala5Integration = currentSalaId === "sala5_integracion";
  const forceCount = teamMetrics.forceCount || 0;
  const analysisCount = teamMetrics.analysisCount || 0;
  const totalMetricActions = forceCount + analysisCount + (teamMetrics.repairCount || 0) + (teamMetrics.ecoCount || 0);
  const forcePercent = totalMetricActions > 0 ? (forceCount / totalMetricActions) * 100 : 0;

  // Block 1 checks
  const c1_1 = pz.empollon === "z1";
  const c1_2 = pz.manitas === "z4";
  const c1_3 = pz.empollon === "z1" && pz.manitas === "z4"; // empollon stays z1 while manitas is z4
  const c1_4 = pz.guaperas === "z1";
  const c1_5 = pz.mistica === "inicio";
  const c1_6 = pz.empollon === "inicio" && pz.guaperas === "z1";

  // Block 2 checks
  const c2_1 = pz.empollon === "z1" && !ps.p_protocol_order?.solved;
  const c2_2 = queuedActions.some((a) => a.role === "empollon" && a.card === "mirar_bien" && a.target === "panel");
  const c2_3 = gs.panelState !== "active"; // panelState changed from default
  const c2_4 = ps.p_protocol_order?.solved === true;
  const c2_5 = pz.manitas === "z2" && availableOutputs.includes("protocol_order");
  const c2_6 = pz.guaperas === "z3" && !availableOutputs.includes("energy_active");
  const c2_7 = ps.p_neutralize_sensor?.solved === true || ps.p_activate_power?.solved === true;
  const c2_8 = ps.p_open_exit?.solved === true && availableOutputs.includes("exit_open");

  // Block 3 checks
  const c3_1 = availableOutputs.includes("exit_open"); // eco triggers after exit puzzle
  const c3_2 = ecoState?.eco_sala1_01?.captured === true;

  // Block 4 checks
  const c4_2 = forceCount >= 3;
  const c4_3 = analysisCount >= 2;
  const c4_4 = forcePercent > 45;

  // Block 5 checks — individual puzzle resolution
  const c5_p1 = ps.p_protocol_order?.solved === true;
  const c5_p2 = ps.p_restore_energy?.solved === true;
  const c5_p3 = ps.p_neutralize_sensor?.solved === true;
  const c5_p4 = ps.p_open_exit?.solved === true;
  const c5_all = isSala1 && allPuzzlesSolved;
  const c5_completed = completedSalas.includes("sala1_el_cierre");
  const c5_salaChanged = !isSala1 && completedSalas.includes("sala1_el_cierre");

  // Block 6 checks
  const c6_1 = isHorusRoom;
  const c6_2 = isHorusRoom && pz.empollon === "z4";
  const c6_4 = sessionState.horusDecision === "integration";
  const c6_5 = isHorusRoom && pz.mistica === "z4" && c6_4;
  const c6_6 = isSala5Integration;

  // Block 7 checks
  const c7_1 = isSala5Examen;
  const c7_2 = isSala5Examen;

  return (
    <div className="gm-test-script-content">
      <h3>Atajos de testeo</h3>
      <p className="gm-test-hint">Estos botones parchean Firebase directamente para saltar a puntos concretos del juego.</p>
      <div className="button-row">
        <NButton variant="ghost" size="sm" onClick={() => applyFirebasePreset(presetHorus)}>
          Saltar a Horus (force)
        </NButton>
        <NButton variant="ghost" size="sm" onClick={() => applyFirebasePreset(presetExamen)}>
          Saltar a El Examen
        </NButton>
      </div>

      <h3>Bloque 1 — Navegacion por zonas (cada jugador independiente)</h3>
      <p className="gm-test-hint">Roles: <b>Empollon</b> (player=1), <b>Manitas</b> (player=2), <b>Guaperas</b> (player=3), <b>Mistica</b> (player=4). Cada jugador tiene barra de zonas propia.</p>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="1.1" passed={c1_1} action={<><b>Empollon</b>: pulsa <b>Z1 (Vestibulo)</b> en su barra de zonas</>} verify={<>Su mapa muestra solo hotspot <b>panel</b></>} />
          <TestStepRow step="1.2" passed={c1_2} action={<><b>Manitas</b>: pulsa <b>Z4 (Cuadro electrico)</b></>} verify={<>Su mapa muestra <b>electrical_box</b> + <b>locker</b></>} />
          <TestStepRow step="1.3" passed={c1_3} action={<>Verifica que Empollon sigue en Z1</>} verify={<>Empollon no cambio de zona — solo ve <b>panel</b></>} />
          <TestStepRow step="1.4" passed={c1_4} action={<><b>Guaperas</b>: pulsa <b>Z1</b></>} verify={<>Guaperas y Empollon ven el mismo mapa (Z1, panel)</>} />
          <TestStepRow step="1.5" passed={c1_5} action={<><b>Mistica</b>: pulsa <b>Inicio</b></>} verify={<>Sin hotspots (Inicio no tiene targets)</>} />
          <TestStepRow step="1.6" passed={c1_6} action={<><b>Empollon</b>: pulsa <b>Inicio</b></>} verify={<>Cambia a Inicio. Guaperas sigue en Z1 sin cambio</>} />
        </tbody>
      </table>

      <h3>Bloque 2 — Puzzles y dependencias</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="2.1" passed={c2_1} action={<><b>Empollon</b>: navega a <b>Z1</b>. GM mira panel puzzles</>} verify={<>"Orden del protocolo" pendiente, sin inputs</>} />
          <TestStepRow step="2.2" passed={c2_2} action={<><b>Empollon</b>: arrastra <b>mirar_bien</b> sobre <b>panel</b> + minijuego</>} verify={<>Accion encolada</>} />
          <TestStepRow step="2.3" passed={c2_3} action={<>GM: ejecuta <b>Pulse</b></>} verify={<>panelState cambia</>} />
          <TestStepRow step="2.4" passed={c2_4} action={<>GM: mira puzzles</>} verify={<>"Orden del protocolo" resuelto. protocol_order disponible</>} />
          <TestStepRow step="2.5" passed={c2_5} action={<><b>Manitas</b>: navega a <b>Z2</b>. GM mira puzzles</>} verify={<>"Neutralizar sensor" con input protocol_order satisfecho</>} />
          <TestStepRow step="2.6" passed={c2_6} action={<><b>Guaperas</b>: navega a <b>Z3</b>. GM mira puzzles</>} verify={<>"Abrir salida" bloqueado (faltan energy_active, system_active)</>} />
          <TestStepRow step="2.7" passed={c2_7} action={<><b>Manitas</b> en Z2: <b>apanar</b> sobre <b>sensor</b> + pulse. <b>Guaperas</b> en Z4: <b>a_lo_bestia</b> sobre <b>electrical_box</b> + pulse</>} verify={<>Cada puzzle cambia a resuelto</>} />
          <TestStepRow step="2.8" passed={c2_8} action={<><b>Guaperas</b>: navega a <b>Z3</b>, <b>empujar</b> sobre <b>door</b> + pulse</>} verify={<>Puzzle sintesis resuelto, exit_open en outputs</>} />
        </tbody>
      </table>

      <h3>Bloque 3 — Ecos y toast</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="3.1" passed={c3_1} action={<>Tras resolver "Abrir la salida"</>} verify={<>Toast en todos los jugadores: [ECO] "Esto ya ha pasado..." 4s</>} />
          <TestStepRow step="3.2" passed={c3_2} action={<>GM: mira panel ecos</>} verify={<>eco_sala1_01 → Capturado</>} />
          <TestStepRow step="3.3" passed={null} action={<>Abre ?screen=codex</>} verify={<>Tab Ecos: "Esto ya ha pasado..." listado</>} />
        </tbody>
      </table>

      <h3>Bloque 4 — Metricas de equipo</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="4.1" passed={null} action={<>GM: mira panel Metricas</>} verify={<>Contadores visibles: Fuerza, Analisis, Reparacion, Ecos</>} />
          <TestStepRow step="4.2" passed={c4_2} action={<><b>Guaperas</b>: <b>a_lo_bestia</b> sobre panel 3 veces + pulses</>} verify={<>Fuerza: {forceCount}/3</>} />
          <TestStepRow step="4.3" passed={c4_3} action={<><b>Empollon</b>: <b>mirar_bien</b> sobre panel 2 veces + pulses</>} verify={<>Analisis: {analysisCount}/2</>} />
          <TestStepRow step="4.4" passed={c4_4} action={<>GM: verifica badge de perfil</>} verify={<>"Los que fuerzan" si fuerza &gt; 45% (actual: {forcePercent.toFixed(0)}%)</>} />
        </tbody>
      </table>

      <h3>Bloque 5 — Resolver y completar Sala 1</h3>
      <p className="gm-test-hint">Orden de puzzles: Protocolo (Z1) y Energia (Z4) son independientes → Sensor (Z2) necesita protocol_order → Salida (Z3) necesita los tres.</p>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="5.1" passed={c5_p1} action={<><b>Empollon</b>: navega a <b>Z1</b>, arrastra <b>mirar_bien</b> sobre <b>panel</b>, completa minijuego. GM: <b>Pulse</b></>} verify={<>Puzzle "Orden del protocolo" resuelto. panelState: <b>{gs.panelState || "active"}</b></>} />
          <TestStepRow step="5.2" passed={c5_p2} action={<><b>Guaperas</b>: navega a <b>Z4</b>, arrastra <b>a_lo_bestia</b> sobre <b>locker</b>. GM: <b>Pulse</b></>} verify={<>Puzzle "Restaurar energia" resuelto. lockerState: <b>{gs.lockerState || "closed"}</b></>} />
          <TestStepRow step="5.3" passed={c5_p3} action={<><b>Manitas</b>: navega a <b>Z2</b>, arrastra <b>desmontar</b> sobre <b>sensor</b>. GM: <b>Pulse</b></>} verify={<>Puzzle "Neutralizar sensor" resuelto. sensorState: <b>{gs.sensorState || "active"}</b></>} />
          <TestStepRow step="5.4" passed={c5_p4} action={<><b>Guaperas</b>: navega a <b>Z3</b>, arrastra <b>empujar</b> sobre <b>door</b>. GM: <b>Pulse</b></>} verify={<>Puzzle "Abrir la salida" resuelto. doorState: <b>{gs.doorState || "closed"}</b></>} />
          <TestStepRow step="5.5" passed={c5_all} action={<>GM: verifica panel de puzzles</>} verify={<>Todos resueltos. Boton "Completar sala" visible</>} />
          <TestStepRow step="5.6" passed={c5_completed} action={<>GM: pulsa <b>"Completar sala"</b></>} verify={<>completedSalas incluye sala1_el_cierre</>} />
          <TestStepRow step="5.7" passed={c5_salaChanged} action={<>Todos los jugadores: barra de zonas se actualiza</>} verify={<>Sala actual: <b>{currentSalaId}</b></>} />
          <TestStepRow step="5.8" passed={null} action={<>GM: puzzles nuevos (todos pendientes)</>} verify={<>Metricas preservadas de Sala 1</>} />
          <TestStepRow step="5.9" passed={null} action={<>Cualquier jugador: verifica inventario</>} verify={<>Inventario vacio, usos de cartas mantienen conteo</>} />
        </tbody>
      </table>

      <h3>Bloque 6 — Ruta Horus</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="6.1" passed={c6_1} action={<>GM: usa boton "Saltar a Horus" arriba</>} verify={<>salaId: <b>{currentSalaId}</b></>} />
          <TestStepRow step="6.2" passed={c6_2} action={<><b>Empollon</b>: navega a <b>Z4 (Nucleo de decision)</b></>} verify={<>Hotspots: h_decision_panel + h_core_access</>} />
          <TestStepRow step="6.3" passed={null} action={<><b>Empollon</b>: ve panel de decision</>} verify={<>3 botones: Integracion, Rechazo, Simulacion</>} />
          <TestStepRow step="6.4" passed={c6_4} action={<><b>Empollon</b>: pulsa "Integracion"</>} verify={<>horusDecision: <b>{sessionState.horusDecision || "—"}</b></>} />
          <TestStepRow step="6.5" passed={c6_5} action={<><b>Mistica</b>: navega a <b>Z4</b></>} verify={<>Decision ya tomada (panel no aparece)</>} />
          <TestStepRow step="6.6" passed={c6_6} action={<>GM: completa sala</>} verify={<>salaId: <b>{currentSalaId}</b></>} />
        </tbody>
      </table>

      <h3>Bloque 7 — El Examen (ruta secreta)</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="7.1" passed={c7_1} action={<>GM: usa boton "Saltar a El Examen" arriba</>} verify={<>salaId: <b>{currentSalaId}</b></>} />
          <TestStepRow step="7.2" passed={c7_2} action={<>GM: verifica salaId</>} verify={<>sala5_el_examen (prioridad sobre decision)</>} />
          <TestStepRow step="7.3" passed={null} action={<><b>Cualquier jugador</b>: navega por zonas</>} verify={<>"Aula vacia", "Pupitres desordenados", etc.</>} />
        </tbody>
      </table>

      <h3>Bloque 8 — Codex cross-session</h3>
      <table className="gm-test-table">
        <thead><tr><th>Paso</th><th>Accion</th><th>Verificar</th></tr></thead>
        <tbody>
          <TestStepRow step="8.1" passed={null} action={<>Abre ?screen=codex</>} verify={<>Tab Ecos muestra ecos descubiertos</>} />
          <TestStepRow step="8.2" passed={null} action={<>Tab Conexiones</>} verify={<>Relaciones entre ecos (si hay 2+ del mismo nivel)</>} />
          <TestStepRow step="8.3" passed={null} action={<>Cierra y reabre navegador → ?screen=codex</>} verify={<>Ecos persisten (localStorage)</>} />
          <TestStepRow step="8.4" passed={null} action={<>Tab Partidas</>} verify={<>Session completada con fecha, salas, ecos</>} />
        </tbody>
      </table>
    </div>
  );
}
