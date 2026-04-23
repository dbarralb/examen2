import { NBadge, NCard, NewtonLogo } from "../components/newton";

const minigames = [
  {
    title: "HEXER - System Bypass",
    type: "HTML standalone",
    path: "assets/Minigames/hexer_falling_index.html",
    status: "Necesita adaptar estética Newton y encapsulado React.",
  },
  {
    title: "Sincronización de Ondas",
    type: "React JSX",
    path: "assets/Minigames/puzzle_sincronizacion_ondas_react.jsx",
    status: "Depende de framer-motion, lucide-react y componentes shadcn; pendiente de adaptación.",
  },
];

export function MinigamesLabScreen() {
  return (
    <main className="react-screen react-minigames-screen">
      <header className="react-screen-header">
        <NewtonLogo />
        <div>
          <NBadge status="warning">Laboratorio</NBadge>
          <h1>Minijuegos</h1>
        </div>
      </header>
      <section className="react-role-grid">
        {minigames.map((minigame) => (
          <NCard key={minigame.title} className="react-role-card">
            <NBadge status="info">{minigame.type}</NBadge>
            <h2>{minigame.title}</h2>
            <p>{minigame.status}</p>
            <code>{minigame.path}</code>
          </NCard>
        ))}
      </section>
    </main>
  );
}
