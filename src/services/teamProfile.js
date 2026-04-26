/**
 * Computes the dominant team profile from accumulated metrics.
 * Returns one of: "force" | "analysis" | "eco" | "balanced"
 */
export function computeTeamProfile(metrics = {}) {
  const force = metrics.forceCount || 0;
  const analysis = (metrics.analysisCount || 0) + (metrics.repairCount || 0);
  const eco = metrics.ecoCount || 0;
  const total = force + analysis + eco;

  if (total === 0) return "balanced";

  const forceRatio = force / total;
  const analysisRatio = analysis / total;
  const ecoRatio = eco / total;
  const dominanceThreshold = 0.45;

  if (forceRatio >= dominanceThreshold) return "force";
  if (analysisRatio >= dominanceThreshold) return "analysis";
  if (ecoRatio >= dominanceThreshold) return "eco";
  return "balanced";
}

/** Human-readable label for a team profile. */
export function getProfileLabel(profile) {
  const labels = {
    force: "Los que fuerzan",
    analysis: "Los que analizan",
    eco: "Los que siguen los ecos",
    balanced: "Equilibrados",
  };
  return labels[profile] || profile;
}
