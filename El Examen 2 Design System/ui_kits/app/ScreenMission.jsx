// ScreenMission.jsx — El Examen 2 UI Kit
const { useState: useStM } = React;

const ALL_MISSIONS = [
  { id: '#EX-001', name: 'Bypass Firewall Layer 1',   status: 'DONE',    pct: 100, color: '#3A4560', desc: 'Initial perimeter breach via port 443. Firewall rule injection successful.', time: '00:32', sector: 'sector-1' },
  { id: '#EX-002', name: 'Extract Node Credentials',  status: 'ACTIVE',  pct: 41,  color: '#00EAFF', desc: 'Credential extraction from NODE-7F3A. Auth token partially exposed.', time: '01:44', sector: 'sector-1' },
  { id: '#EX-003', name: 'Inject Payload v2.4',       status: 'BLOCKED', pct: 0,   color: '#FF2D78', desc: 'Payload delivery blocked by active countermeasure. Retry pending.', time: '02:08', sector: 'sector-2' },
  { id: '#EX-004', name: 'Wipe Trace Logs',           status: 'OPEN',    pct: 0,   color: '#00FF87', desc: 'Remove session trace from system logs on target nodes.', time: '03:00', sector: 'sector-1' },
  { id: '#EX-005', name: 'Exfiltrate Data Package',   status: 'OPEN',    pct: 0,   color: '#00FF87', desc: 'Transfer extracted data to secure drop point.', time: '04:30', sector: 'sector-3' },
];

const statusColor = { DONE: '#3A4560', ACTIVE: '#00EAFF', BLOCKED: '#FF2D78', OPEN: '#00FF87' };

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 4, background: '#1E2A3F', width: '100%', position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}90`, transition: 'width 300ms linear' }}></div>
    </div>
  );
}

function ScreenMission() {
  const [selected, setSelected] = useStM(1);
  const m = ALL_MISSIONS[selected];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080C14' }}>
      <TopBar title="El Examen 2" screen="MISSIONS // OBJECTIVES" status="ALERT" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 14, padding: 16 }}>
        {/* List */}
        <div style={{ width: 300, flexShrink: 0, background: '#0D1220', border: '1px solid #1E2A3F', clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1E2A3F', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7A96', flexShrink: 0 }}>Objectives</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {ALL_MISSIONS.map((m, i) => {
              const c = statusColor[m.status];
              const isActive = selected === i;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelected(i)}
                  style={{
                    padding: '12px 14px', borderBottom: '1px solid #1E2A3F', cursor: 'pointer',
                    background: isActive ? `${c}08` : 'transparent',
                    borderLeft: `2px solid ${isActive ? c : 'transparent'}`,
                    transition: 'all 80ms linear',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isActive ? c : '#3A4560' }}>{m.id}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: c, background: `${c}15`, padding: '1px 7px', clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)', border: `1px solid ${c}35` }}>{m.status}</div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 500, color: isActive ? '#fff' : '#A8B4CC', marginBottom: 8 }}>{m.name}</div>
                  <ProgressBar pct={m.pct} color={c} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, background: '#0D1220', border: `1px solid ${statusColor[m.status]}30`, clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: `0 0 20px ${statusColor[m.status]}12` }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 120, background: `radial-gradient(ellipse at top left, ${statusColor[m.status]}07, transparent 60%)`, pointerEvents: 'none' }}></div>
          {/* Corner ticks */}
          <div style={{ position: 'absolute', top: 8, left: 8, width: 14, height: 14, borderTop: `2px solid ${statusColor[m.status]}60`, borderLeft: `2px solid ${statusColor[m.status]}60` }}></div>
          <div style={{ position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderBottom: `2px solid ${statusColor[m.status]}60`, borderRight: `2px solid ${statusColor[m.status]}60` }}></div>

          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1E2A3F', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: statusColor[m.status], marginBottom: 6, letterSpacing: '0.08em' }}>{m.id} // {m.sector}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.06em', color: '#fff' }}>{m.name}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: statusColor[m.status], background: `${statusColor[m.status]}12`, padding: '4px 14px', clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)', border: `1px solid ${statusColor[m.status]}40`, marginTop: 4 }}>{m.status}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><ProgressBar pct={m.pct} color={statusColor[m.status]} /></div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: statusColor[m.status], width: 36, textAlign: 'right' }}>{m.pct}%</div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', flex: 1, overflow: 'auto' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>// BRIEFING</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: '#A8B4CC', lineHeight: 1.6, marginBottom: 24 }}>{m.desc}</div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#080C14', border: '1px solid #1E2A3F', padding: '12px 14px', clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3A4560', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Est. Time</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#fff', letterSpacing: '0.06em' }}>{m.time}</div>
              </div>
              <div style={{ flex: 1, background: '#080C14', border: '1px solid #1E2A3F', padding: '12px 14px', clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3A4560', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Sector</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{m.sector}</div>
              </div>
            </div>

            {m.status !== 'DONE' && (
              <div style={{ marginTop: 20 }}>
                <button
                  style={{
                    background: statusColor[m.status], color: m.status === 'BLOCKED' ? '#fff' : '#050810',
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '11px 24px', border: 'none', cursor: 'pointer',
                    clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                    boxShadow: `0 0 14px ${statusColor[m.status]}40`,
                  }}
                >{m.status === 'BLOCKED' ? '▸ RETRY EXPLOIT' : m.status === 'ACTIVE' ? '▸ VIEW TERMINAL' : '▸ INITIATE'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenMission });
