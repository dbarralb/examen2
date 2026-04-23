import { useEffect, useMemo, useState } from "react";
import { NBadge, NButton, NCard, NProgress, NTimer, NewtonLogo } from "../components/newton";
import { forceStartDebugGame, getRemoteState, resetGame, startGame } from "../services/gmService.js";
import { startManualPulse } from "../services/pulseService.js";
import { getGameTimerElapsedSeconds, normalizeRemoteList } from "../services/remoteState.js";

function getSessionBadgeStatus(status) {
  return status === "in_game" ? "success" : "muted";
}

function getPulseBadgeStatus(status) {
  if (status === "executing") {
    return "warning";
  }

  if (status === "charging") {
    return "info";
  }

  return "muted";
}

function getPulseProgress(pulseState) {
  const now = Date.now();

  if (pulseState.status === "charging" && pulseState.pulseChargeStartedAt && pulseState.pulseChargeEndsAt) {
    return {
      label: "Aviso de pulso",
      value: now - pulseState.pulseChargeStartedAt,
      max: pulseState.pulseChargeEndsAt - pulseState.pulseChargeStartedAt,
    };
  }

  if (pulseState.status === "executing") {
    return {
      label: "Ejecución",
      value: 1,
      max: 1,
    };
  }

  return {
    label: "Pulso",
    value: 0,
    max: 1,
  };
}

export function GMScreen() {
  const [remoteState, setRemoteState] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Conectando con Firebase...");
  const [isBusy, setIsBusy] = useState(false);
  const [isPulseBusy, setIsPulseBusy] = useState(false);

  const session = remoteState?.session || {};
  const pulseState = remoteState?.pulseState || { status: "idle" };
  const lobbyClaims = useMemo(() => Object.values(remoteState?.lobby?.roleClaims || {}).filter(Boolean), [remoteState]);
  const queuedActions = useMemo(() => normalizeRemoteList(remoteState?.queuedActions), [remoteState]);
  const actionLog = useMemo(() => normalizeRemoteList(remoteState?.actionLog).slice(0, 6), [remoteState]);

  async function refresh() {
    const nextState = await getRemoteState();
    setRemoteState(nextState);
    setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
    setStatusMessage("Sincronizado.");
  }

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const nextState = await getRemoteState();

        if (cancelled) {
          return;
        }

        setRemoteState(nextState);
        setElapsedSeconds(getGameTimerElapsedSeconds(nextState.session?.gameTimer));
        setStatusMessage("Sincronizado.");
      } catch (error) {
        if (!cancelled) {
          setStatusMessage("No se pudo refrescar Firebase.");
        }
      }
    }

    tick();
    const remoteTimer = window.setInterval(tick, 1000);
    const clockTimer = window.setInterval(() => {
      setElapsedSeconds((current) => {
        const gameTimer = remoteState?.session?.gameTimer;
        return gameTimer?.status === "running" ? getGameTimerElapsedSeconds(gameTimer) : current;
      });
    }, 500);

    return () => {
      cancelled = true;
      window.clearInterval(remoteTimer);
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

  const pulseProgress = getPulseProgress(pulseState);

  return (
    <main className="react-screen react-gm-screen">
      <header className="react-screen-header">
        <NewtonLogo />
        <div>
          <NBadge status="info">Panel GM</NBadge>
          <h1>Control de sesión</h1>
        </div>
      </header>
      <section className="react-gm-grid">
        <NCard title="Partida" gold>
          <NBadge status={getSessionBadgeStatus(session.status)}>{session.status === "in_game" ? "Partida en curso" : "Sin comenzar"}</NBadge>
          <p className="session-code">Código: {session.accessCode || "sin generar"}</p>
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
          </div>
        </NCard>
        <NCard title="Cola de acciones" glow>
          <div className="gm-card-header-line">
            <NBadge status={getPulseBadgeStatus(pulseState.status)}>Pulso: {pulseState.status || "idle"}</NBadge>
            <span>{queuedActions.length} acciones</span>
          </div>
          {pulseState.status !== "idle" && (
            <NProgress value={pulseProgress.value} max={pulseProgress.max} label={pulseProgress.label} color={pulseState.status === "executing" ? "gold" : "blue"} />
          )}
          <div className="react-list">
            {queuedActions.length === 0 ? (
              <p>No hay acciones esperando pulso.</p>
            ) : (
              queuedActions.map((action) => (
                <article key={action.id || `${action.role}-${action.loadedAt}`} className="react-list-item">
                  <strong>{action.card} → {action.target}</strong>
                  <span>{action.player || action.role} · {action.status || "queued"}</span>
                </article>
              ))
            )}
          </div>
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
              <p>Sin historial todavía.</p>
            ) : (
              actionLog.map((message, index) => (
                <article key={`${message}-${index}`} className="react-list-item">
                  <span>{message}</span>
                </article>
              ))
            )}
          </div>
          <p className="react-status">Los monitores y resolución de pulsos se portarán en la siguiente fase.</p>
        </NCard>
      </section>
    </main>
  );
}
