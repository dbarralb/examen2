import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * RetroDeviceConsole
 * Ventana de consola retrofuturista para dispositivos conectables.
 *
 * Uso sugerido:
 * <RetroDeviceConsole
 *   deviceName="Panel de Seguridad"
 *   onClose={() => setConsoleOpen(false)}
 *   onCommand={(command) => console.log(command)}
 * />
 */

const COMMANDS = [
  {
    name: "Opcion1",
    description: "Ejecuta la primera acción genérica del dispositivo.",
    response: "Opcion1 aceptada. Módulo primario marcado como disponible.",
  },
  {
    name: "Opcion2",
    description: "Ejecuta la segunda acción genérica del dispositivo.",
    response: "Opcion2 aceptada. Rutina secundaria en espera de confirmación externa.",
  },
  {
    name: "Opcion3",
    description: "Ejecuta la tercera acción genérica del dispositivo.",
    response: "Opcion3 aceptada. Señal fantasma detectada en el bus de conexión.",
  },
];

const BOOT_LINES = [
  "Inicializando puerto fantasma...",
  "Buscando dispositivo en la red local...",
  "Handshake no autorizado detectado.",
  "Inyectando clave temporal █▒▒▒▒▒▒▒▒▒",
  "Inyectando clave temporal █████▒▒▒▒▒",
  "Inyectando clave temporal ██████████",
  "Conexión interceptada.",
  "Canal seguro: comprometido.",
  "Acceso de operador concedido.",
];

const HELP_TEXT = [
  "Comandos disponibles:",
  ...COMMANDS.map((cmd) => `  ${cmd.name.padEnd(8, " ")} - ${cmd.description}`),
  "",
  "Comandos de sistema:",
  "  /help    - Muestra esta ayuda.",
  "  /?       - Muestra esta ayuda.",
  "  clear    - Limpia la consola.",
];

function normalizeCommand(value) {
  return value.trim().toLowerCase();
}

function getCommand(value) {
  const normalized = normalizeCommand(value);
  return COMMANDS.find((cmd) => cmd.name.toLowerCase() === normalized);
}

