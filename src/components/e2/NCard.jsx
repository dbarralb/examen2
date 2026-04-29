export function NCard({ title, children, glow = false, gold = false, className = "" }) {
  const modifiers = [glow ? "n-card-glow" : "", gold ? "n-card-gold" : ""].filter(Boolean).join(" ");

  return (
    <section className={`n-card ${modifiers} ${className}`.trim()}>
      {title && <h2 className="n-card-title"><span aria-hidden="true">//</span> {title}</h2>}
      {children}
    </section>
  );
}
