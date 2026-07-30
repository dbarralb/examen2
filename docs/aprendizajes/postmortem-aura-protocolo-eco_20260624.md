# Post-mortem — Aura, Protocolo ECO (el proceso de diseño)

**Fecha:** 2026-06-24 · Documento suelto, fuera del repositorio. Resumen honesto de lo aprendido.

> Nota: este es el postmortem original (sobre el diseño en papel del pivote async/roles-ocultos). El análisis forense del código realmente construido está en `2026-06-24_analisis-intentos-previos.md`, y matiza varias cosas de aquí (el repo NO era solo papel: era un co-op síncrono de hacking ya construido).

## En una frase
Diseñamos sobre el papel un juego social de móvil: **asíncrono, de roles ocultos (un Topo), con poso roguelike y un mundo que vive solo.** Las mecánicas convencen; el marco narrativo quedó en duda.

## Lo que funcionó (y repetiríamos)
- **Una decisión cada vez, con opciones A/B/C y una recomendación.** Avanza sin abrumar y deja un rastro claro de por qué se decidió cada cosa.
- **Tema = mecánica.** Lo más fuerte que salió: *borrar es barato, recordar es caro* (el Topo rompe con un gesto; los leales necesitan muchos). Cuando la regla **es** el significado, tienes algo de verdad.
- **"Damos herramientas; el jugador decide cómo usarlas."** No se diseña la traición, se diseña el escenario donde puede pasar.
- **Probar escribiendo antes de programar.** Las simulaciones jugadas (tests escritos) destaparon huecos reales —p. ej. que no había forma de *conocer* a la gente— sin gastar una línea de código.
- **El GDD como espejo, fechar los documentos y commitear sobre la marcha.** Nada se perdió y todo quedó situado en el tiempo.
- **Rescatar lo viejo con criterio.** El HUB antiguo ya traía media solución del mundo vivo dentro (el recap "mientras no estabas").

## Lo que salió mal (y aprendimos a no repetir)
- **Diseñamos muchas mecánicas antes de comprobar si el NÚCLEO narrativo enamora.** El "trasfondo un poco truño" apareció tarde, con mucho ya construido encima.
- **El juego derivó a "puzzle en solitario" cuando el género va de lo SOCIAL.** Acusar, mentir y pillar al Topo —lo que la gente comenta— quedó flaco y fuera de la app (en el WhatsApp).
- **El marco pesaba demasiado para el formato.** Recomponer almas dentro de una IA distópica es bonito, pero exigente para un juego de 3 minutos para picarte con amigos.
- **Declaramos un "núcleo fijo" (el alma) y luego nos vimos cuestionando ese mismo núcleo.** Lección: validar el **atractivo** del núcleo (su pitch) antes de declararlo intocable.
- **Se acumuló jerga propia** ("forjar", "inserción", "calentar") que oscureció la comunicación; volver a lenguaje llano lo arregló.

## La lección madre
**Decide primero la frase que dirá el jugador ("de qué va esto y por qué mola") y construye el mundo para cumplirla.** Fuimos de dentro afuera (mecánicas → núcleo); para un producto que vive del boca a boca, conviene anclar pronto la promesa de cara al jugador.

## Dónde lo dejamos
Mecánicas sólidas y **agnósticas del trasfondo** (async · roles ocultos · roguelike · mundo vivo). Decisión abierta: **¿juego social primero (estilo Los Traidores) o puzzle emocional primero (rescatar almas)?** Siguiente paso acordado: **pitch-first** — escribir 2-3 marcos con su frase de jugador y elegir con evidencia, antes de archivar nada.
