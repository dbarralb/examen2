import { useEffect, useRef, useState } from "react";

const DEFAULT_BOOT_LINES = [
  "Inicializando enlace local...",
  "Buscando dispositivo en la red del instituto...",
  "Interferencia detectada en el canal.",
  "Canal de mantenimiento disponible.",
  "Conexion establecida.",
];

const SYSTEM_COMMANDS = [
  "  /help    - Muestra esta ayuda.",
  "  /?       - Muestra esta ayuda.",
  "  clear    - Limpia la consola.",
  "  /exit    - Cierra la conexion con el dispositivo.",
  "  /salir   - Cierra la conexion con el dispositivo.",
];

// deviceCommands: [{ name, description, hasArg?, argLabel?, response? }]
// commandResult: { id, lines, type } - parent pushes async results; new id triggers push
export function DeviceConsole({ deviceName = "Dispositivo desconocido", deviceCommands = [], bootLines, onCommand, onClose, commandResult }) {
  const resolvedBootLines = bootLines || DEFAULT_BOOT_LINES;
  const [bootIndex, setBootIndex] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [glitch, setGlitch] = useState(true);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const prompt = `${deviceName.replace(/\s+/g, "_").toUpperCase()}>`;

  useEffect(() => {
    if (bootIndex >= resolvedBootLines.length) {
      const timer = setTimeout(() => {
        setBootComplete(true);
        setGlitch(false);
        setHistory([
          { type: "system", text: `Sesion abierta con ${deviceName}.` },
          { type: "system", text: "Escribe /help o /? para ver los comandos disponibles." },
        ]);
        inputRef.current?.focus();
      }, 450);
      return () => clearTimeout(timer);
    }

    const delay = bootIndex < 3 ? 420 : 220;
    const timer = setTimeout(() => setBootIndex((current) => current + 1), delay);
    return () => clearTimeout(timer);
  }, [bootIndex, deviceName, resolvedBootLines.length]);

  useEffect(() => {
    if (!commandResult) return;
    setHistory((current) => [
      ...current,
      ...commandResult.lines.map((text) => ({ type: commandResult.type || "system", text })),
    ]);
  }, [commandResult?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, bootIndex]);

  useEffect(() => {
    const interval = setInterval(() => setGlitch((current) => !current), 1800);
    return () => clearInterval(interval);
  }, []);

  function pushLines(lines, type = "system") {
    setHistory((current) => [...current, ...lines.map((text) => ({ type, text }))]);
  }

  function doClose() {
    pushLines(["Cerrando conexion...", "Sesion terminada."], "system");
    setTimeout(() => onClose?.(), 600);
  }

  function submitCommand(event) {
    event.preventDefault();
    const raw = input.trim();
    if (!raw) return;

    setHistory((current) => [...current, { type: "input", text: `${prompt} ${raw}` }]);
    setInput("");

    const normalized = raw.toLowerCase();

    setTimeout(() => {
      if (normalized === "/exit" || normalized === "/salir") {
        doClose();
        return;
      }

      if (normalized === "/help" || normalized === "/?") {
        pushLines([
          "Comandos disponibles:",
          ...deviceCommands.map((cmd) =>
            `  ${cmd.name.padEnd(14)}${cmd.hasArg ? `<${cmd.argLabel || "valor"}> ` : ""}- ${cmd.description}`
          ),
          "",
          "Comandos de sistema:",
          ...SYSTEM_COMMANDS,
        ], "help");
        return;
      }

      if (normalized === "clear") {
        setHistory([]);
        return;
      }

      const [cmdName, ...argParts] = raw.split(/\s+/);
      const arg = argParts.join(" ");
      const cmd = deviceCommands.find((candidate) => candidate.name.toLowerCase() === cmdName.toLowerCase());

      if (!cmd) {
        pushLines([
          `Comando bloqueado: "${raw}"`,
          "Solo se aceptan comandos autorizados. Usa /help o /?",
        ], "error");
        return;
      }

      if (cmd.hasArg && !arg) {
        pushLines([`Uso: ${cmd.name} <${cmd.argLabel || "valor"}>`, "Argumento requerido."], "error");
        return;
      }

      if (cmd.response) {
        pushLines(Array.isArray(cmd.response) ? cmd.response : [cmd.response]);
      } else {
        onCommand?.({ ...cmd, arg: cmd.hasArg ? arg : null, raw });
        pushLines(["Procesando...", "Esperando respuesta del sistema central..."]);
      }
    }, 160);
  }

  return (
    <div className={`device-console ${glitch ? "device-console--glitch" : ""}`} onMouseDown={() => inputRef.current?.focus()}>
      <div className="device-console-scanlines" aria-hidden="true" />

      <header className="device-console-header">
        <div className="device-console-header-icon" aria-hidden="true">#</div>
        <div className="device-console-header-info">
          <strong>Conexion de dispositivo</strong>
          <span>{deviceName}</span>
        </div>
        <div className="device-console-header-right">
          <span className={`device-console-status-pill ${bootComplete ? "active" : "pending"}`}>
            {bootComplete ? "ENLACE ACTIVO" : "CONECTANDO"}
          </span>
          {onClose && (
            <button className="device-console-close" onClick={doClose} aria-label="Cerrar consola" type="button">
              x
            </button>
          )}
        </div>
      </header>

      <div className="device-console-body">
        <section className="device-console-terminal">
          <div className="device-console-terminal-bar">
            <span className="device-console-terminal-icon" aria-hidden="true">&gt;</span>
            <span>cmd://local-link/session</span>
          </div>

          <div className="device-console-output">
            {!bootComplete && (
              <div className="device-console-boot">
                {resolvedBootLines.slice(0, bootIndex).map((line, index) => (
                  <div key={index} className="device-console-boot-line">
                    <span className="device-console-line-num">[{String(index + 1).padStart(2, "0")}]</span> {line}
                  </div>
                ))}
                <span className="device-console-cursor" aria-hidden="true">#</span>
              </div>
            )}

            {bootComplete && (
              <div className="device-console-history">
                {history.map((entry, index) => (
                  <p key={index} className={`device-console-line device-console-line--${entry.type}`}>
                    {entry.text}
                  </p>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form className="device-console-input-row" onSubmit={submitCommand}>
            <span className="device-console-prompt" aria-hidden="true">{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!bootComplete}
              className="device-console-input"
              placeholder={bootComplete ? "escribe un comando..." : "estableciendo conexion..."}
              autoComplete="off"
              spellCheck="false"
              aria-label="Entrada de comando"
            />
            <button type="submit" disabled={!bootComplete} className="device-console-send" aria-label="Enviar comando">
              Enter
            </button>
          </form>
        </section>

        <aside className="device-console-sidebar">
          <div className="device-console-sidebar-title">
            <span aria-hidden="true">!</span> Enlace
          </div>

          <div className="device-console-meters">
            <SignalMeter label="Senal" value={bootComplete ? 94 : Math.min(22 + bootIndex * 8, 88)} />
            <SignalMeter label="Ruido" value={bootComplete ? 37 : Math.min(12 + bootIndex * 9, 76)} />
            <SignalMeter label="Control" value={bootComplete ? 81 : Math.min(5 + bootIndex * 10, 69)} />
          </div>

          <div className="device-console-sidebar-note">
            <p className="device-console-sidebar-note-label">Notas</p>
            <p>La conexion muestra datos parciales. Comparadlos antes de confiar en ellos.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SignalMeter({ label, value }) {
  return (
    <div className="device-console-meter">
      <div className="device-console-meter-header">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="device-console-meter-track">
        <div className="device-console-meter-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
