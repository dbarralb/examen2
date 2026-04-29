// TopBar.jsx — El Examen 2 UI Kit
const topBarStyles = {
  bar: {
    height: 44, flexShrink: 0,
    background: '#080C14',
    borderBottom: '1px solid #1E2A3F',
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: 16,
    position: 'relative',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 20, letterSpacing: '0.1em',
    color: '#ffffff', textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: '#3A4560',
    letterSpacing: '0.08em',
  },
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 },
  badge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, padding: '3px 10px',
    clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  time: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: '#6B7A96',
    letterSpacing: '0.06em',
  },
  dot: { width: 6, height: 6, borderRadius: '50%' },
  diagLine: {
    position: 'absolute', bottom: 0, left: 56, right: 0, height: 1,
    background: 'linear-gradient(to right, #00FF87, transparent 40%)',
    opacity: 0.15,
  },
};

function TopBar({ title, screen, status = 'ONLINE', time }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const statusColor = status === 'ONLINE' ? '#00FF87' : status === 'ALERT' ? '#FF2D78' : '#FFEA00';

  return (
    <div style={topBarStyles.bar}>
      <div style={topBarStyles.diagLine}></div>
      <div>
        <div style={topBarStyles.title}>{title}</div>
        <div style={topBarStyles.subtitle}>// {screen}</div>
      </div>
      <div style={topBarStyles.right}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ ...topBarStyles.dot, background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}></div>
          <span style={{ ...topBarStyles.badge, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>{status}</span>
        </div>
        <div style={topBarStyles.time}>[{ts}]</div>
        <div style={{
          width: 28, height: 28,
          clipPath: 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
          background: '#161D2E', border: '1px solid #2A3855',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6B7A96' }}>⚙</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar });
