import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Waves, Lock, Unlock, Radar, Zap } from "lucide-react";

const puzzleConfig = {
  title: "Sincronización de Ondas",
  subtitle: "Alinea amplitud, frecuencia y fase para estabilizar la señal.",
  tolerance: {
    amplitude: 0.08,
    frequency: 0.08,
    phase: 0.12,
  },
  channels: [
    {
      id: "alpha",
      label: "Canal Alfa",
      colorClass: "bg-sky-500",
      initial: { amplitude: 0.42, frequency: 1.18, phase: 0.18 },
      target: { amplitude: 0.68, frequency: 1.62, phase: 0.52 },
      hint: "Señal estable, pero aún baja de intensidad.",
    },
    {
      id: "beta",
      label: "Canal Beta",
      colorClass: "bg-violet-500",
      initial: { amplitude: 0.72, frequency: 0.94, phase: 0.78 },
      target: { amplitude: 0.48, frequency: 1.34, phase: 0.36 },
      hint: "Tiende a desfasarse antes que los demás.",
    },
    {
      id: "gamma",
      label: "Canal Gamma",
      colorClass: "bg-emerald-500",
      initial: { amplitude: 0.30, frequency: 1.72, phase: 0.64 },
      target: { amplitude: 0.58, frequency: 1.20, phase: 0.22 },
      hint: "Oscila demasiado rápido para acoplarse bien.",
    },
  ],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 100) / 100;

function distanceScore(current, target, tolerance) {
  const diff = Math.abs(current - target);
  if (diff <= tolerance) return 1;
  const maxRelevant = tolerance * 6;
  return clamp(1 - (diff - tolerance) / (maxRelevant - tolerance), 0, 1);
}

function paramLabel(score) {
  if (score >= 0.98) return "perfecto";
  if (score >= 0.8) return "casi";
  if (score >= 0.55) return "aceptable";
  return "lejos";
}

function channelSolved(channel, tolerance) {
  return (
    Math.abs(channel.amplitude - channel.target.amplitude) <= tolerance.amplitude &&
    Math.abs(channel.frequency - channel.target.frequency) <= tolerance.frequency &&
    Math.abs(channel.phase - channel.target.phase) <= tolerance.phase
  );
}

function wavePath(amplitude, frequency, phase, width = 420, height = 120) {
  const points = [];
  const centerY = height / 2;
  const ampPx = 16 + amplitude * 28;
  for (let x = 0; x <= width; x += 8) {
    const t = x / width;
    const y = centerY + Math.sin((t * Math.PI * 2 * frequency) + (phase * Math.PI * 2)) * ampPx;
    points.push(`${x},${round(y)}`);
  }
  return `M ${points.join(" L ")}`;
}

function getHint(channel, tolerance) {
  const amplitudeDelta = channel.target.amplitude - channel.amplitude;
  const frequencyDelta = channel.target.frequency - channel.frequency;
  const phaseDelta = channel.target.phase - channel.phase;

  const tips = [];

  if (Math.abs(amplitudeDelta) > tolerance.amplitude) {
    tips.push(amplitudeDelta > 0 ? "sube amplitud" : "baja amplitud");
  }
  if (Math.abs(frequencyDelta) > tolerance.frequency) {
    tips.push(frequencyDelta > 0 ? "sube frecuencia" : "baja frecuencia");
  }
  if (Math.abs(phaseDelta) > tolerance.phase) {
    tips.push(phaseDelta > 0 ? "avanza fase" : "retrasa fase");
  }

  return tips.length ? tips.join(" · ") : "canal alineado";
}

