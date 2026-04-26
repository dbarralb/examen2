import { useMemo, useState } from "react";

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

// ── Inline style objects ──

const s = {
  page: { minHeight: "100vh", background: "#09090b", color: "#e4e4e7", padding: 24, fontFamily: "inherit" },
  container: { maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 },
  headerRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 },
  tag: { fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fbbf24" },
  h1: { fontSize: 28, fontWeight: 700, margin: "8px 0 0" },
  subtitle: { color: "#a1a1aa", marginTop: 8, maxWidth: 600, fontSize: 14 },
  btnRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  btnPrimary: { padding: "8px 16px", borderRadius: 8, background: "#d97706", color: "#000", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 13 },
  btnSecondary: { padding: "8px 16px", borderRadius: 8, background: "#27272a", color: "#e4e4e7", border: "none", cursor: "pointer", fontSize: 13 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 },
  card: { borderRadius: 16, background: "#18181b", border: "1px solid #27272a", padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  h2: { fontSize: 18, fontWeight: 600, margin: 0 },
  select: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, padding: 10, color: "#e4e4e7", fontSize: 14 },
  checkbox: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#d4d4d8" },
  fieldRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  fieldLabel: { display: "block", fontSize: 11, color: "#a1a1aa", marginBottom: 4 },
  fieldInput: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, padding: 8, color: "#e4e4e7", fontSize: 13, boxSizing: "border-box" },
  zoneList: { borderRadius: 12, background: "#09090b", border: "1px solid #27272a", padding: 16 },
  zoneItem: { fontSize: 13, color: "#d4d4d8", margin: "4px 0" },
  zoneNum: { color: "#fbbf24", fontWeight: 600 },
  textarea: { width: "100%", minHeight: 420, background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12, padding: 16, fontSize: 13, lineHeight: 1.6, color: "#d4d4d8", resize: "vertical", boxSizing: "border-box" },
  promptHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  typeBadge: { fontSize: 11, borderRadius: 9999, background: "#27272a", padding: "4px 12px", color: "#d4d4d8" },
  previewWrap: { position: "relative", width: "100%", overflow: "hidden", borderRadius: 12, border: "1px solid #3f3f46", background: "#09090b", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  previewEmpty: { color: "#71717a", padding: 40, textAlign: "center" },
  previewImg: { width: "100%", display: "block" },
  hotspotGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  hotspotCard: (color) => ({
    borderRadius: 12, border: `1px solid ${color === "amber" ? "rgba(245,166,35,0.4)" : "rgba(34,211,238,0.4)"}`,
    background: color === "amber" ? "rgba(245,166,35,0.1)" : "rgba(34,211,238,0.1)",
    color: color === "amber" ? "#fde68a" : "#a5f3fc",
    padding: 16,
  }),
  hotspotTitle: { fontWeight: 600, marginBottom: 12, fontSize: 14 },
  hotspotItem: { fontSize: 13, margin: "6px 0" },
  uploadLabel: { fontSize: 13, color: "#a1a1aa" },
};

function GridOverlay({ columns, rows, opacity }) {
  const colLines = Array.from({ length: Math.max(0, columns - 1) }, (_, i) => ((i + 1) * 100) / columns);
  const rowLines = Array.from({ length: Math.max(0, rows - 1) }, (_, i) => ((i + 1) * 100) / rows);
  const zones = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      zones.push({ n: r * columns + c + 1, left: `${(c * 100) / columns}%`, top: `${(r * 100) / rows}%`, width: `${100 / columns}%`, height: `${100 / rows}%` });
    }
  }
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(255,193,7,${opacity * 0.18})` }} />
      {colLines.map((x) => <div key={`c${x}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, borderLeft: "2px dashed white", opacity }} />)}
      {rowLines.map((y) => <div key={`r${y}`} style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, borderTop: "2px dashed white", opacity }} />)}
      {zones.map((z) => (
        <div key={z.n} style={{ position: "absolute", left: z.left, top: z.top, width: z.width, height: z.height, padding: 8 }}>
          <span style={{ display: "inline-flex", borderRadius: 4, background: "rgba(0,0,0,0.6)", padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>Z{z.n}</span>
        </div>
      ))}
    </div>
  );
}

