const logoPath = "/assets/Logo/Newton_Logo_final.png";

export function NewtonLogo({ compact = false }) {
  return (
    <div className={`newton-logo ${compact ? "newton-logo-compact" : ""}`}>
      <img src={logoPath} alt="Instituto Newton" />
      {!compact && (
        <div>
          <span>Instituto</span>
          <strong>Newton</strong>
        </div>
      )}
    </div>
  );
}
