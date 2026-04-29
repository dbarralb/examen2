/**
 * Instituto Newton — Game UI Kit
 * Shared components used across all screens
 */

// ─── BUTTON ───────────────────────────────────────────────────
function NBtn({ variant = 'primary', size = 'md', disabled, onClick, children }) {
  const base = {
    fontFamily: "'League Spartan', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  };
  const sizes = { sm: { padding: '8px 16px', fontSize: 12 }, md: { padding: '12px 24px', fontSize: 14 }, lg: { padding: '16px 32px', fontSize: 16 } };
  const variants = {
    primary:   { background: '#C2F779', color: '#182625', borderRadius: 0 },
    secondary: { background: 'transparent', color: '#C2F779', border: '1px solid #C2F779', borderRadius: 0 },
    ghost:     { background: 'transparent', color: '#E2D6AF', border: '1px solid #2A3F3C', borderRadius: 0 },
    gold:      { background: '#D97D0D', color: '#182625', borderRadius: 0 },
    danger:    { background: '#A61212', color: '#fff', borderRadius: 0 },
  };
  const style = { ...base, ...sizes[size], ...(disabled ? { background: '#1E3230', color: '#524D40' } : variants[variant]) };
  return <button style={style} disabled={disabled} onClick={onClick}>{children}</button>;
}

// ─── BADGE ────────────────────────────────────────────────────
function NBadge({ status = 'info', children }) {
  const cfg = {
    info:    { bg: 'rgba(194,247,121,0.12)',   color: '#C2F779' },
    success: { bg: 'rgba(194,247,121,0.12)',  color: '#C2F779' },
    warning: { bg: 'rgba(217,125,13,0.12)',   color: '#D97D0D' },
    danger:  { bg: 'rgba(166,18,18,0.12)',   color: '#A61212' },
    muted:   { bg: 'rgba(255,255,255,0.05)', color: '#7A7363' },
  };
  const { bg, color } = cfg[status] || cfg.info;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, fontFamily: "'League Spartan', sans-serif" }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}></span>
      {children}
    </span>
  );
}

// ─── CARD ─────────────────────────────────────────────────────
function NCard({ title, children, glow, gold, style: s }) {
  const base = {
    background: '#1E3230', border: `1px solid ${gold ? '#D97D0D' : glow ? '#C2F779' : '#2A3F3C'}`,
    borderRadius: 8, padding: 20, boxShadow: glow ? '0 0 24px rgba(194,247,121,0.2)' : gold ? '0 0 16px rgba(217,125,13,0.2)' : '0 2px 8px rgba(10,16,15,0.5)',
    fontFamily: "'League Spartan', sans-serif",
  };
  return (
    <div style={{ ...base, ...s }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>{title}</div>}
      {children}
    </div>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────
function NDivider() {
  return <div style={{ borderTop: '1px solid #2A3F3C', margin: '12px 0' }}></div>;
}

// ─── SECTION LABEL ────────────────────────────────────────────
function NLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7363', fontFamily: "'League Spartan', sans-serif" }}>{children}</div>;
}

// ─── PROGRESS BAR ─────────────────────────────────────────────
function NProgress({ value = 0, max = 100, color = '#C2F779', label }) {
  return (
    <div style={{ fontFamily: "'League Spartan', sans-serif" }}>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A89F88' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#7A7363', fontFamily: 'Courier New', monospace: true }}>{Math.round((value/max)*100)}%</span>
      </div>}
      <div style={{ background: '#1E3230', height: 6, borderRadius: 0, overflow: 'hidden' }}>
        <div style={{ background: color, height: '100%', width: `${(value/max)*100}%`, transition: 'width 300ms cubic-bezier(0.25,0.1,0.25,1)' }}></div>
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────
function NModal({ title, children, onClose, visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,24,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#1E3230', border: '1px solid #C2F779', borderRadius: 8, padding: 32, minWidth: 360, maxWidth: 520, boxShadow: '0 0 24px rgba(194,247,121,0.2)', fontFamily: "'League Spartan', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#fff' }}>{title}</div>
          {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A7363', cursor: 'pointer', fontSize: 18 }}>✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── TIMER ────────────────────────────────────────────────────
function NTimer({ seconds = 0, urgent }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 32, fontWeight: 700, color: urgent ? '#A61212' : '#C2F779', letterSpacing: '0.05em', textShadow: urgent ? '0 0 12px rgba(231,76,60,0.5)' : '0 0 12px rgba(194,247,121,0.15)' }}>
      {mm}:{ss}
    </div>
  );
}

Object.assign(window, { NBtn, NBadge, NCard, NDivider, NLabel, NProgress, NModal, NTimer });
