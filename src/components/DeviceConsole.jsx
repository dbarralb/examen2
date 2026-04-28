import { useEffect, useRef, useState } from "react";

const DEFAULT_BOOT_LINES = [
  "Inicializando puerto fantasma...",
  "Buscando dispositivo en la red local...",
  "Handshake no autorizado detectado.",
  "Inyectando clave temporal  ▒▒▒▒▒▒▒▒▒▒",
  "Inyectando clave temporal  █████▒▒▒▒▒",
  "Inyectando clave temporal  ██████████",
  "Conexión interceptada.",
  "Canal seguro: comprometido.",
  "Acceso de operador concedido.",
];

const SYSTEM_COMMANDS = [
  "  /help    - Muestra esta ayuda.",
  "  /?       - Muestra esta ayuda.",
  "  clear    - Limpia la consola.",
  "  /exit    - Cierra la conexión con el dispositivo.",
  "  /salir   - Cierra la conexión con el dispositivo.",
];

const SEGURIDAD_SUBMENU = [
  "─── MENÚ DE SEGURIDAD ───",
  "  encender        — Activar sistema láser",
  "  apagar          — Desactivar sistema láser",
  "  modificar clave — Cambiar código de acceso",
  "",
  "Introduce tu selección:",
];

// Flow states:
// null                  → normal command mode
// "seguridad_menu"      → waiting for sub-command (encender / apagar / modificar clave)
// "seguridad_apagar_code" → waiting for the security code to disable laser

