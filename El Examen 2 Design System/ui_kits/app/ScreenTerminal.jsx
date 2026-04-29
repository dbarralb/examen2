// ScreenTerminal.jsx — El Examen 2 UI Kit
const { useState: useStT, useEffect: useEffT, useRef: useRefT } = React;

const BOOT_LINES = [
  { text: '> EL EXAMEN_2 terminal v2.4.1', color: '#00FF87' },
  { text: '> initializing environment...', color: '#6B7A96' },
  { text: '> node: 0x7F3A — latency: 12ms', color: '#6B7A96' },
  { text: '> operator: ROOT — session: #9C2F', color: '#6B7A96' },
  { text: '> [OK] all systems nominal', color: '#00FF87' },
  { text: '', color: '' },
];

const COMMANDS = {
  help: [
    { text: 'available commands:', color: '#00EAFF' },
    { text: '  ls        — list active nodes', color: '#A8B4CC' },
    { text: '  scan      — scan current sector', color: '#A8B4CC' },
    { text: '  exploit   — run exploit module', color: '#A8B4CC' },
    { text: '  status    — system status', color: '#A8B4CC' },
    { text: '  clear     — clear terminal', color: '#A8B4CC' },
  ],
  ls: [
    { text: 'NODE-7F3A   [ONLINE]   sector-1', color: '#00FF87' },
    { text: 'NODE-2C1B   [ONLINE]   sector-1', color: '#00FF87' },
    { text: 'NODE-9D4E   [OFFLINE]  sector-2', color: '#3A4560' },
    { text: 'NODE-5A0F   [LOCKED]   sector-3', color: '#FF2D78' },
  ],
  scan: [
    { text: '// scanning sector-1...', color: '#6B7A96' },
    { text: '⚠ anomaly detected: 0x7F — flagged', color: '#FFEA00' },
    { text: '// 2 open ports: 22, 443', color: '#A8B4CC' },
    { text: '[OK] scan complete', color: '#00FF87' },
  ],
  exploit: [
    { text: '// loading exploit module v2.4...', color: '#6B7A96' },
    { text: '// targeting NODE-7F3A...', color: '#6B7A96' },
    { text: '✕ FIREWALL RESPONSE — countermeasure active', color: '#FF2D78' },
    { text: '// retrying with bypass route...', color: '#FFEA00' },
    { text: '[PARTIAL] access limited — 41% breach', color: '#FFEA00' },
  ],
  status: [
    { text: 'SYSTEM STATUS', color: '#00EAFF' },
    { text: '  nodes online:  7 / 12', color: '#A8B4CC' },
    { text: '  exploits run:  23', color: '#A8B4CC' },
    { text: '  integrity:     74%', color: '#FFEA00' },
    { text: '  alerts:        3', color: '#FF2D78' },
  ],
};

function ScreenTerminal() {
  const [lines, setLines] = useStT([]);
  const [input, setInput] = useStT('');
  const [booted, setBooted] = useStT(false);
  const endRef = useRefT(null);

  useEffT(() => {
    let i = 0;
    const iv = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(l => [...l, BOOT_LINES[i++]]);
      } else { setBooted(true); clearInterval(iv); }
    }, 180);
    return () => clearInterval(iv);
  }, []);

  useEffT(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [lines]);

  const handleKey = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = input.trim().toLowerCase();
    const echo = { text: `▸ ${input}`, color: '#fff' };
    if (cmd === 'clear') { setLines([]); setInput(''); return; }
    const response = COMMANDS[cmd] || [{ text: `command not found: ${cmd} — type 'help'`, color: '#FF2D78' }];
    setLines(l => [...l, echo, ...response, { text: '', color: '' }]);
    setInput('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080C14' }}>
      <TopBar title="El Examen 2" screen="TERMINAL // NODE-7F3A" status="ONLINE" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 16, background: '#0D1220', border: '1px solid #1E2A3F', clipPath: 'polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)', position: 'relative', overflow: 'hidden' }}>
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.055) 2px, rgba(0,0,0,0.055) 4px)', pointerEvents: 'none', zIndex: 2 }}></div>

        {/* Header */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,255,135,0.15)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: '#080C14' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF87', boxShadow: '0 0 5px rgba(0,255,135,0.7)' }}></div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFEA00', boxShadow: '0 0 5px rgba(255,234,0,0.5)' }}></div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF2D78', boxShadow: '0 0 5px rgba(255,45,120,0.5)' }}></div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00FF87', marginLeft: 8, letterSpacing: '0.12em', textTransform: 'uppercase' }}>TERMINAL // NODE-7F3A</div>
          <div style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560' }}>SESSION #9C2F</div>
        </div>

        {/* Output */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, color: l.color || 'transparent', whiteSpace: 'pre' }}>{l.text || '\u00a0'}</div>
          ))}
          {booted && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, color: '#00FF87', display: 'flex', alignItems: 'center', gap: 4 }}>
              ▸ <span style={{ display: 'inline-block', width: 7, height: 13, background: '#00FF87', boxShadow: '0 0 5px rgba(0,255,135,0.7)', animation: 'blink 1s steps(1) infinite', verticalAlign: 'text-bottom' }}></span>
            </div>
          )}
          <div ref={endRef}></div>
        </div>

        {/* Input */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #1E2A3F', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: '#080C14' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00FF87' }}>▸</span>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#fff', caretColor: '#00FF87' }}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={booted ? "type 'help' for commands..." : ''}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTerminal });
