import { useState } from "react";
import { E2Logo, NBadge, NButton, NCard } from "../components/e2";
import {
  GM_SESSION_ACCESS_CODE,
  getActiveSessionCode,
  getSession,
  normalizeGmSessionCode,
  normalizeSessionCode,
  storeGmSessionCode,
  storeSessionCode,
} from "../services/sessionAccess.js";

export function AccessScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [gmCode, setGmCode] = useState("");
  const [status, setStatus] = useState("Esperando código...");
  const [gmStatus, setGmStatus] = useState("Acceso GM pendiente.");
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

  function handleGmSubmit(event) {
    event.preventDefault();
    const normalizedCode = normalizeGmSessionCode(gmCode);

    if (normalizedCode !== GM_SESSION_ACCESS_CODE) {
      setGmStatus("Codigo GM incorrecto.");
      return;
    }

    storeGmSessionCode(normalizedCode);
    setGmStatus("Acceso GM autorizado.");
    navigation.go("gm");
  }

  return (
    <main className="react-screen react-access-screen">
      <NCard className="access-console" glow>
        <E2Logo />
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
        <form className="react-form gm-access-form" onSubmit={handleGmSubmit}>
          <label htmlFor="gm-session-code">Codigo Game Master</label>
          <input
            id="gm-session-code"
            autoComplete="off"
            placeholder="codigo GM"
            value={gmCode}
            onChange={(event) => setGmCode(event.target.value)}
          />
          <NButton type="submit" variant="secondary">Entrar como GM</NButton>
        </form>
        <p className="react-status" role="status" aria-live="polite">{gmStatus}</p>
      </NCard>
    </main>
  );
}
