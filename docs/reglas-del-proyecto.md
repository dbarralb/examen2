# Reglas del proyecto — el juego nuevo (séptimo intento)

**Fecha:** 2026-06-24

## Qué estamos haciendo
Un **juego social** (app web + móvil) basado en **mecánicas de roles ocultos**, con **núcleos roguelike** y **toma de decisiones**. Los jugadores usan sobre todo el **móvil**, pero también pueden usar el **PC**. Hay un **Game Master** que supervisa la partida y puede participar — **no como árbitro/interruptor del juego, sino como mejora de la experiencia**.

Es el **sexto intento fallido en 4 meses**; este es el séptimo. **Objetivo: crear el juego y lanzarlo en septiembre.** Queremos hacerlo **como en la industria profesional**: leer documentación real y libros de game design con buenas prácticas, y apoyarnos en agentes que trabajen como los departamentos de una empresa virtual.

## Reglas de trabajo (innegociables)
1. **Una decisión cada vez**, con opciones **A/B/C** y una **recomendación**. Avanza sin abrumar y deja un **rastro claro** de por qué se decidió cada cosa.
2. **"Damos herramientas; el jugador decide cómo usarlas."** No se diseña la traición; se diseña el escenario donde puede pasar.
3. **Probar escribiendo antes de programar.** Las partidas jugadas (tests escritos) destapan huecos reales sin gastar una línea de código.

## Principios añadidos (del análisis de los 6 intentos)
- **Estudiar lo que salió mal para no repetirlo.**
- **Pitch-first:** fijar la frase del jugador y **validar su atractivo con personas reales** antes de construir nada grande.
- **Trozo vertical mínimo que demuestre diversión** → test con humanos → solo entonces expandir.
- **Social-first:** si el género es social, el jugo (acusar, mentir, pillar) vive **dentro** de la app y se valida con gente.
- **Un único repo que evoluciona. Nunca más empezar de cero.**
- **Documentación viva pero ligera:** el método sirve al juego, no al revés. **Commit por decisión**, fechado.

## Documentos base
- `docs/aprendizajes/2026-06-24_analisis-intentos-previos.md` — análisis forense de protocolo-ECO + pros/contras del método.
- `docs/aprendizajes/postmortem-aura-protocolo-eco_20260624.md` — postmortem original del pivote en papel.
- `.claude/skills/diseno-de-juego/SKILL.md` — el método de diseño (se auto-carga como skill).
