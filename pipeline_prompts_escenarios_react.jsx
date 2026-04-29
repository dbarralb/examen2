import React, { useMemo, useState } from "react";

const STYLE_CORE = `Escenario de videojuego 2D point-and-click en vista lateral frontal, como scroll horizontal. Solo pared y suelo visibles, sin perspectiva cenital, sin vista isométrica.

Instituto de ciencias actual con tecnología retro de los años 70–80, medidas tecnológicas analógicas, estética retro-cyberpunk moderada, realista y ligeramente decadente.

Materiales: azulejos desgastados, pintura desconchada, metal viejo, tubos, cables visibles, fluorescentes antiguos, monitores CRT, paneles físicos, interruptores, botones mecánicos, archivadores, carteles de papel, polvo y uso real.

Tecnología creíble, no futurista avanzada. Nada de hologramas limpios salvo en la sala Hórus o final si se indica explícitamente.

Paleta base: verdes sucios, azules grisáceos, amarillos de advertencia, blanco fluorescente frío, sombras suaves pero legibles.

Estilo visual: ilustración detallada de entorno para videojuego, acabado limpio tipo concept art, coherente con cartas tecnológicas industriales, líneas definidas, alto detalle, atmósfera misteriosa.

Composición horizontal amplia, pensada para recorte posterior en 6 zonas verticales. Mantener continuidad visual de izquierda a derecha.`;

const NEGATIVE = `Evitar: vista cenital, isométrica, mapa técnico, UI, textos largos legibles, personajes protagonistas, aspecto demasiado futurista, naves espaciales, neones excesivos, fantasía medieval, objetos gigantes sin escala, cámara angular extrema, imagen tipo infografía.`;

