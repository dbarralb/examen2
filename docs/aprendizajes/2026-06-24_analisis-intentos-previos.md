# Análisis forense de intentos previos — base de aprendizaje

**Fecha:** 2026-06-24
**Autor del análisis:** sesión de diseño (Claude) + 4 agentes-analistas en paralelo
**Propósito:** dejar reflejado qué se hizo en los intentos anteriores y por qué fallaron, para no repetir errores en el proyecto nuevo. Documento vivo y fechado (regla del método: *capturar sobre la marcha*).

> Este documento se redactó al arrancar el proyecto nuevo (séptimo intento). Recupera el contenido del intento #6 (protocolo-ECO), que había sido **vaciado a cero** en `main` pero sobrevivía en commits colgantes (`906aa83`, `c62a9f4`). Sin esta recuperación, el aprendizaje se habría perdido.

---

## 1. Inventario de repos (cuenta de dbarralb)

| Repo | Creado | Stack | Estado | Relevancia |
|---|---|---|---|---|
| **protocolo-ECO** | 2026-05-11 | Vite+React+TS+Firebase+LiveKit | vaciado a cero (recuperado) | **Intento #6 — analizado a fondo aquí** |
| **escape-in-time** | 2026-06-01 | HTML | activo | Intento de juego — *pendiente de analizar (sin acceso)* |
| **examen2** | 2026-04-23 | JavaScript (branch `legacy`) | superado | "Juego secuela de el examen" — *pendiente de analizar (sin acceso)* |
| web-fotosane | 2026-06-12 | TypeScript (privado) | — | Fuera de alcance (no es juego) |
| biografia / ramp-up / lascosasdedavid | 2020 | HTML/CSS | — | Prácticas de bootcamp — irrelevantes |

---

## 2. Hallazgo principal: el núcleo nunca se fijó

En **un solo repositorio** (protocolo-ECO) conviven **tres conceptos de juego distintos**:

1. **Credencial Fantasma** — 1 jugador, doble pantalla (PC + móvil). Aparece en los documentos de playtest y en la guía de tests automáticos. Es también el nombre interno del paquete (`credencial-fantasma`).
2. **Protocolo ECO** — co-op multijugador 2-4 en tiempo real. Es lo que está construido en el código.
3. **Aura / Protocolo ECO (postmortem 2026-06-24)** — async, roles ocultos (un Topo), poso roguelike, mundo vivo, "recomponer almas en una IA distópica". Es un pivote posterior, sobre papel.

**Conclusión:** se construyó muchísimo sobre un cimiento que cambiaba. Esta es la causa raíz que explica los 6 intentos.

---

## 3. Qué era *de verdad* protocolo-ECO (el código)

- **Género:** co-op **síncrono** de hacking / escape room. NO es social de roles ocultos. **No hay Topo ni traidor.** La cooperación nace de *información incompleta repartida*, no de la desconfianza.
- **Ambientación:** "Instituto Newton" como arquitectura digital habitable. Unos alumnos convertidos en datos por un experimento fallido; el profesor Toribio Plasma liberó una IA. Estética: plano técnico brutalista sobre hoja cuadriculada.
- **Bucle:** **PC = observar/interpretar; Móvil = hackear/intervenir** (declarada "identidad intocable"). Moverse por nodos vía cables → mantener SPACE para exponer vulnerabilidades → QR al móvil → minijuego HackGrid → infectar nodo → se abren paneles → el switch de sala abre radio local y revela red → cooperar.
- **Tesis de diseño:** *alfabetización sistémica* — que el jugador piense "entiendo cómo funciona este lugar", no "sé jugar este videojuego".
- **Tema = mecánica (bien hecho a ratos):** moverte *es* desplazar datos; no puedes ocupar el nodo de otro ("hay otra presencia en ese punto de red"); ordenar expedientes revela que "un expediente no salva a un alumno, solo lo hace localizable". Ahí hay talento de diseño real.
- **Game Master:** humano que da voz a Toribio (megafonía), bloquea/desbloquea salas, emite misiones, dispara eventos. Operador de experiencia, no árbitro.

