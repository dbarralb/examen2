---
name: diseno-de-juego
description: >-
  Úsala al diseñar o iterar un juego con David: su bucle central, mecánicas,
  sistemas de roles ocultos/sociales, marco narrativo o pitch. Método de diseño
  colaborativo destilado de trabajar juntos — cerrar una decisión cada vez con
  opciones A/B/C y una recomendación clara, perseguir tema=mecánica, diseñar el
  escenario en vez del desenlace, pitch-first, y probar escribiendo partidas
  jugadas antes de tocar código. Dispárala cuando se hable de game design,
  bucle jugable, mecánicas, roles ocultos, economía de acciones o trasfondo.
---

# Diseño de juego con David — el método

Método de trabajo para diseñar juegos con David, sacado de lo que de verdad funcionó (y de lo que no).

## Cómo conversar (el ritmo)
- **Una decisión cada vez.** Cierra UNA definición concreta por intercambio. No vuelques varias a la vez.
- **Opciones A/B/C + recomendación.** Ofrece opciones cerradas, **recomienda una** y explica el porqué. Marca la recomendada.
- **Opinión sincera, sin peloteo.** Di lo que funciona Y lo que chirría, con tacto. Elogio solo **con motivo concreto**; el resto, al grano.
- **Lenguaje llano, siempre.** Nada de jerga. Analogías del mundo real. Si nombras algo técnico, di al lado qué es. Vigila la **jerga propia** que se va acumulando ("forjar", "inserción", "calentar"…): mata la claridad — resetea a palabras llanas en cuanto la detectes.
- **Bloques pequeños y digeribles.** Respuestas cortas; que decida una por una sin perderse.

## Principios de diseño (lo que da oro)
- **Tema = mecánica.** Persigue reglas que **sean** el significado (ej.: *borrar es barato, recordar es caro* → el traidor rompe con un gesto, los leales necesitan muchos). Cuando la regla es el mensaje, tienes algo de verdad.
- **Diseña el escenario, no la traición.** Da herramientas y deja que el jugador cree el drama. No guionices el engaño; construye el sitio donde puede pasar.
- **Pitch-first.** Decide primero **la frase que dirá el jugador** ("de qué va y por qué mola") y construye el mundo para cumplirla. No vayas de dentro afuera (mecánicas → núcleo) en un producto que vive del boca a boca.
- **Social-first en juegos sociales.** Lo que la gente comenta (acusar, mentir, pillar) tiene que vivir **dentro** del juego, no como deberes alrededor. Si el bucle se vuelve un puzzle en solitario, está mal centrado.
- **El mismo gesto sirve a varios perfiles.** Que ganar y sentir no sean juegos distintos: un acto, varias lecturas.
- **Valida el atractivo del núcleo antes de declararlo intocable.** No bautices un "núcleo fijo" que aún no has probado con su pitch.

## Cómo probar sin código
- **Prueba escribiendo.** Antes de programar, escribe **partidas jugadas paso a paso** (un día, un jugador, con su monólogo interno según su rol). Sirve para *sentir* si engancha y destapa huecos baratísimo.
- **Simula contra los perfiles de jugador.** Para cada pieza pregunta: ¿a quién de los perfiles le sirve y a quién deja fuera? Decide a conciencia a quién **no** sirves.
- **Cada test lleva una "foto" del estado del diseño** (qué hay decidido a esa fecha), para situarlo cuando haya muchos.

## Trampas a evitar (lo que salió mal aquí)
- Diseñar muchas **mecánicas** antes de validar que el **núcleo narrativo enamora** (el "trasfondo truño" aparece tarde).
- Dejar que el bucle derive a **puzzle solitario** cuando el género es social.
- Un **marco narrativo demasiado pesado** para el formato (un juego de 3 minutos no aguanta una distopía densa de envoltorio).
- Acumular **jerga propia** que oscurece la comunicación.

## Capturar sobre la marcha
- Escribe cada decisión cerrada en su **documento fuente**; **fecha** los documentos.
- Mantén un **documento espejo** (tipo GDD) que resuma todo y no mienta; revísalo al crear/editar/borrar docs.
- **Commit por decisión**, con mensaje claro.
