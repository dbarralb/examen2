// App.jsx — El Examen 2 UI Kit root
const { useState: useStApp } = React;

function App() {
  const [screen, setScreen] = useStApp('login');
  const [nav, setNav] = useStApp('dashboard');

  const handleLogin = () => setScreen('app');

  const renderScreen = () => {
    if (nav === 'terminal') return React.createElement(ScreenTerminal);
    if (nav === 'missions') return React.createElement(ScreenMission);
    return React.createElement(ScreenDashboard, { onNav: setNav });
  };

  if (screen === 'login') {
    return React.createElement(ScreenLogin, { onLogin: handleLogin });
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden' }}>
      <Sidebar active={nav} onNav={setNav} />
      {renderScreen()}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
