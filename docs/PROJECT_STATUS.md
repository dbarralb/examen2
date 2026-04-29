# Estado del Proyecto - El Examen II

**Fecha de ultima actualizacion:** 2026-04-28  
**Rama activa:** `react-oficial`  
**Historico:** `docs/OLD`

---

## Estado actual

**Nivel 1 activo: Almacen.** La app React ya apunta al primer escenario real. `sandbox` queda solo como fallback tecnico.

### Que esta listo

- [x] Tablero unico por jugador, paneable y zoomeable
- [x] Sistema de escenarios y variantes A/B/C/D
- [x] Escenario `almacen` con realidades A/B repartidas 2+2
- [x] Hotspots base del almacen: pizarra, taquillas, caja, balones, panel de salida
- [x] Contenido inicial por escenario en `src/data/scenarioContent.js`
- [x] Resolver inicial por escenario conectado a `gameRules.js`
- [x] Panel GM con asignacion de variantes por jugador
- [x] Inventario: barra de 3 slots + grid de objetos por contenedor
- [x] Sistema de pulso manual controlado por GM
- [x] Minijuego de carga de accion
- [x] Sistema de alarma y efectos GM desacoplados del puzzle antiguo
- [x] Monitores de jugadores en panel GM
- [x] Chat entre jugadores y GM
- [x] HTML legacy archivado en `docs/OLD/html-legacy`
- [x] Prototipos de minijuegos archivados en `docs/OLD/assets-legacy/minigames`
- [x] Sistema de diseno activo unico: `El Examen 2 Design System`
- [x] Sistema antiguo Instituto Newton archivado en `docs/OLD/design-systems`

### Pendiente

- [ ] Arte final de fondos por variante
- [ ] Balancear y testear el puzzle completo del almacen
- [ ] Convertir el pulso en ventana de visibilidad entre jugadores
- [ ] Refinar textos finales de tarjetas, feedback y consola
- [ ] Reset/semilla de Firebase para pruebas repetibles

---

## Archivos clave

| Archivo | Para editar |
|---|---|
| `src/data/scenarioData.js` | Alta de escenarios y fondos por variante |
| `src/data/scenarioContent.js` | Hotspots, items, feedback, consola y resolver inicial por escenario |
| `src/data/gameData.js` | Familias y cartas globales |
| `src/services/gameRules.js` | Alarma + delegacion al resolver de escenario |
| `src/services/pulseService.js` | Ciclo completo del pulso |
| `src/services/remoteState.js` | Estado inicial de Firebase |
| `docs/game_design.md` | Diseno narrativo y mecanicas |
| `docs/architecture.md` | Referencia tecnica del sistema |
| `docs/gm-operations.md` | Reglas operativas del panel GM |
| `El Examen 2 Design System/` | Sistema de diseno activo |
