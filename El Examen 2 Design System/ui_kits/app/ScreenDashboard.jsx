// ScreenDashboard.jsx — El Examen 2 UI Kit
const { useState: useStD } = React;

const MISSIONS = [
  { id: '#EX-001', name: 'Bypass Firewall Layer 1', status: 'DONE',    color: '#3A4560',  time: '00:32' },
  { id: '#EX-002', name: 'Extract Node Credentials', status: 'ACTIVE',  color: '#00EAFF',  time: '01:44' },
  { id: '#EX-003', name: 'Inject Payload v2.4',      status: 'BLOCKED', color: '#FF2D78',  time: '02:08' },
  { id: '#EX-004', name: 'Wipe Trace Logs',           status: 'OPEN',   color: '#00FF87',  time: '03:00' },
];

const LOGS = [
  { t: '03:14:22', msg: 'session opened — operator: ROOT',  c: '#00FF87' },
  { t: '03:14:23', msg: 'module v2.4.1 loaded',             c: '#6B7A96' },
  { t: '03:14:24', msg: 'anomaly in sector 0x7F — flagged', c: '#FFEA00' },
  { t: '03:14:25', msg: 'FIREWALL RESPONSE — active',       c: '#FF2D78' },
  { t: '03:14:26', msg: 'countermeasure bypass initiated',  c: '#6B7A96' },
];

const STATS = [
  { label: 'Nodes Online', val: '7 / 12',  color: '#00FF87' },
  { label: 'Exploits Run',  val: '23',     color: '#00EAFF' },
  { label: 'Alerts',        val: '3',      color: '#FF2D78' },
  { label: 'Integrity',     val: '74%',    color: '#FFEA00' },
];

function StatCard({ label, val, color }) {
  return (
    <div style={{
      flex: 1, background: '#0D1220', border: `1px solid ${color}30`,
      clipPath: 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)',
      padding: '12px 14px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 60, background: `radial-gradient(ellipse at top left, ${color}08, transparent 70%)` }}></div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color, letterSpacing: '0.06em', textShadow: `0 0 12px ${color}60`, lineHeight: 1 }}>{val}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3A4560', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>{label}</div>
      {/* corner tick */}
      <div style={{ position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderBottom: `1px solid ${color}50`, borderRight: `1px solid ${color}50` }}></div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { DONE: ['#3A4560', 'rgba(255,255,255,0.04)'], ACTIVE: ['#00EAFF', 'rgba(0,234,255,0.1)'], BLOCKED: ['#FF2D78', 'rgba(255,45,120,0.1)'], OPEN: ['#00FF87', 'rgba(0,255,135,0.1)'] };
  const [c, bg] = map[status] || ['#6B7A96', 'transparent'];
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: c, background: bg, padding: '2px 8px', clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)', letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${c}40` }}>{status}</div>
  );
}

function ScreenDashboard({ onNav }) {
  const [activeRow, setActiveRow] = useStD(null);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080C14' }}>
      <TopBar title="El Examen 2" screen="OVERVIEW // DASHBOARD" status="ONLINE" />
      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
          {/* Mission list */}
          <div style={{ flex: 1.4, background: '#0D1220', border: '1px solid #1E2A3F', clipPath: 'polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1E2A3F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7A96' }}>Active Missions</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00FF87', cursor: 'pointer' }} onClick={() => onNav('missions')}>view all ▸</div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {MISSIONS.map((m, i) => (
                <div
                  key={m.id}
                  onClick={() => setActiveRow(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                    borderBottom: '1px solid #1E2A3F',
                    background: activeRow === i ? 'rgba(0,255,135,0.05)' : 'transparent',
                    borderLeft: `2px solid ${activeRow === i ? '#00FF87' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 80ms linear',
                  }}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560', width: 60, flexShrink: 0 }}>{m.id}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: activeRow === i ? '#fff' : '#A8B4CC', flex: 1, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560', marginRight: 8 }}>{m.time}</div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Log feed */}
          <div style={{ flex: 1, background: '#080C14', border: '1px solid #1E2A3F', clipPath: 'polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1E2A3F', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF87', boxShadow: '0 0 5px rgba(0,255,135,0.7)', animation: 'flicker 3s infinite' }}></div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7A96' }}>System Log</div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {LOGS.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.6 }}>
                  <span style={{ color: '#1E2A3F', flexShrink: 0 }}>[{l.t}]</span>
                  <span style={{ color: l.c }}>{l.msg}</span>
                </div>
              ))}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00FF87', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>▸</span>
                <span style={{ display: 'inline-block', width: 7, height: 12, background: '#00FF87', boxShadow: '0 0 5px rgba(0,255,135,0.7)', animation: 'blink 1s steps(1) infinite' }}></span>
              </div>
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid #1E2A3F', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00FF87' }}>▸</span>
              <input style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#fff', caretColor: '#00FF87' }} placeholder="enter command..." onClick={() => onNav('terminal')} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDashboard, StatusBadge });
