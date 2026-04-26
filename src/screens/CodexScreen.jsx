import { useMemo, useState } from "react";
import { NBadge, NButton, NCard, NewtonLogo } from "../components/newton";
import { getCodex, clearCodex } from "../services/codexService.js";

const LEVEL_LABELS = { 1: "Eco", 2: "Conexión", 3: "Meta" };

export function CodexScreen({ navigation }) {
  const [codex, setCodex] = useState(() => getCodex());
  const [activeTab, setActiveTab] = useState("ecos");

  const ecoList = useMemo(
    () => Object.entries(codex.ecos || {}).sort((a, b) => (a[1].discoveredAt || 0) - (b[1].discoveredAt || 0)),
    [codex.ecos],
  );

  function handleClear() {
    clearCodex();
    setCodex(getCodex());
  }

  return (
    <main className="react-screen codex-screen">
      <header className="react-screen-header">
        <NewtonLogo />
        <div>
          <NBadge status="info">Codex</NBadge>
          <h1>Archivo persistente</h1>
        </div>
        <NButton variant="ghost" size="sm" onClick={() => navigation.go("access")}>Volver</NButton>
      </header>

      <nav className="codex-tabs">
        {[
          { id: "ecos", label: "Ecos", count: ecoList.length },
          { id: "connections", label: "Conexiones", count: (codex.connections || []).length },
          { id: "meta", label: "Meta-narrativa", count: (codex.metaNarrative || []).length },
          { id: "sessions", label: "Partidas", count: (codex.sessions || []).length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`codex-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="codex-tab-count">{tab.count}</span>}
          </button>
        ))}
      </nav>

      <section className="codex-content">
        {activeTab === "ecos" && (
          ecoList.length === 0 ? (
            <p className="codex-empty">No hay ecos registrados. Juega una partida para descubrir fragmentos narrativos.</p>
          ) : (
            <div className="codex-eco-list">
              {ecoList.map(([id, eco]) => (
                <article key={id} className="codex-eco-card">
                  <div className="codex-eco-header">
                    <NBadge status="info">Nivel {eco.codexLevel || 1}</NBadge>
                    <span className="codex-eco-sala">{eco.salaId || "Desconocido"}</span>
                  </div>
                  <blockquote className="codex-eco-text">"{eco.text}"</blockquote>
                </article>
              ))}
            </div>
          )
        )}

        {activeTab === "connections" && (
          (codex.connections || []).length === 0 ? (
            <p className="codex-empty">Las conexiones se desbloquean al descubrir ecos de diferentes salas.</p>
          ) : (
            <div className="codex-connection-list">
              {(codex.connections || []).map((conn) => (
                <article key={conn.id} className="codex-connection-card">
                  <div className="codex-connection-ecos">
                    {conn.ecoIds.map((ecoId) => (
                      <NBadge key={ecoId} status="muted">{ecoId}</NBadge>
                    ))}
                  </div>
                  <p className="codex-connection-insight">{conn.insight}</p>
                </article>
              ))}
            </div>
          )
        )}

        {activeTab === "meta" && (
          (codex.metaNarrative || []).length === 0 ? (
            <p className="codex-empty">Los bloques de meta-narrativa se desbloquean con condiciones especiales.</p>
          ) : (
            <div className="codex-meta-list">
              {(codex.metaNarrative || []).map((block) => (
                <article key={block.id} className="codex-meta-card">
                  <h3>{block.title}</h3>
                  <p>{block.content}</p>
                </article>
              ))}
            </div>
          )
        )}

        {activeTab === "sessions" && (
          (codex.sessions || []).length === 0 ? (
            <p className="codex-empty">No hay partidas registradas.</p>
          ) : (
            <div className="codex-session-list">
              {(codex.sessions || []).slice().reverse().map((sess, i) => (
                <article key={i} className="codex-session-card">
                  <span className="codex-session-date">{new Date(sess.date).toLocaleDateString()}</span>
                  <span className="codex-session-salas">{(sess.salaIds || []).length} salas</span>
                  <span className="codex-session-ecos">{(sess.ecosDiscovered || []).length} ecos</span>
                  {sess.finalId && <NBadge status="info">{sess.finalId}</NBadge>}
                </article>
              ))}
            </div>
          )
        )}
      </section>

      <footer className="codex-footer">
        <NButton variant="ghost" size="sm" onClick={handleClear}>Borrar Codex (debug)</NButton>
      </footer>
    </main>
  );
}