---

## 4. Cómo trabajamos: pros y contras (con evidencia)

### Pros (de nivel profesional)
- **Documentación viva disciplinada:** tríada canónica (GDD = sistema, NARRATIVE = mundo, PLAYER_SCRIPT = experiencia) + docs de trabajo + `docs/OLD/`. Fechado y trazable.
- **"Regla de cierre":** ningún cambio se cierra sin responder *¿qué cambia en el sistema? / ¿qué significa en el mundo? / ¿qué experimenta el jugador?* Trazabilidad diseño↔código real.
- **Instinto de tema=mecánica** y método **pitch-first + playtest escrito** (cazar huecos en papel antes de programar).
- **Una decisión cada vez, con A/B/C + recomendación.**
- **Músculo de ejecución:** ~22.600 líneas TS/TSX, multijugador en tiempo real y voz, en 4 meses.

### Contras (el patrón que nos hunde)
1. **La ingeniería adelantó a la validación del núcleo.** Se construyó voz (LiveKit), editor de mapas in-app, sistema de diseño de 84 archivos y doble despliegue (Firebase + Netlify)… para "8 minutos jugables", **con los puzzles aún en estado *pendiente***. La voz se construyó entera y luego se **apagó** (`VOICE_ENABLED=false`; jugaban por Discord).
2. **El núcleo se movía** (los tres conceptos del punto 2).
3. **Probamos que las cosas *funcionan*, no que *divierten*.** Tres métodos de prueba (playtest simulado por IA, observación en vivo dirigida por GM, tests automáticos) pero **cero playtests con humanos reales midiendo disfrute.** El éxito era "una frase verbalizable", no gente picándose.
4. **Sobre-proceso:** ~7 capas de docs y rituales de cierre para un prototipo; un ticket (PE-001) cuyo entregable *era crear el backlog*. El método empezó a servirse a sí mismo. ~33 tickets PE-### pero changelog casi vacío.
5. **Deriva de alcance** hacia "el instituto entero" (8 salas, NPC, jugador falso, 5 roles) muy por encima de un trozo jugable.
6. **Reiniciar desde cero.** 6 repos; este se vació a cero y casi se pierde. Tiramos el aprendizaje en cada vuelta.

### Datos técnicos de alcance
- 71 archivos `src` (~22.578 líneas), 4 pantallas, 40 componentes, 14 dependencias.
- Archivos monolito: `RoomScreen.tsx` (2.592 líneas), `NodeContentPanel.tsx` (1.541), `HackGrid.tsx` (1.360), `sessions.ts` (1.350), `GameMasterScreen.tsx` (1.079).
- Sistema de diseño: 84 archivos, 31 previews HTML, 30 iconos SVG.
- **Riesgo de seguridad:** reglas de Firebase abiertas (`.read/.write: true` en `sessions`, sin auth).
- Activos pesados versionados: `Newton_map.png` (2,6 MB), `Protocolo Eco Design System.zip` (12,5 MB).

---

## 5. Principios para el flujo nuevo (preliminar)

1. **Fijar la frase del jugador y validarla con personas reales ANTES de construir nada grande.**
2. **Trozo vertical mínimo que demuestre diversión** → test con humanos → solo entonces expandir.
3. **Un único repo que evoluciona. Nunca más empezar de cero.**
4. **Proceso a la medida:** mantener la disciplina de docs vivos, pero ligera. El método sirve al juego, no al revés.
5. **Si el género es social, el jugo social (acusar, mentir, pillar) vive DENTRO de la app y se valida con gente.**
6. **Calendario hacia atrás desde septiembre** con hitos jugables.

---

## 6. Estado / pendientes

- [x] protocolo-ECO recuperado y analizado.
- [ ] **examen2** — pendiente de analizar (sin acceso: fuera del scope de la sesión).
- [ ] **escape-in-time** — pendiente de analizar (sin acceso).
- [ ] Propuesta de flujo de trabajo profesional completo (agentes-departamento + calendario).