// deviceCommands: [{ name, description, hasArg?, argLabel?, response? }]
// commandResult: { id, lines, type } — parent pushes async results; new id triggers push
export function DeviceConsole({ deviceName = "Dispositivo desconocido", deviceCommands = [], bootLines, onCommand, onClose, commandResult }) {
  const resolvedBootLines = bootLines || DEFAULT_BOOT_LINES;
  const [bootIndex, setBootIndex] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [glitch, setGlitch] = useState(true);
  const [consoleFlow, setConsoleFlow] = useState(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const prompt = `${deviceName.replace(/\s+/g, "_").toUpperCase()}>`;

  // Boot sequence
  useEffect(() => {
    if (bootIndex >= resolvedBootLines.length) {
      const t = setTimeout(() => {
        setBootComplete(true);
        setGlitch(false);
        setHistory([
          { type: "system", text: `Sesión abierta con ${deviceName}.` },
          { type: "system", text: "Escribe /help o /? para ver los comandos disponibles." },
        ]);
        inputRef.current?.focus();
      }, 450);
      return () => clearTimeout(t);
    }
    const delay = bootIndex < 3 ? 420 : bootIndex < 6 ? 180 : 320;
    const t = setTimeout(() => setBootIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [bootIndex, deviceName, resolvedBootLines.length]);

  // Push async command results from parent
  useEffect(() => {
    if (!commandResult) return;
    setHistory((h) => [...h, ...commandResult.lines.map((text) => ({ type: commandResult.type || "system", text }))]);
    if (commandResult.nextFlow) setConsoleFlow(commandResult.nextFlow);
  }, [commandResult?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, bootIndex]);

  // Glitch loop
  useEffect(() => {
    const interval = setInterval(() => setGlitch((v) => !v), 1800);
    return () => clearInterval(interval);
  }, []);

  function pushLines(lines, type = "system") {
    setHistory((h) => [...h, ...lines.map((text) => ({ type, text }))]);
  }

  function doClose() {
    pushLines(["Cerrando conexión...", "Sesión terminada."], "system");
    setTimeout(() => onClose?.(), 600);
  }

  function submitCommand(event) {
    event.preventDefault();
    const raw = input.trim();
    if (!raw) return;

    setHistory([{ type: "input", text: `${prompt} ${raw}` }]);
    setInput("");

    const normalized = raw.trim().toLowerCase();

    setTimeout(() => {
      // ── Flow: waiting for sub-command in seguridad menu ──
      if (consoleFlow === "seguridad_menu") {
        setConsoleFlow(null);

        if (normalized === "apagar") {
          setConsoleFlow("seguridad_apagar_code");
          pushLines([
            "Sistema seleccionado: DESACTIVAR LÁSER",
            "Introduzca clave de seguridad:",
          ]);
          return;
        }

        if (normalized === "encender") {
          pushLines([
            "⚠ Función no disponible en modo intrusión.",
            "Solo el administrador puede activar el sistema.",
          ], "error");
          return;
        }

        if (normalized === "modificar clave" || normalized === "modificar_clave") {
          pushLines([
            "⚠ Función no disponible en modo intrusión.",
            "Se requiere autenticación de nivel 3.",
          ], "error");
          return;
        }

        pushLines([
          `Opción no reconocida: "${raw}"`,
          "Opciones válidas: encender / apagar / modificar clave",
        ], "error");
        return;
      }

      // ── Flow: waiting for security code ──
      if (consoleFlow === "seguridad_apagar_code") {
        setConsoleFlow(null);
        // Fire callback — parent validates the code and sends result via commandResult
        onCommand?.({ name: "seguridad_apagar", arg: raw, raw });
        pushLines(["Verificando clave...", "Procesando con sistema central..."]);
        return;
      }

      // ── Flow: retry prompt after wrong code ──
      if (consoleFlow === "seguridad_retry") {
        setConsoleFlow(null);
        if (normalized === "y" || normalized === "s") {
          setConsoleFlow("seguridad_apagar_code");
          pushLines(["Introduzca clave de seguridad:"]);
        } else {
          pushLines(["Operación cancelada."], "error");
        }
        return;
      }

      // ── System commands ──
      if (normalized === "/exit" || normalized === "/salir") {
        doClose();
        return;
      }

      if (normalized === "/help" || normalized === "/?") {
        pushLines([
          "Comandos disponibles:",
          ...deviceCommands.map((cmd) =>
            `  ${cmd.name.padEnd(12)}${cmd.hasArg ? `<${cmd.argLabel || "valor"}> ` : ""}— ${cmd.description}`
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

      // ── Device-specific commands ──
      const [cmdName, ...argParts] = raw.trim().split(/\s+/);
      const arg = argParts.join(" ");
      const cmd = deviceCommands.find((c) => c.name.toLowerCase() === cmdName.toLowerCase());

      if (cmd) {
        // Special: "seguridad" opens sub-menu
        if (cmd.name.toLowerCase() === "seguridad") {
          setConsoleFlow("seguridad_menu");
          pushLines(SEGURIDAD_SUBMENU, "help");
          return;
        }

        if (cmd.hasArg) {
          if (!arg) {
            pushLines([`Uso: ${cmd.name} <${cmd.argLabel || "valor"}>`, "Argumento requerido."], "error");
            return;
          }
          onCommand?.({ name: cmd.name, arg, raw });
          pushLines(["Procesando...", "Verificando con sistema central..."]);
          return;
        }

        onCommand?.({ name: cmd.name, arg: null, raw });
        pushLines(Array.isArray(cmd.response) ? cmd.response : [cmd.response || "Comando ejecutado."]);
        return;
      }

      pushLines([
        `Comando bloqueado: "${raw}"`,
        "Solo se aceptan comandos autorizados. Usa /help o /?",
      ], "error");
    }, 160);
  }

  function getPlaceholder() {
    if (!bootComplete) return "estableciendo conexión...";
    if (consoleFlow === "seguridad_apagar_code") return "Introduzca clave de seguridad...";
    if (consoleFlow === "seguridad_menu") return "encender / apagar / modificar clave...";
    if (consoleFlow === "seguridad_retry") return "Y / N";
    return "escribe un comando...";
  }

  return (
    <div className={`device-console ${glitch ? "device-console--glitch" : ""}`} onMouseDown={() => inputRef.current?.focus()}>
      {/* Scanlines overlay */}
      <div className="device-console-scanlines" aria-hidden="true" />

      <header className="device-console-header">
        <div className="device-console-header-icon" aria-hidden="true">▣</div>
        <div className="device-console-header-info">
          <strong>Conexión de dispositivo</strong>
          <span>{deviceName}</span>
        </div>
        <div className="device-console-header-right">
          <span className={`device-console-status-pill ${bootComplete ? "active" : "pending"}`}>
            {bootComplete ? "HACK ACTIVO" : "HACKEANDO"}
          </span>
          {onClose && (
            <button className="device-console-close" onClick={doClose} aria-label="Cerrar consola" type="button">
              ✕
            </button>
          )}
        </div>
      </header>

      <div className="device-console-body">
        {/* Main terminal */}
        <section className="device-console-terminal">
          <div className="device-console-terminal-bar">
            <span className="device-console-terminal-icon" aria-hidden="true">▰</span>
            <span>cmd://secure-link/session</span>
            {consoleFlow && (
              <span className="device-console-flow-badge">{consoleFlow === "seguridad_apagar_code" ? "CLAVE REQUERIDA" : "MENÚ ACTIVO"}</span>
            )}
          </div>

          <div className="device-console-output">
            {!bootComplete && (
              <div className="device-console-boot">
                {resolvedBootLines.slice(0, bootIndex).map((line, i) => (
                  <div key={i} className={`device-console-boot-line ${i > 1 && i < 7 ? "device-console-boot-line--mid" : ""}`}>
                    <span className="device-console-line-num">[{String(i + 1).padStart(2, "0")}]</span> {line}
                  </div>
                ))}
                <span className="device-console-cursor" aria-hidden="true">█</span>
              </div>
            )}

            {bootComplete && (
              <div className="device-console-history">
                {history.map((entry, i) => (
                  <p key={i} className={`device-console-line device-console-line--${entry.type}`}>
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
              onChange={(e) => setInput(e.target.value)}
              disabled={!bootComplete}
              className="device-console-input"
              placeholder={getPlaceholder()}
              autoComplete="off"
              spellCheck="false"
              aria-label="Entrada de comando"
            />
            <button
              type="submit"
              disabled={!bootComplete}
              className="device-console-send"
              aria-label="Enviar comando"
            >
              ↵
            </button>
          </form>
        </section>

        {/* Signal sidebar */}
        <aside className="device-console-sidebar">
          <div className="device-console-sidebar-title">
            <span aria-hidden="true">⚠</span> Intrusión
          </div>

          <div className="device-console-meters">
            <SignalMeter label="Señal" value={bootComplete ? 94 : Math.min(22 + bootIndex * 8, 88)} />
            <SignalMeter label="Ruido" value={bootComplete ? 37 : Math.min(12 + bootIndex * 9, 76)} />
            <SignalMeter label="Control" value={bootComplete ? 81 : Math.min(5 + bootIndex * 10, 69)} />
          </div>

          <div className="device-console-sidebar-note">
            <p className="device-console-sidebar-note-label">Notas</p>
            <p>La conexión parece legal desde fuera. Desde dentro, claramente no lo es.</p>
          </div>

          <div className="device-console-grid-cells" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="device-console-grid-cell" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
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
