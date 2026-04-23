import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertTriangle, XCircle, Search, DoorOpen, Siren, FileText, Sparkles } from "lucide-react";

const puzzleData = {
  meta: {
    id: "gym-mvp",
    title: "El Examen II · Gimnasio MVP",
    subtitle: "Organigrama editable para GM",
  },
  objects: [
    { id: "panel", label: "Panel", initial: "active" },
    { id: "sensor", label: "Sensor", initial: "active" },
    { id: "locker", label: "Taquilla", initial: "closed" },
    { id: "door", label: "Puerta", initial: "closed" },
    { id: "electrical_box", label: "Cuadro eléctrico", initial: "idle" },
    { id: "sports_gear", label: "Material deportivo", initial: "idle" },
  ],
  actions: [
    { id: "mirar_bien", role: "El Empollón", targets: ["panel", "door"] },
    { id: "consultar_apuntes", role: "El Empollón", targets: ["panel"] },
    { id: "apañar", role: "La Manitas", targets: ["locker"] },
    { id: "puenteo_rapido", role: "La Manitas", targets: ["panel"] },
    { id: "desmontar", role: "La Manitas", targets: ["sensor"] },
    { id: "a_lo_bestia", role: "El guaperas", targets: ["locker", "door"] },
    { id: "empujar", role: "El guaperas", targets: ["door"] },
    { id: "y_si", role: "La Mística", targets: ["locker", "sensor"] },
    { id: "esto_vibra_raro", role: "La Mística", targets: ["sensor"] },
    { id: "ritual_improvisado", role: "La Mística", targets: ["sensor"] },
  ],
  routes: [
    {
      id: "ruta-optima",
      name: "Ruta óptima",
      grade: "ideal",
      summary: "Salida limpia, nota completa y pista oculta.",
      steps: [
        "El Empollón · mirar_bien → panel",
        "La Manitas · desmontar → sensor",
        "La Manitas · apañar → locker",
        "El guaperas · a_lo_bestia → locker",
        "El Empollón · mirar_bien → door",
        "El guaperas · empujar → door",
      ],
      outcomes: [
        "doorState = clean_open",
        "sensorState = disabled",
        "noteState = complete",
        "hiddenRouteFlag = true",
        "alarmState = off",
      ],
    },
    {
      id: "ruta-alternativa-mistica",
      name: "Ruta alternativa con La Mística",
      grade: "ideal",
      summary: "La Mística abre taquilla y engaña el sensor; salida limpia con nota completa.",
      steps: [
        "El Empollón · consultar_apuntes → panel",
        "El Empollón · mirar_bien → door",
        "La Mística · y_si → locker",
        "La Mística · esto_vibra_raro → sensor",
        "La Mística · y_si → sensor",
        "El guaperas · empujar → door",
      ],
      outcomes: [
        "doorState = clean_open",
        "sensorState = fooled",
        "noteState = complete",
        "hiddenRouteFlag = true",
        "alarmState = off",
      ],
    },
    {
      id: "ruta-parcial",
      name: "Ruta parcial",
      grade: "mixed",
      summary: "Se avanza, pero sin recompensa narrativa completa.",
      steps: [
        "El Empollón · consultar_apuntes → panel",
        "La Manitas · desmontar → sensor",
        "El guaperas · empujar → door",
      ],
      outcomes: [
        "doorState = forced_open",
        "alarmState = off",
        "noteState = hidden",
        "hiddenRouteFlag = false",
      ],
    },
    {
      id: "ruta-caotica",
      name: "Ruta caótica",
      grade: "bad",
      summary: "Se sale, pero rompiendo la sala y disparando consecuencias.",
      steps: [
        "El guaperas · a_lo_bestia → door",
        "La Mística · y_si → locker",
        "La Manitas · puenteo_rapido → panel",
      ],
      outcomes: [
        "doorState = forced_open",
        "alarmState = on",
        "noteState = complete",
        "hiddenRouteFlag = false",
      ],
    },
  ],
  decisionGraph: {
    nodes: [
      {
        id: "start",
        title: "Inicio de sala",
        text: "Panel activo, sensor activo, taquilla cerrada, puerta cerrada.",
        kind: "state",
        x: 60,
        y: 80,
      },
      {
        id: "panel-understood",
        title: "Panel entendido",
        text: "El Empollón interpreta el protocolo.",
        kind: "good",
        x: 380,
        y: 40,
      },
      {
        id: "panel-tampered",
        title: "Panel manipulado",
        text: "Bypass posible; si no se entendió antes, puede activar alerta.",
        kind: "warning",
        x: 380,
        y: 180,
      },
      {
        id: "sensor-disabled",
        title: "Sensor inutilizado",
        text: "La Manitas desmonta el sensor.",
        kind: "good",
        x: 740,
        y: 40,
      },
      {
        id: "sensor-pattern",
        title: "Patrón detectado",
        text: "La Mística detecta cómo engañarlo.",
        kind: "state",
        x: 740,
        y: 180,
      },
      {
        id: "sensor-fooled",
        title: "Sensor engañado",
        text: "La Mística logra una resolución alternativa buena.",
        kind: "good",
        x: 1080,
        y: 180,
      },
      {
        id: "locker-prepared",
        title: "Taquilla preparada",
        text: "La Manitas afloja la cerradura.",
        kind: "good",
        x: 380,
        y: 360,
      },
      {
        id: "locker-clean",
        title: "Taquilla abierta limpia",
        text: "Nota completa obtenida.",
        kind: "good",
        x: 740,
        y: 360,
      },
      {
        id: "locker-broken",
        title: "Taquilla reventada",
        text: "Nota parcial. Pérdida narrativa.",
        kind: "bad",
        x: 740,
        y: 500,
      },
      {
        id: "door-prepared",
        title: "Puerta preparada",
        text: "El Empollón detecta cómo empujar sin forzar.",
        kind: "good",
        x: 1080,
        y: 40,
      },
      {
        id: "door-clean-open",
        title: "Salida limpia",
        text: "Se abre sin destrozar la sala.",
        kind: "good",
        x: 1420,
        y: 40,
      },
      {
        id: "door-forced-open",
        title: "Salida brusca",
        text: "Se avanza, pero el sistema lo registra mal.",
        kind: "warning",
        x: 1420,
        y: 220,
      },
      {
        id: "alarm-on",
        title: "Alarma activa",
        text: "Castigo funcional y tono caótico.",
        kind: "bad",
        x: 1420,
        y: 400,
      },
      {
        id: "hidden-route",
        title: "Pista oculta desbloqueada",
        text: "Requiere salida limpia + nota completa.",
        kind: "good",
        x: 1760,
        y: 40,
      },
    ],
    edges: [
      { from: "start", to: "panel-understood", label: "mirar_bien / consultar_apuntes → panel" },
      { from: "start", to: "panel-tampered", label: "puenteo_rapido → panel" },
      { from: "start", to: "sensor-disabled", label: "desmontar → sensor" },
      { from: "start", to: "sensor-pattern", label: "esto_vibra_raro / ritual_improvisado → sensor" },
      { from: "sensor-pattern", to: "sensor-fooled", label: "y_si → sensor" },
      { from: "start", to: "locker-prepared", label: "apañar → locker" },
      { from: "locker-prepared", to: "locker-clean", label: "a_lo_bestia → locker" },
      { from: "start", to: "locker-clean", label: "y_si → locker" },
      { from: "start", to: "locker-broken", label: "a_lo_bestia → locker sin preparar" },
      { from: "start", to: "door-prepared", label: "mirar_bien → door" },
      { from: "panel-understood", to: "door-clean-open", label: "empujar → door, si sensor resuelto + puerta preparada" },
      { from: "sensor-disabled", to: "door-clean-open", label: "condición válida" },
      { from: "sensor-fooled", to: "door-clean-open", label: "condición válida" },
      { from: "door-prepared", to: "door-clean-open", label: "condición válida" },
      { from: "sensor-disabled", to: "door-forced-open", label: "empujar sin preparación completa" },
      { from: "sensor-fooled", to: "door-forced-open", label: "empujar sin preparación completa" },
      { from: "start", to: "door-forced-open", label: "a_lo_bestia → door" },
      { from: "panel-tampered", to: "alarm-on", label: "si no estaba entendido antes" },
      { from: "door-forced-open", to: "alarm-on", label: "si sensor o panel seguían activos" },
      { from: "door-clean-open", to: "hidden-route", label: "si nota completa = true" },
      { from: "locker-clean", to: "hidden-route", label: "completa requisito narrativo" },
    ],
  },
};