export function PipelineScreen() {
  const [selectedId, setSelectedId] = useState("sala_1");
  const [showGrid, setShowGrid] = useState(true);
  const [columns, setColumns] = useState(6);
  const [rows, setRows] = useState(1);
  const [opacity, setOpacity] = useState(0.22);
  const [uploadedImage, setUploadedImage] = useState(null);

  const selected = rooms.find((r) => r.id === selectedId) || rooms[0];
  const prompt = useMemo(() => buildPrompt(selected, showGrid), [selected, showGrid]);
  const allPrompts = useMemo(() => rooms.map((r) => ({ id: r.id, name: r.name, prompt: buildPrompt(r, showGrid) })), [showGrid]);

  const copy = async (text) => { await navigator.clipboard.writeText(text); };

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
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.headerRow}>
          <div>
            <div style={s.tag}>Protocolo ECO</div>
            <h1 style={s.h1}>Pipeline de Prompts de Escenarios</h1>
            <p style={s.subtitle}>Genera prompts consistentes para salas 2D laterales, con hotspots y una grid superpuesta para recorte en zonas.</p>
          </div>
          <div style={s.btnRow}>
            <button style={s.btnPrimary} onClick={() => copy(prompt)}>Copiar prompt actual</button>
            <button style={s.btnSecondary} onClick={downloadPrompts}>Descargar JSON</button>
          </div>
        </header>

        <section style={s.grid3}>
          <div style={s.card}>
            <h2 style={s.h2}>Escenario</h2>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={s.select}>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
            <label style={s.checkbox}>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Incluir instrucciones de grid en prompt
            </label>
            <div style={s.fieldRow}>
              <label><span style={s.fieldLabel}>Columnas</span><input type="number" value={columns} min={1} max={12} onChange={(e) => setColumns(Number(e.target.value))} style={s.fieldInput} /></label>
              <label><span style={s.fieldLabel}>Filas</span><input type="number" value={rows} min={1} max={4} onChange={(e) => setRows(Number(e.target.value))} style={s.fieldInput} /></label>
              <label><span style={s.fieldLabel}>Opacidad</span><input type="number" value={opacity} min={0} max={0.8} step={0.01} onChange={(e) => setOpacity(Number(e.target.value))} style={s.fieldInput} /></label>
            </div>
            <div>
              <span style={s.uploadLabel}>Subir imagen generada para probar grid</span>
              <input type="file" accept="image/*" onChange={onUpload} style={{ display: "block", marginTop: 8, fontSize: 13, color: "#d4d4d8" }} />
            </div>
            <div style={s.zoneList}>
              <h3 style={{ ...s.h2, fontSize: 15, marginBottom: 8 }}>Zonas</h3>
              {selected.layout.map((z, i) => <div key={z} style={s.zoneItem}><span style={s.zoneNum}>Z{i + 1}</span> — {z}</div>)}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.promptHeader}>
              <h2 style={s.h2}>Prompt actual</h2>
              <span style={s.typeBadge}>{selected.type}</span>
            </div>
            <textarea value={prompt} readOnly style={s.textarea} />
          </div>
        </section>

        <section style={s.card}>
          <h2 style={s.h2}>Preview de grid sobre imagen</h2>
          <div style={s.previewWrap}>
            {uploadedImage ? (
              <div style={{ position: "relative", width: "100%" }}>
                <img src={uploadedImage} alt="preview" style={s.previewImg} />
                <GridOverlay columns={columns} rows={rows} opacity={opacity} />
              </div>
            ) : (
              <div style={s.previewEmpty}>Sube una imagen generada para ver la división por zonas encima.</div>
            )}
          </div>
        </section>

        <section style={s.card}>
          <h2 style={{ ...s.h2, marginBottom: 16 }}>Hotspots del escenario seleccionado</h2>
          <div style={s.hotspotGrid}>
            <div style={s.hotspotCard("amber")}>
              <h3 style={s.hotspotTitle}>Principales</h3>
              {selected.hotspots.primary.map((item) => <div key={item} style={s.hotspotItem}>&#8226; {item}</div>)}
            </div>
            <div style={s.hotspotCard("cyan")}>
              <h3 style={s.hotspotTitle}>Secundarios</h3>
              {selected.hotspots.secondary.map((item) => <div key={item} style={s.hotspotItem}>&#8226; {item}</div>)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