export default function RetroDeviceConsole({
  deviceName = "Dispositivo desconocido",
  onClose,
  onCommand,
}) {
  const [bootComplete, setBootComplete] = useState(false);
  const [bootIndex, setBootIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [isGlitching, setIsGlitching] = useState(true);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const prompt = useMemo(() => `${deviceName.replace(/\s+/g, "_").toUpperCase()}>`, [deviceName]);

  useEffect(() => {
    if (bootIndex >= BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setBootComplete(true);
        setIsGlitching(false);
        setHistory([
          { type: "system", text: `Sesión abierta con ${deviceName}.` },
          { type: "system", text: "Escribe /help o /? para ver los comandos disponibles." },
        ]);
        inputRef.current?.focus();
      }, 450);
      return () => clearTimeout(timer);
    }

    const delay = bootIndex < 3 ? 420 : bootIndex < 6 ? 180 : 320;
    const timer = setTimeout(() => setBootIndex((value) => value + 1), delay);
    return () => clearTimeout(timer);
  }, [bootIndex, deviceName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, bootIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching((value) => !value);
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  function pushLines(lines, type = "system") {
    setHistory((current) => [
      ...current,
      ...lines.map((line) => ({ type, text: line })),
    ]);
  }

  function submitCommand(event) {
    event.preventDefault();
    const rawCommand = input.trim();
    if (!rawCommand) return;

    setHistory((current) => [...current, { type: "input", text: `${prompt} ${rawCommand}` }]);
    setInput("");

    const normalized = normalizeCommand(rawCommand);

    setTimeout(() => {
      if (normalized === "/help" || normalized === "/?") {
        pushLines(HELP_TEXT, "help");
        return;
      }

      if (normalized === "clear") {
        setHistory([]);
        return;
      }

      const command = getCommand(rawCommand);
      if (command) {
        onCommand?.(command.name);
        pushLines([
          "Ejecutando protocolo...",
          command.response,
          "Estado: OK // respuesta del dispositivo recibida.",
        ]);
        return;
      }

      pushLines([
        `Comando bloqueado: "${rawCommand}"`,
        "Esta consola solo acepta comandos autorizados. Usa /help o /?",
      ], "error");
    }, 180);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 24 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 font-mono text-lime-100"
      onMouseDown={() => inputRef.current?.focus()}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(132,255,99,0.13),transparent_55%)]" />
        <div className="scanlines absolute inset-0 opacity-25" />
      </div>

      <motion.section
        animate={isGlitching ? { x: [0, -1, 1, 0] } : { x: 0 }}
        transition={{ duration: 0.12 }}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-4 border-lime-300/70 bg-zinc-950 shadow-[0_0_45px_rgba(132,255,99,0.26)]"
      >
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_18%,transparent_82%,rgba(255,255,255,0.05))]" />
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

        <header className="relative flex items-center justify-between border-b-4 border-lime-300/60 bg-lime-300 px-4 py-3 text-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border-2 border-zinc-950 bg-zinc-950 p-1 text-lime-300 shadow-[3px_3px_0_rgba(0,0,0,0.45)]">
              <span className="text-lg leading-none">▣</span>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest">Conexión de dispositivo</h2>
              <p className="text-xs font-bold uppercase tracking-wide opacity-75">{deviceName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill bootComplete={bootComplete} />
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border-2 border-zinc-950 bg-zinc-950 p-2 text-lime-300 shadow-[3px_3px_0_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
                aria-label="Cerrar consola"
              >
                <span className="text-sm font-black leading-none">X</span>
              </button>
            )}
          </div>
        </header>

        <main className="relative grid gap-4 p-4 md:grid-cols-[1fr_220px]">
          <section className="min-h-[430px] rounded-xl border-2 border-lime-300/40 bg-black/80 p-4 shadow-inner">
            <div className="mb-3 flex items-center gap-2 border-b border-lime-300/20 pb-3 text-xs uppercase tracking-[0.3em] text-lime-300/80">
              <span className="text-sm leading-none">▰</span>
              <span>cmd://secure-link/session</span>
            </div>

            <div className="h-[330px] overflow-y-auto pr-2 text-sm leading-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-lime-300/40">
              {!bootComplete && (
                <div className="space-y-1">
                  <AnimatePresence>
                    {BOOT_LINES.slice(0, bootIndex).map((line, index) => (
                      <motion.div
                        key={`${line}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={index > 1 && index < 7 ? "text-cyan-100" : "text-lime-100"}
                      >
                        <span className="text-lime-300">[{String(index + 1).padStart(2, "0")}]</span> {line}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <BlinkingCursor />
                </div>
              )}

              {bootComplete && (
                <div className="space-y-1">
                  {history.map((entry, index) => (
                    <ConsoleLine key={`${entry.text}-${index}`} entry={entry} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={submitCommand} className="mt-4 flex items-center gap-2 border-t border-lime-300/20 pt-3">
              <span className="select-none text-lime-300">{prompt}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!bootComplete}
                className="min-w-0 flex-1 bg-transparent text-lime-50 outline-none placeholder:text-lime-300/35 disabled:opacity-40"
                placeholder={bootComplete ? "escribe un comando..." : "estableciendo conexión..."}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={!bootComplete}
                className="rounded-lg border border-lime-300/50 px-3 py-2 text-lime-300 transition hover:bg-lime-300 hover:text-zinc-950 disabled:opacity-30"
                aria-label="Enviar comando"
              >
                <span className="text-sm font-black leading-none">↵</span>
              </button>
            </form>
          </section>

          <aside className="rounded-xl border-2 border-cyan-200/40 bg-cyan-950/30 p-4 text-xs text-cyan-50 shadow-inner">
            <div className="mb-4 flex items-center gap-2 text-cyan-200">
              <span className="text-lg leading-none">⚠</span>
              <h3 className="font-black uppercase tracking-widest">Intrusión</h3>
            </div>

            <div className="space-y-3">
              <SignalMeter label="Señal" value={bootComplete ? 94 : Math.min(22 + bootIndex * 8, 88)} />
              <SignalMeter label="Ruido" value={bootComplete ? 37 : Math.min(12 + bootIndex * 9, 76)} />
              <SignalMeter label="Control" value={bootComplete ? 81 : Math.min(5 + bootIndex * 10, 69)} />
            </div>

            <div className="mt-5 rounded-lg border border-cyan-200/30 bg-black/40 p-3">
              <p className="mb-2 font-bold uppercase text-cyan-200">Notas</p>
              <p className="leading-5 text-cyan-50/80">
                La conexión parece legal desde fuera. Desde dentro, claramente no lo es.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((cell) => (
                <motion.div
                  key={cell}
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: cell * 0.12 }}
                  className="h-8 rounded border border-cyan-200/30 bg-cyan-200/10"
                />
              ))}
            </div>
          </aside>
        </main>
      </motion.section>

      <style>{`
        .scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.08),
            rgba(255,255,255,0.08) 1px,
            transparent 1px,
            transparent 4px
          );
        }
      `}</style>
    </motion.div>
  );
}

function StatusPill({ bootComplete }) {
  return (
    <div className="hidden items-center gap-2 rounded-full border-2 border-zinc-950 bg-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-wider text-lime-300 shadow-[3px_3px_0_rgba(0,0,0,0.45)] sm:flex">
      <span className="text-xs leading-none">≋</span>
      {bootComplete ? "Hack activo" : "Hackeando"}
    </div>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 0.9 }}
      className="inline-block text-lime-300"
    >
      █
    </motion.span>
  );
}

function ConsoleLine({ entry }) {
  const className = {
    input: "text-cyan-200",
    error: "text-rose-300",
    help: "text-amber-100",
    system: "text-lime-100",
  }[entry.type] || "text-lime-100";

  return <p className={`${className} whitespace-pre-wrap`}>{entry.text}</p>;
}

function SignalMeter({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-bold uppercase tracking-wider text-cyan-200">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-cyan-200/40 bg-black/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-full bg-cyan-200"
        />
      </div>
    </div>
  );
}
