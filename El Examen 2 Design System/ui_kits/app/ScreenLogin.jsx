// ScreenLogin.jsx — El Examen 2 UI Kit
const { useState: useSt, useEffect: useEff } = React;

const loginSt = {
  wrap: {
    width: '100%', height: '100%',
    background: '#050810',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(0,255,135,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  diag: {
    position: 'absolute', top: 0, right: 0,
    width: 0, height: 0,
    borderLeft: '300px solid transparent',
    borderTop: '300px solid rgba(0,255,135,0.02)',
  },
  card: {
    width: 400, position: 'relative', zIndex: 2,
    background: '#0D1220',
    border: '1px solid #1E2A3F',
    clipPath: 'polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)',
    animation: 'fadeIn 0.4s ease',
  },
  cardHeader: {
    padding: '24px 28px 20px',
    borderBottom: '1px solid #1E2A3F',
    position: 'relative', overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: 100,
    background: 'radial-gradient(ellipse at top left, rgba(0,255,135,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  cardBody: { padding: '24px 28px' },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#3A4560', marginBottom: 6,
  },
  input: {
    width: '100%', background: '#161D2E',
    border: '1px solid #2A3855', color: '#fff',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    padding: '10px 12px', outline: 'none',
    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
    marginBottom: 16, caretColor: '#00FF87',
    transition: 'all 120ms linear',
  },
  btn: {
    width: '100%', padding: '12px 0',
    background: '#00FF87', color: '#050810',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    border: 'none', cursor: 'pointer',
    clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
    boxShadow: '0 0 16px rgba(0,255,135,0.35)',
    transition: 'all 120ms linear',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cornerTL: {
    position: 'absolute', top: 8, left: 8,
    width: 14, height: 14,
    borderTop: '2px solid #00FF87', borderLeft: '2px solid #00FF87',
  },
  cornerBR: {
    position: 'absolute', bottom: 8, right: 8,
    width: 14, height: 14,
    borderBottom: '2px solid #00FF87', borderRight: '2px solid #00FF87',
  },
};

function ScreenLogin({ onLogin }) {
  const [user, setUser] = useSt('');
  const [pass, setPass] = useSt('');
  const [err, setErr] = useSt(false);
  const [loading, setLoading] = useSt(false);
  const [chars, setChars] = useSt([]);

  useEff(() => {
    const lines = ['> connecting...', '> awaiting auth', '> node: 0x7F3A', '> session: NEW'];
    let i = 0;
    const iv = setInterval(() => {
      if (i < lines.length) { setChars(c => [...c, lines[i++]]); }
      else clearInterval(iv);
    }, 600);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!user || !pass) { setErr(true); return; }
    setLoading(true); setErr(false);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div style={loginSt.wrap}>
      <div style={loginSt.grid}></div>
      <div style={loginSt.diag}></div>
      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,135,0.04) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,0,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, zIndex: 2 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: '0.1em', color: '#fff', lineHeight: 1, position: 'relative' }}>
            EL EXAMEN<span style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.6)' }}>_2</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#3A4560', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 4 }}>// terminal interface v2.4</div>
        </div>

        {/* Terminal pre-boot */}
        <div style={{ width: 400, background: '#080C14', border: '1px solid #1E2A3F', padding: '10px 14px', clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)' }}>
          {chars.map((l, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#3A4560', lineHeight: 1.7 }}>{l}</div>
          ))}
        </div>

        {/* Login card */}
        <div style={loginSt.card}>
          <div style={loginSt.cornerTL}></div>
          <div style={loginSt.cornerBR}></div>
          <div style={loginSt.cardHeader}>
            <div style={loginSt.headerGlow}></div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.12em', color: '#fff' }}>AUTHENTICATE</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3A4560', marginTop: 2 }}>// enter credentials to proceed</div>
          </div>
          <div style={loginSt.cardBody}>
            <form onSubmit={handleSubmit}>
              <div style={loginSt.label}>Operator ID</div>
              <input
                style={{ ...loginSt.input, borderColor: err && !user ? '#FF2D78' : '#2A3855' }}
                value={user} onChange={e => setUser(e.target.value)}
                placeholder="// enter id..."
              />
              <div style={loginSt.label}>Passphrase</div>
              <input
                type="password"
                style={{ ...loginSt.input, borderColor: err && !pass ? '#FF2D78' : '#2A3855' }}
                value={pass} onChange={e => setPass(e.target.value)}
                placeholder="// enter passphrase..."
              />
              {err && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#FF2D78', marginBottom: 14 }}>✕ authentication failed — try again</div>}
              <button
                type="submit"
                style={{ ...loginSt.btn, opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,135,0.6)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,135,0.35)'}
              >
                {loading ? '// connecting...' : '▸ INITIATE SESSION'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLogin });
