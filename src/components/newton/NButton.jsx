export function NButton({ variant = "primary", size = "md", children, className = "", ...props }) {
  return (
    <button className={`n-btn n-btn-${variant} n-btn-${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
