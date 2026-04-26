/**
 * Codex — persistent cross-session storage backed by localStorage.
 *
 * Structure:
 * {
 *   ecos: { [ecoId]: { text, codexLevel, discoveredAt, salaId } },
 *   sessions: [ { date, salaIds, finalId, ecosDiscovered: [] } ],
 *   connections: [ { id, ecoIds: [a, b, ...], insight } ],
 *   metaNarrative: [ { id, title, content, unlockedAt } ],
 * }
 */

const STORAGE_KEY = "examen2_codex";

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createEmptyCodex();
  } catch {
    return createEmptyCodex();
  }
}

function writeStore(codex) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codex));
}

function createEmptyCodex() {
  return { ecos: {}, sessions: [], connections: [], metaNarrative: [] };
}

/** Returns the full Codex object. */
export function getCodex() {
  return readStore();
}

/** Saves a single discovered eco to the Codex (idempotent). */
export function saveEcoToCodex(ecoId, text, codexLevel, salaId) {
  const codex = readStore();
  if (!codex.ecos[ecoId]) {
    codex.ecos[ecoId] = { text, codexLevel, discoveredAt: Date.now(), salaId };
    computeCodexConnections(codex);
    writeStore(codex);
  }
  return codex;
}

/**
 * Saves a completed session summary to the Codex.
 * Called when the game ends (Sala 5 completed or gameOver).
 */
export function saveSessionToCodex(salaIds, finalId, ecosDiscovered) {
  const codex = readStore();
  codex.sessions.push({
    date: Date.now(),
    salaIds,
    finalId: finalId || null,
    ecosDiscovered: ecosDiscovered || [],
  });
  computeCodexConnections(codex);
  writeStore(codex);
  return codex;
}

/**
 * Level 2 — Computes connections between ecos.
 * Connections are auto-generated when 2+ ecos from different salas coexist.
 * Mutates codex.connections in place.
 */
export function computeCodexConnections(codex) {
  const ecoEntries = Object.entries(codex.ecos);
  if (ecoEntries.length < 2) return;

  // Group ecos by salaId
  const bySala = {};
  for (const [id, eco] of ecoEntries) {
    const key = eco.salaId || "unknown";
    if (!bySala[key]) bySala[key] = [];
    bySala[key].push(id);
  }

  const salaKeys = Object.keys(bySala);
  if (salaKeys.length < 2) return;

  // Create a connection for each pair of salas
  const existingIds = new Set(codex.connections.map((c) => c.id));
  for (let i = 0; i < salaKeys.length; i++) {
    for (let j = i + 1; j < salaKeys.length; j++) {
      const ecoIds = [...bySala[salaKeys[i]], ...bySala[salaKeys[j]]];
      const connId = `conn_${salaKeys[i]}_${salaKeys[j]}`;
      if (!existingIds.has(connId)) {
        codex.connections.push({
          id: connId,
          ecoIds,
          insight: `Fragmentos de ${salaKeys[i]} y ${salaKeys[j]} conectados.`,
        });
      }
    }
  }
}

/**
 * Level 3 — Unlocks a meta-narrative block.
 * Called when special conditions are met (e.g., "El Examen" ending).
 */
export function unlockMetaNarrative(title, content) {
  const codex = readStore();
  const id = `meta_${title.toLowerCase().replace(/\s+/g, "_")}`;
  if (codex.metaNarrative.some((m) => m.id === id)) return codex;
  codex.metaNarrative.push({ id, title, content, unlockedAt: Date.now() });
  writeStore(codex);
  return codex;
}

/** Clears the entire Codex (debug only). */
export function clearCodex() {
  writeStore(createEmptyCodex());
}