const rooms = [
  {
    id: "sala_1",
    name: "Sala 1 — El Cierre",
    type: "Intro",
    tone: "Tensión inicial, lugar real pero anómalo, todavía controlable.",
    layout: ["Banco técnico", "Almacén auxiliar", "Mesa central", "Cartel protocolo", "Cuadro eléctrico", "Puerta salida"],
    hotspots: {
      primary: ["Cartel de protocolo de cierre con pasos desordenados", "Cuadro eléctrico abierto con cables manipulables", "Panel de seguridad con botones físicos y pantalla CRT", "Puerta de salida metálica con piloto luminoso"],
      secondary: ["Papeles técnicos sobre mesa", "Herramientas sueltas", "Monitores secundarios", "Tablón de avisos"]
    },
    promptAdd: `Vestíbulo técnico y almacén de mantenimiento de un instituto de ciencias. A la izquierda un banco con herramientas y equipo analógico. En el centro una mesa con papeles y carteles de protocolo. A la derecha un cuadro eléctrico abierto y una puerta de emergencia metálica. Ambiente de cierre automático, fluorescentes fríos, sensación de encierro inicial.`
  },
  {
    id: "sala_2",
    name: "Sala 2 — El Registro Cruzado",
    type: "Cruzada",
    tone: "Orden aparente, información incompleta, sensación de archivo que oculta algo.",
    layout: ["Archivadores", "Mesa expedientes", "Terminal CRT", "Mapa incidencias", "Caja fuerte", "Salida técnica"],
    hotspots: {
      primary: ["Archivador principal abierto", "Terminal corrupto con CRT", "Mapa del instituto con incidencias", "Caja fuerte metálica antigua"],
      secondary: ["Carpetas etiquetadas", "Sellos de confidencial", "Papeles caídos", "Lámpara de escritorio"]
    },
    promptAdd: `Archivo técnico del instituto con estanterías metálicas, carpetas, expedientes, terminal CRT y una caja fuerte antigua. Debe sentirse más silencioso y ordenado que la primera sala, pero con pistas contradictorias. Una pared tiene un mapa de incidencias del instituto.`
  },
  {
    id: "sala_3",
    name: "Sala 3 — La Contención",
    type: "Tensión",
    tone: "Peligro controlado, sensores que mienten, ambiente inestable.",
    layout: ["Acceso sellado", "Laboratorio", "Terminal diagnóstico", "Cristal observación", "Cámara contención", "Salida alarma"],
    hotspots: {
      primary: ["Puerta con alerta de contaminación", "Terminal de diagnóstico con nodos", "Cristal de observación indirecta", "Panel de contención total"],
      secondary: ["Luces rojas", "Condensación en cristal", "Cables sueltos", "Señales de emergencia"]
    },
    promptAdd: `Laboratorio de contención de instituto, no futurista: cristales gruesos, paneles analógicos, luces rojas de emergencia, sensores antiguos, terminal de diagnóstico con pantalla CRT. Todo parece funcionar mal de una forma inquietante. Debe transmitir que el sistema recomienda aislar algo, pero que quizá está equivocado.`
  },
  {
    id: "horus_run_1",
    name: "Sala 4 — Hórus Run 1: Los que fuerzan",
    type: "Hórus procedural",
    tone: "Evaluación fría con señales de impacto y resistencia física.",
    layout: ["Entrada blanca", "Panel decisiones", "Sistema reactivo", "Prueba fuerza", "Decisión", "Salida"],
    hotspots: {
      primary: ["Panel de decisiones Analizar/Forzar/Esperar", "Botonera reactiva", "Marcas de impacto en paneles", "Tres opciones finales"],
      secondary: ["Luces rojas", "Pantallas con advertencias", "Cristal fisurado", "Cables tensados"]
    },
    promptAdd: `Sala Hórus limpia y blanca, más tecnológica que el resto pero todavía física y analógica. Variante para jugadores que usan fuerza: paneles reforzados, botones grandes, marcas de golpes, luces rojas de advertencia, el sistema parece adaptarse a la violencia.`
  },
  {
    id: "horus_run_2",
    name: "Sala 4 — Hórus Run 2: Los que analizan",
    type: "Hórus procedural",
    tone: "Sobrecarga de información, lógica fría, exceso de datos.",
    layout: ["Entrada blanca", "Pantallas datos", "Archivo vivo", "Sistema lógico", "Decisión", "Salida"],
    hotspots: {
      primary: ["Muro de pantallas CRT", "Mesa con informes infinitos", "Panel lógico con variables ocultas", "Tres opciones finales"],
      secondary: ["Gráficas analógicas", "Papel continuo", "Luces azules", "Etiquetas de clasificación"]
    },
    promptAdd: `Sala Hórus limpia, fría y ordenada, saturada de pantallas CRT, informes, gráficas, papel continuo y datos. Debe sentirse como un examen imposible de información excesiva. Paleta azul fría, muy controlada.`
  },
  {
    id: "horus_run_3",
    name: "Sala 4 — Hórus Run 3: Los que siguen los ecos",
    type: "Hórus procedural",
    tone: "Anomalía, realidad inestable, eco temporal.",
    layout: ["Entrada blanca", "Objetos duplicados", "Eco activo", "Patrón inestable", "Decisión", "Salida"],
    hotspots: {
      primary: ["Objeto duplicado fuera de lugar", "Pantalla con eco distorsionado", "Patrón cambiante en pared", "Tres opciones finales"],
      secondary: ["Sombras desplazadas", "Luces violetas", "Reflejos imposibles", "Símbolos apenas visibles"]
    },
    promptAdd: `Sala Hórus con realidad levemente inestable: objetos duplicados, reflejos que no coinciden, luz violeta y azul, patrones sutiles en la pared, ecos visuales. Debe ser misteriosa, no mágica medieval; anomalía tecnológica y psicológica.`
  },
  {
    id: "horus_run_4",
    name: "Sala 4 — Hórus Run 4: Equilibrados",
    type: "Hórus procedural",
    tone: "Simetría, equilibrio, coordinación, juicio limpio.",
    layout: ["Entrada blanca", "Cuatro estaciones", "Mesa central", "Sistema espejo", "Decisión", "Salida"],
    hotspots: {
      primary: ["Cuatro estaciones de rol", "Mesa central de coordinación", "Sistema espejo", "Tres opciones finales"],
      secondary: ["Líneas doradas suaves", "Pantallas sincronizadas", "Cables ordenados", "Luces neutras"]
    },
    promptAdd: `Sala Hórus perfectamente simétrica y equilibrada, con cuatro estaciones de interacción, una mesa central y paneles limpios. Debe sentirse como un juicio justo, sereno y preciso. Acentos dorados suaves y blanco frío.`
  },
  {
    id: "sala_5",
    name: "Sala 5 — La Salida / El Examen",
    type: "Final",
    tone: "Reconstrucción, memoria, cierre abierto, todo lo anterior mezclado.",
    layout: ["Fragmentos sala 1", "Fragmentos sala 2", "Núcleo", "Sistema inestable", "Aula examen", "Salida"],
    hotspots: {
      primary: ["Núcleo central de Hórus", "Módulos Control/Seguridad/Evaluación", "Puerta de salida", "Mesa limpia con examen oculto"],
      secondary: ["Objetos repetidos", "Papeles flotantes o caídos", "Fragmentos de salas anteriores", "Luces contradictorias"]
    },
    promptAdd: `Sala final del instituto reconstruido: fragmentos de laboratorio, archivo, contención y Hórus se mezclan en un solo escenario horizontal. En una zona debe aparecer un aula extremadamente limpia con una mesa y un examen de papel, como elemento extraño y estable. Ambiente de cierre abierto, memoria fragmentada, sistema colapsando de forma controlada.`
  }
];

function buildPrompt(room, includeGrid) {
  const gridText = includeGrid
    ? `\n\nAñadir encima una guía de división para producción: 6 franjas verticales semitransparentes o líneas sutiles de corte, numeradas Z1 a Z6 de izquierda a derecha. La guía debe ser visible pero no destruir la imagen.`
    : `\n\nNo incluir UI ni texto superpuesto. La división en 6 zonas debe sugerirse mediante columnas, cambios de pared, muebles o iluminación, pero sin líneas visibles.`;

  return `${STYLE_CORE}\n\nSala: ${room.name}\nTipo: ${room.type}\nTono emocional: ${room.tone}\n\nComposición de izquierda a derecha en 6 zonas:\n${room.layout.map((z, i) => `Z${i + 1}: ${z}`).join("\n")}\n\nContenido específico:\n${room.promptAdd}\n\nHotspots principales que deben ser claramente reconocibles:\n${room.hotspots.primary.map((h) => `- ${h}`).join("\n")}\n\nHotspots secundarios integrados en el entorno:\n${room.hotspots.secondary.map((h) => `- ${h}`).join("\n")}\n${gridText}\n\n${NEGATIVE}`;
}

