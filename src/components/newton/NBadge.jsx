export function NBadge({ status = "info", children }) {
  return (
    <span className={`n-badge n-badge-${status}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}