const kindStyles = {
  state: "border-slate-300 bg-white text-slate-900",
  good: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  bad: "border-rose-300 bg-rose-50 text-rose-900",
};

const gradeMeta = {
  ideal: {
    label: "Buena",
    icon: CheckCircle2,
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  mixed: {
    label: "Parcial",
    icon: AlertTriangle,
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  bad: {
    label: "Caótica",
    icon: XCircle,
    className: "border-rose-300 bg-rose-50 text-rose-900",
  },
};

function edgePath(from, to) {
  const startX = from.x + 220;
  const startY = from.y + 54;
  const endX = to.x;
  const endY = to.y + 54;
  const midX = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}

function FlowNode({ node, active, onClick }) {
  const Icon =
    node.kind === "good" ? CheckCircle2 : node.kind === "warning" ? AlertTriangle : node.kind === "bad" ? XCircle : Sparkles;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(node.id)}
      className={`absolute w-[220px] rounded-2xl border p-4 text-left shadow-sm transition ${kindStyles[node.kind]} ${
        active ? "ring-2 ring-slate-900" : ""
      }`}
      style={{ left: node.x, top: node.y }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold leading-tight">{node.title}</div>
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <p className="text-xs leading-relaxed opacity-90">{node.text}</p>
    </motion.button>
  );
}

function RouteCard({ route }) {
  const meta = gradeMeta[route.grade];
  const Icon = meta.icon;

  return (
    <Card className={`rounded-2xl border shadow-sm ${meta.className}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{route.name}</CardTitle>
          <Badge variant="outline" className="rounded-full bg-white/70">
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
          </Badge>
        </div>
        <CardDescription className="text-current/80">{route.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Secuencia</p>
          <div className="space-y-2">
            {route.steps.map((step, index) => (
              <div key={step} className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/10 text-[11px] font-semibold">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Resultado</p>
          <div className="flex flex-wrap gap-2">
            {route.outcomes.map((outcome) => (
              <Badge key={outcome} variant="secondary" className="rounded-full bg-white/80 text-slate-900">
                {outcome}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganigramaGMGimnasio() {
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("start");
  const [routeFilter, setRouteFilter] = useState("all");

  const filteredRoutes = useMemo(() => {
    return puzzleData.routes.filter((route) => {
      const matchesFilter = routeFilter === "all" ? true : route.grade === routeFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        route.name.toLowerCase().includes(q) ||
        route.summary.toLowerCase().includes(q) ||
        route.steps.some((step) => step.toLowerCase().includes(q)) ||
        route.outcomes.some((outcome) => outcome.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [query, routeFilter]);

  const selectedNode =
    puzzleData.decisionGraph.nodes.find((node) => node.id === selectedNodeId) || puzzleData.decisionGraph.nodes[0];

  const linkedEdges = puzzleData.decisionGraph.edges.filter(
    (edge) => edge.from === selectedNodeId || edge.to === selectedNodeId
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto grid max-w-[1800px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{puzzleData.meta.title}</CardTitle>
              <CardDescription>{puzzleData.meta.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ruta, acción o estado"
                  className="rounded-2xl pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={routeFilter === "all" ? "default" : "outline"} className="rounded-full" onClick={() => setRouteFilter("all")}>
                  Todas
                </Button>
                <Button variant={routeFilter === "ideal" ? "default" : "outline"} className="rounded-full" onClick={() => setRouteFilter("ideal")}>
                  Buenas
                </Button>
                <Button variant={routeFilter === "mixed" ? "default" : "outline"} className="rounded-full" onClick={() => setRouteFilter("mixed")}>
                  Parciales
                </Button>
                <Button variant={routeFilter === "bad" ? "default" : "outline"} className="rounded-full" onClick={() => setRouteFilter("bad")}>
                  Caóticas
                </Button>
              </div>
              <Separator />
              <div className="grid gap-3">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Objetos</p>
                  <div className="flex flex-wrap gap-2">
                    {puzzleData.objects.map((object) => (
                      <Badge key={object.id} variant="secondary" className="rounded-full">
                        {object.label}: {object.initial}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones implementadas</p>
                  <div className="space-y-2">
                    {puzzleData.actions.map((action) => (
                      <div key={action.id} className="rounded-xl border bg-white px-3 py-2 text-sm">
                        <div className="font-medium">{action.role} · {action.id}</div>
                        <div className="text-xs text-slate-500">Targets: {action.targets.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Nodo seleccionado</CardTitle>
              <CardDescription>Pulsa cualquier bloque del organigrama para ver conexiones directas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-2xl border p-4 ${kindStyles[selectedNode.kind]}`}>
                <div className="mb-2 text-sm font-semibold">{selectedNode.title}</div>
                <p className="text-sm opacity-90">{selectedNode.text}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Conexiones</p>
                <div className="space-y-2">
                  {linkedEdges.length === 0 ? (
                    <div className="rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-500">Sin conexiones directas.</div>
                  ) : (
                    linkedEdges.map((edge, index) => (
                      <div key={`${edge.from}-${edge.to}-${index}`} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium">{edge.from}</span> → <span className="font-medium">{edge.to}</span>
                        <div className="text-xs text-slate-500">{edge.label}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Organigrama de decisiones</CardTitle>
                  <CardDescription>
                    Vista operativa para GM. La estructura se modifica editando <code className="rounded bg-slate-100 px-1 py-0.5">puzzleData</code>.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full bg-white"><DoorOpen className="mr-1 h-3.5 w-3.5" />Salida</Badge>
                  <Badge variant="outline" className="rounded-full bg-white"><FileText className="mr-1 h-3.5 w-3.5" />Nota</Badge>
                  <Badge variant="outline" className="rounded-full bg-white"><Siren className="mr-1 h-3.5 w-3.5" />Alarma</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full rounded-2xl border bg-[radial-gradient(circle_at_top_left,_white,_#f1f5f9)]">
                <div className="relative h-[760px] min-w-[2040px]">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 2040 760" fill="none">
                    {puzzleData.decisionGraph.edges.map((edge, index) => {
                      const from = puzzleData.decisionGraph.nodes.find((node) => node.id === edge.from);
                      const to = puzzleData.decisionGraph.nodes.find((node) => node.id === edge.to);
                      if (!from || !to) return null;
                      const isActive = edge.from === selectedNodeId || edge.to === selectedNodeId;
                      return (
                        <g key={`${edge.from}-${edge.to}-${index}`}>
                          <path
                            d={edgePath(from, to)}
                            stroke={isActive ? "#0f172a" : "#94a3b8"}
                            strokeWidth={isActive ? 3 : 2}
                            strokeDasharray={isActive ? "0" : "6 6"}
                            fill="none"
                          />
                          <text
                            x={(from.x + to.x + 220) / 2}
                            y={(from.y + to.y + 108) / 2 - 8}
                            className="fill-slate-500 text-[11px]"
                          >
                            {edge.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {puzzleData.decisionGraph.nodes.map((node) => (
                    <FlowNode
                      key={node.id}
                      node={node}
                      active={selectedNodeId === node.id}
                      onClick={setSelectedNodeId}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            {filteredRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