export default function ScenarioPromptPipeline() {
  const [selectedId, setSelectedId] = useState("sala_1");
  const [showGrid, setShowGrid] = useState(true);
  const [columns, setColumns] = useState(6);
  const [rows, setRows] = useState(1);
  const [opacity, setOpacity] = useState(0.22);
  const [uploadedImage, setUploadedImage] = useState(null);

  const selected = rooms.find((r) => r.id === selectedId) || rooms[0];
  const prompt = useMemo(() => buildPrompt(selected, showGrid), [selected, showGrid]);
  const allPrompts = useMemo(() => rooms.map((r) => ({ id: r.id, name: r.name, prompt: buildPrompt(r, showGrid) })), [showGrid]);

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const downloadPrompts = () => {
    const blob = new Blob([JSON.stringify(allPrompts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "protocolo_eco_prompts_escenarios.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs tracking-[0.25em] uppercase text-amber-300">Protocolo ECO</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Pipeline de Prompts de Escenarios</h1>
            <p className="text-zinc-400 mt-2 max-w-3xl">Genera prompts consistentes para salas 2D laterales, con hotspots y una grid superpuesta para recorte en zonas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(prompt)} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold">Copiar prompt actual</button>
            <button onClick={downloadPrompts} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Descargar JSON</button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            <h2 className="text-xl font-semibold">Escenario</h2>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3">
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                Incluir instrucciones de grid en prompt
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <Field label="Columnas" value={columns} onChange={setColumns} min={1} max={12} />
              <Field label="Filas" value={rows} onChange={setRows} min={1} max={4} />
              <Field label="Opacidad" value={opacity} onChange={setOpacity} step={0.01} min={0} max={0.8} />
            </div>

            <label className="block space-y-2 pt-2">
              <span className="text-sm text-zinc-400">Subir imagen generada para probar grid</span>
              <input type="file" accept="image/*" onChange={onUpload} className="block w-full text-sm text-zinc-300" />
            </label>

            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
              <h3 className="font-semibold">Zonas</h3>
              <ol className="space-y-1 text-sm text-zinc-300">
                {selected.layout.map((z, i) => <li key={z}><span className="text-amber-300">Z{i + 1}</span> — {z}</li>)}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Prompt actual</h2>
              <span className="text-xs rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">{selected.type}</span>
            </div>
            <textarea value={prompt} readOnly className="w-full min-h-[420px] bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-sm leading-relaxed text-zinc-200" />
          </div>
        </section>

        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Preview de grid sobre imagen</h2>
          <div className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 min-h-[300px] flex items-center justify-center">
            {uploadedImage ? (
              <div className="relative w-full">
                <img src={uploadedImage} alt="preview" className="w-full block" />
                <GridOverlay columns={columns} rows={rows} opacity={opacity} />
              </div>
            ) : (
              <div className="text-zinc-500 p-10 text-center">Sube una imagen generada para ver la división por zonas encima.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <h2 className="text-xl font-semibold mb-4">Hotspots del escenario seleccionado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HotspotList title="Principales" items={selected.hotspots.primary} color="amber" />
            <HotspotList title="Secundarios" items={selected.hotspots.secondary} color="cyan" />
          </div>
        </section>
      </div>
    </div>
  );
}

function GridOverlay({ columns, rows, opacity }) {
  const colLines = Array.from({ length: Math.max(0, columns - 1) }, (_, i) => ((i + 1) * 100) / columns);
  const rowLines = Array.from({ length: Math.max(0, rows - 1) }, (_, i) => ((i + 1) * 100) / rows);
  const zones = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      zones.push({
        n: r * columns + c + 1,
        left: `${(c * 100) / columns}%`,
        top: `${(r * 100) / rows}%`,
        width: `${100 / columns}%`,
        height: `${100 / rows}%`
      });
    }
  }
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{ background: `rgba(255, 193, 7, ${opacity * 0.18})` }} />
      {colLines.map((x) => <div key={`c${x}`} className="absolute top-0 bottom-0 border-l-2 border-dashed border-white" style={{ left: `${x}%`, opacity }} />)}
      {rowLines.map((y) => <div key={`r${y}`} className="absolute left-0 right-0 border-t-2 border-dashed border-white" style={{ top: `${y}%`, opacity }} />)}
      {zones.map((z) => (
        <div key={z.n} className="absolute p-2" style={{ left: z.left, top: z.top, width: z.width, height: z.height }}>
          <span className="inline-flex rounded bg-black/60 px-2 py-1 text-xs font-bold text-amber-300">Z{z.n}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2" />
    </label>
  );
}

function HotspotList({ title, items, color }) {
  const cls = color === "amber" ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}