function ChannelCard({ channel, onChange, tolerance }) {
  const amplitudeScore = distanceScore(channel.amplitude, channel.target.amplitude, tolerance.amplitude);
  const frequencyScore = distanceScore(channel.frequency, channel.target.frequency, tolerance.frequency);
  const phaseScore = distanceScore(channel.phase, channel.target.phase, tolerance.phase);
  const solved = channelSolved(channel, tolerance);
  const syncPercent = Math.round(((amplitudeScore + frequencyScore + phaseScore) / 3) * 100);

  return (
    <Card className="rounded-3xl border-0 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{channel.label}</CardTitle>
            <CardDescription>{channel.hint}</CardDescription>
          </div>
          <Badge className={`rounded-full ${solved ? "bg-emerald-600" : "bg-slate-800"}`}>
            {solved ? <Unlock className="mr-1 h-3.5 w-3.5" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
            {solved ? "Sincronizado" : `${syncPercent}%`}
          </Badge>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-slate-950 p-3">
          <svg viewBox="0 0 420 120" className="h-32 w-full">
            <defs>
              <pattern id={`grid-${channel.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="420" height="120" fill={`url(#grid-${channel.id})`} />
            <path
              d={wavePath(channel.target.amplitude, channel.target.frequency, channel.target.phase)}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="3"
              strokeDasharray="8 8"
            />
            <motion.path
              d={wavePath(channel.amplitude, channel.frequency, channel.phase)}
              fill="none"
              stroke="white"
              strokeWidth="4"
              initial={false}
              animate={{ d: wavePath(channel.amplitude, channel.frequency, channel.phase) }}
              transition={{ duration: 0.18 }}
            />
          </svg>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Amplitud</div>
            <div className="text-lg font-bold">{round(channel.amplitude)}</div>
            <div className="text-xs text-slate-500">Objetivo: {channel.target.amplitude}</div>
            <div className="mt-2 text-xs font-medium text-slate-700">{paramLabel(amplitudeScore)}</div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Frecuencia</div>
            <div className="text-lg font-bold">{round(channel.frequency)}</div>
            <div className="text-xs text-slate-500">Objetivo: {channel.target.frequency}</div>
            <div className="mt-2 text-xs font-medium text-slate-700">{paramLabel(frequencyScore)}</div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Fase</div>
            <div className="text-lg font-bold">{round(channel.phase)}</div>
            <div className="text-xs text-slate-500">Objetivo: {channel.target.phase}</div>
            <div className="mt-2 text-xs font-medium text-slate-700">{paramLabel(phaseScore)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Amplitud</span>
              <span className="text-slate-500">0.10 — 1.00</span>
            </div>
            <Slider
              value={[channel.amplitude]}
              min={0.1}
              max={1}
              step={0.01}
              onValueChange={(value) => onChange(channel.id, "amplitude", value[0])}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Frecuencia</span>
              <span className="text-slate-500">0.50 — 2.00</span>
            </div>
            <Slider
              value={[channel.frequency]}
              min={0.5}
              max={2}
              step={0.01}
              onValueChange={(value) => onChange(channel.id, "frequency", value[0])}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Fase</span>
              <span className="text-slate-500">0.00 — 1.00</span>
            </div>
            <Slider
              value={[channel.phase]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => onChange(channel.id, "phase", value[0])}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-semibold">Pista dinámica:</span> {getHint(channel, tolerance)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PuzzleSincronizacionOndas() {
  const [channels, setChannels] = useState(() =>
    puzzleConfig.channels.map((channel) => ({ ...channel.initial, id: channel.id, label: channel.label, hint: channel.hint, target: channel.target, colorClass: channel.colorClass }))
  );
  const [booted, setBooted] = useState(false);
  const [flashSolved, setFlashSolved] = useState(false);
  const solvedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const totalSync = useMemo(() => {
    let total = 0;
    channels.forEach((channel) => {
      total += distanceScore(channel.amplitude, channel.target.amplitude, puzzleConfig.tolerance.amplitude);
      total += distanceScore(channel.frequency, channel.target.frequency, puzzleConfig.tolerance.frequency);
      total += distanceScore(channel.phase, channel.target.phase, puzzleConfig.tolerance.phase);
    });
    return Math.round((total / (channels.length * 3)) * 100);
  }, [channels]);

  const allSolved = useMemo(
    () => channels.every((channel) => channelSolved(channel, puzzleConfig.tolerance)),
    [channels]
  );

  useEffect(() => {
    if (allSolved && !solvedRef.current) {
      solvedRef.current = true;
      setFlashSolved(true);
      const timer = setTimeout(() => setFlashSolved(false), 1400);
      return () => clearTimeout(timer);
    }
    if (!allSolved) {
      solvedRef.current = false;
    }
  }, [allSolved]);

  const handleChange = (channelId, key, value) => {
    setChannels((prev) => prev.map((channel) => (channel.id === channelId ? { ...channel, [key]: round(value) } : channel)));
  };

  const handleReset = () => {
    setChannels(
      puzzleConfig.channels.map((channel) => ({ ...channel.initial, id: channel.id, label: channel.label, hint: channel.hint, target: channel.target, colorClass: channel.colorClass }))
    );
    setFlashSolved(false);
    solvedRef.current = false;
  };

  const handleNudge = () => {
    setChannels((prev) =>
      prev.map((channel) => ({
        ...channel,
        amplitude: round(channel.amplitude + (channel.target.amplitude - channel.amplitude) * 0.22),
        frequency: round(channel.frequency + (channel.target.frequency - channel.frequency) * 0.22),
        phase: round(channel.phase + (channel.target.phase - channel.phase) * 0.22),
      }))
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_65%)] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 18 }}
          transition={{ duration: 0.45 }}
        >
          <Card className={`overflow-hidden rounded-[2rem] border-0 bg-white/10 shadow-2xl backdrop-blur ${flashSolved ? "ring-2 ring-emerald-400" : ""}`}>
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sky-300">
                      <Waves className="h-5 w-5" />
                      <span className="text-sm font-semibold uppercase tracking-[0.24em]">Nodo resonante</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{puzzleConfig.title}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300 lg:text-base">{puzzleConfig.subtitle}</p>
                  </div>
                  <Badge className={`rounded-full px-4 py-2 text-sm ${allSolved ? "bg-emerald-500" : "bg-slate-800"}`}>
                    {allSolved ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    {allSolved ? "Sistema estabilizado" : "Bloqueo activo"}
                  </Badge>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                    <span className="font-semibold">Sincronización global</span>
                    <span>{totalSync}%</span>
                  </div>
                  <Progress value={totalSync} className="h-3" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {channels.map((channel) => {
                      const solved = channelSolved(channel, puzzleConfig.tolerance);
                      return (
                        <Badge key={channel.id} variant="outline" className={`rounded-full border-white/15 bg-white/5 ${solved ? "text-emerald-300" : "text-slate-300"}`}>
                          <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${channel.colorClass}`} />
                          {channel.label} · {solved ? "OK" : "Ajustando"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-300">
                    <Radar className="h-4 w-4" /> Estado
                  </div>
                  <p className="text-sm text-slate-300">
                    {allSolved
                      ? "Las tres señales han convergido dentro del margen permitido."
                      : "Aún hay desviaciones entre la señal actual y la señal objetivo."}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
                    <Zap className="h-4 w-4" /> Reglas
                  </div>
                  <p className="text-sm text-slate-300">
                    Ajusta amplitud, frecuencia y fase de cada canal hasta entrar en tolerancia.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:flex-col">
                  <Button onClick={handleNudge} className="rounded-2xl bg-sky-500 text-slate-950 hover:bg-sky-400">
                    Empuje asistido
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-3">
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} onChange={handleChange} tolerance={puzzleConfig.tolerance} />
          ))}
        </div>

        <Card className="rounded-3xl border-0 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Notas para modificar el puzle</CardTitle>
            <CardDescription>
              Cambia <code>puzzleConfig.channels</code> para redefinir objetivos, nombres y valores iniciales. Ajusta <code>tolerance</code> para hacerlo más duro o más permisivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="mb-2 font-semibold">Amplitud</div>
                <p>Controla la intensidad vertical de la onda. Ideal para dar sensación de potencia o estabilidad.</p>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="mb-2 font-semibold">Frecuencia</div>
                <p>Determina cuántos ciclos aparecen en la señal. Es la variable más legible visualmente.</p>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="mb-2 font-semibold">Fase</div>
                <p>Desplaza la señal sobre el tiempo. Es la parte más fina del ajuste y da buen cierre al reto.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
