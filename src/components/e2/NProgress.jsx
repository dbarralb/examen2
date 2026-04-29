export function NProgress({ value = 0, max = 100, label = "", color = "blue" }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="n-progress">
      {label && (
        <div className="n-progress-label">
          <span>{label}</span>
          <code>{Math.round(percent)}%</code>
        </div>
      )}
      <div className="n-progress-track">
        <span className={`n-progress-fill n-progress-${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
