# Estado del Proyecto - El Examen II

**Fecha de ultima actualizacion:** 2026-05-05
**Rama activa:** `react-oficial`
**Historico:** `docs/OLD`

---

## Estado actual

**Nivel 1 activo: Almacen.** La app React ya apunta al primer escenario real. `sandbox` queda solo como fallback tecnico.

### Que esta listo

- [x] Tablero unico por jugador, paneable y con escala fija sin zoom
- [x] Sistema de escenarios y variantes A/B/C/D
- [x] Escenario `almacen` con realidades A/B repartidas 2+2
- [x] Hotspots base del almacen: pizarra, taquillas, caja, balones, panel de salida
- [x] Contenido inicial por escenario en `src/data/scenarioContent.js`
- [x] Resolver inicial por escenario conectado a `gameRules.js`
- [x] Panel GM con asignacion de variantes por jugador
- [x] Herramienta GM de coordenadas/hotspots por variante
- [x] Overrides de hotspots persistidos en Firebase y aplicados a jugadores
- [x] Escalado del mapa de coordenadas alineado con la vista de jugador
- [x] Inventario: barra de 3 slots + grid de objetos por contenedor
- [x] Sistema de pulso manual controlado por GM
- [x] Minijuego de carga de accion
- [x] Acciones atomicas por rol: `Accion_Inspeccion` y `Accion_Interaccion`
- [x] Descubrimiento de inspeccion en taquillas con detalle A/B adyacente a la card de objeto
- [x] Editor GM de posicion para el detalle de inspeccion en el mapa de coordenadas
- [x] Inventario CSV de textos visibles/candidatos en `docs/textos_juego.csv`
- [x] Sistema de alarma y efectos GM desacoplados del puzzle antiguo
- [x] Monitores de jugadores en panel GM
- [x] Chat entre jugadores y GM
- [x] Cursor global custom con escala visual al 50%
- [x] Cards de objeto reducidas un 20%
- [x] `mouse_detection`: hotspots ocultos para jugadores y cursor animado por proximidad
- [x] HTML legacy archivado en `docs/OLD/html-legacy`
- [x] Prototipos de minijuegos archivados en `docs/OLD/assets-legacy/minigames`
- [x] Sistema de diseno activo unico: `El Examen 2 Design System`
- [x] Sistema antiguo Instituto Newton archivado en `docs/OLD/design-systems`

### Pendiente

- [ ] Arte final de fondos por variante
- [ ] Balancear y testear el puzzle completo del almacen
- [ ] Convertir el pulso en ventana de visibilidad entre jugadores
- [ ] Refinar textos finales de tarjetas, feedback y consola
- [ ] Semilla reproducible de Firebase para pruebas repetibles
- [ ] Deuda tecnica: estudiar un modo de accesibilidad para ampliar el texto de las cajas sin reactivar zoom del escenario

---

## Archivos clave

| Archivo | Para editar |
|---|---|
| `docs/INDEX.md` | Indice y mapa de busqueda de documentacion |
| `src/data/actionTypes.js` | Tipos atomicos de accion y descripciones genericas |
| `docs/textos_juego.csv` | Inventario editable de textos del juego |
| `scripts/export-texts.mjs` | Regenerar el inventario CSV de textos desde `src` |
| `src/data/scenarioData.js` | Alta de escenarios y fondos por variante |
| `src/data/scenarioContent.js` | Hotspots, items, feedback, consola y resolver inicial por escenario |
| `src/data/gameData.js` | Familias y cartas globales |
| `src/services/gameRules.js` | Alarma + delegacion al resolver de escenario |
| `src/services/pulseService.js` | Ciclo completo del pulso |
| `src/services/remoteState.js` | Estado inicial de Firebase |
| `src/services/firebaseClient.js` | Lectura/escritura REST de Firebase |
| `src/components/SceneMap.jsx` | Tablero paneable con escala fija |
| `src/components/map/*` | Capas visuales e interactivas del mapa |
| `docs/game_design.md` | Diseno narrativo y mecanicas |
| `docs/architecture.md` | Referencia tecnica del sistema |
| `docs/gm-operations.md` | Reglas operativas del panel GM |
| `El Examen 2 Design System/` | Sistema de diseno activo |
