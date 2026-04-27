import { useState } from "react";
import { NBadge, NButton, NCard, NewtonLogo } from "../components/newton";
import { getActiveSessionCode, getSession, normalizeSessionCode, storeSessionCode } from "../services/sessionAccess.js";

export function AccessScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Esperando código...");
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedCode = normalizeSessionCode(code);

    if (normalizedCode.length !== 6) {
      setStatus("Introduce los 6 dígitos del código.");
      return;
    }

    setIsChecking(true);
    setStatus("Comprobando código...");

    try {
      const session = await getSession();
      const activeCode = getActiveSessionCode(session);

      if (!activeCode) {
        setStatus("El GM todavía no ha iniciado una partida con código.");
        return;
      }

      const playerCodes = session?.playerCodes ? Object.values(session.playerCodes) : [];
      const isValid = normalizedCode === activeCode || playerCodes.includes(normalizedCode);

      if (!isValid) {
        setStatus("Código incorrecto.");
        return;
      }

      storeSessionCode(normalizedCode);
      navigation.go("roles");
    } catch (error) {
      setStatus("No se pudo comprobar Firebase. Reintenta en unos segundos.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="react-screen react-access-screen">
      <NCard className="access-console" glow>
        <NewtonLogo />
        <NBadge status="info">Acceso restringido</NBadge>
        <h1>Código de sesión</h1>
        <p>
          Introduce el código de 6 dígitos generado por el Game Master para acceder a la selección de perfil.
        </p>
        <form className="react-form" onSubmit={handleSubmit}>
          <label htmlFor="session-code">Código</label>
          <input
            id="session-code"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(normalizeSessionCode(event.target.value))}
          />
          <NButton type="submit" disabled={isChecking}>{isChecking ? "Comprobando" : "Entrar"}</NButton>
        </form>
        <p className="react-status" role="status" aria-live="polite">{status}</p>
        <button className="react-link-button" type="button" onClick={() => navigation.go("gm")}>
          Entrar como Game Master
        </button>
        <button className="react-link-button" type="button" onClick={() => navigation.go("codex")}>
          Codex
        </button>
      </NCard>
    </main>
  );
}
