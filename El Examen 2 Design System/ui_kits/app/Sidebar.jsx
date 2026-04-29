// Sidebar.jsx — El Examen 2 UI Kit
const { useState } = React;

const sidebarStyles = {
  sidebar: {
    width: 56, minWidth: 56, height: '100%',
    background: '#080C14',
    borderRight: '1px solid #1E2A3F',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingTop: 12, gap: 4,
    position: 'relative', zIndex: 10, flexShrink: 0,
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 18, color: '#00FF87', letterSpacing: '0.1em',
    textShadow: '0 0 12px rgba(0,255,135,0.5)',
    marginBottom: 16, userSelect: 'none',
    animation: 'flicker 5s infinite',
  },
  navItem: {
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
    transition: 'all 100ms linear',
  },
  navIcon: { fontSize: 14, fontFamily: "'JetBrains Mono', monospace" },
  divider: { width: 24, height: 1, background: '#1E2A3F', margin: '6px 0' },
  bottomSection: { marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 12 },
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard' },
  { id: 'terminal', icon: '▸', label: 'Terminal' },
  { id: 'missions', icon: '⬡', label: 'Missions' },
];

function Sidebar({ active, onNav }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={sidebarStyles.sidebar}>
      <div style={sidebarStyles.logo}>E2</div>
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id;
        const isHovered = hovered === item.id;
        return (
          <div
            key={item.id}
            style={{
              ...sidebarStyles.navItem,
              background: isActive ? 'rgba(0,255,135,0.12)' : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
              boxShadow: isActive ? '0 0 10px rgba(0,255,135,0.2)' : 'none',
              borderLeft: isActive ? '2px solid #00FF87' : '2px solid transparent',
            }}
            onClick={() => onNav(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            title={item.label}
          >
            <span style={{
              ...sidebarStyles.navIcon,
              color: isActive ? '#00FF87' : isHovered ? '#A8B4CC' : '#3A4560',
              textShadow: isActive ? '0 0 8px rgba(0,255,135,0.7)' : 'none',
            }}>{item.icon}</span>
          </div>
        );
      })}
      <div style={sidebarStyles.divider}></div>
      <div
        style={{ ...sidebarStyles.navItem, cursor: 'pointer' }}
        title="Settings"
        onMouseEnter={() => setHovered('settings')}
        onMouseLeave={() => setHovered(null)}
      >
        <span style={{ ...sidebarStyles.navIcon, color: hovered === 'settings' ? '#6B7A96' : '#2E3A50', fontSize: 13 }}>⚙</span>
      </div>
      <div style={sidebarStyles.bottomSection}>
        <div style={{
          width: 28, height: 28, borderRadius: 0,
          clipPath: 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
          background: 'rgba(155,0,255,0.2)', border: '1px solid #9B00FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono'", fontSize: 10, color: '#9B00FF',
          fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 0 8px rgba(155,0,255,0.3)',
        }}>R</div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar });
