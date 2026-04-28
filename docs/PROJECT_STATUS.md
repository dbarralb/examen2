# Estado del Proyecto — El Examen II

**Fecha de última actualización:** 2026-04-28
**Rama activa:** `react-oficial`
**Rama de archivo:** `legacy`

---

## Estado actual

**Blank slate activo.** Los sistemas del juego están limpios y listos para recibir contenido narrativo.

### Qué está listo

- [x] Tablero único por jugador (paneable, zoomeable, 3 hotspots)
- [x] Sistema de variantes A/B/C/D por escenario
- [x] Panel GM con asignación de variantes por jugador
- [x] Inventario (barra de 3 slots + grid de objetos por hotspot)
- [x] Sistema de pulso (manual, GM-driven)
- [x] Minijuego de carga de acción
- [x] Sistema de alarma (niveles 0-3, efectos GM)
- [x] Monitores de jugadores en panel GM
- [x] Chat entre jugadores y GM
- [x] Fondos placeholder por rol/variante (SVG de color)

### Pendiente

- [ ] Contenido narrativo del primer escenario
- [ ] Arte de fondos por variante
- [ ] Lógica de resolución de acciones (resolver de puzzle)
- [ ] Tarjetas de elemento por hotspot
- [ ] Arquitectura del pulso como ventana de visibilidad entre jugadores

---

## Ramas

| Rama | Contenido |
|---|---|
| `react-oficial` | Código actual — blank slate |
| `legacy` | Código histórico con Sala 1 (examen), script de test, sistema de narrativa Protocolo Eco |

---

## Archivos clave

| Archivo | Para editar |
|---|---|
| `src/data/scenarioData.js` | Añadir escenarios y variantes |
| `src/data/gameData.js` | Definir hotspots, familias, cartas |
| `src/services/gameRules.js` | Implementar lógica de resolución de acciones |
| `docs/game_design.md` | Diseño narrativo y mecánicas |
| `docs/architecture.md` | Referencia técnica del sistema |
