export function E2Logo({ compact = false }) {
  return (
    <div className={`e2-logo ${compact ? "e2-logo-compact" : ""}`}>
      <strong>EL EXAMEN<span>_2</span></strong>
      {!compact && <small>// terminal interface</small>}
    </div>
  );
}
