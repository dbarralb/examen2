# Estado del Proyecto - El Examen II

**Fecha de ultima actualizacion:** 2026-05-06
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
- [x] Resonancia ambiental local: contador en jugador, recompensa por abrir `balones`, spawn visual local y recogida por hover
- [x] Optimizacion inicial web de jugador: mapas responsive, polling parcial, menos renders y menor frecuencia de `playerViews`
- [x] HTML legacy archivado en `docs/OLD/html-legacy`
- [x] Prototipos de minijuegos archivados en `docs/OLD/assets-legacy/minigames`
- [x] Sistema de diseno activo unico: `El Examen 2 Design System`
- [x] Sistema antiguo Instituto Newton archivado en `docs/OLD/design-systems`

### Pendiente

- [ ] Arte final de fondos por variante
- [ ] Balancear y testear el puzzle completo del almacen
- [ ] Convertir el pulso en ventana de visibilidad entre jugadores
- [ ] Implementar eventos internos de onda temporal para sonido; contrato fijado en `docs/architecture.md` y deben dispararse solo en transicion
- [ ] Refinar textos finales de tarjetas, feedback y consola
- [ ] Semilla reproducible de Firebase para pruebas repetibles
- [ ] Deuda tecnica: estudiar un modo de accesibilidad para ampliar el texto de las cajas sin reactivar zoom del escenario
- [ ] Deuda tecnica: optimizar rendimiento web antes de escalar contenido y monitores GM
  - [x] Generar variantes WebP/AVIF responsive de los mapas `almacen_A/B` y conservar PNG como fallback
  - [x] Revisar polling de Firebase cada 1s para evitar leer `getRemoteState()` completo en la web de jugador; quedan monitores GM con lectura completa
  - [ ] Medir memoria real en Chrome/Firefox con prueba de estres de jugador y GM con varios monitores abiertos
  - [x] Vigilar coste pasivo del `SceneMap`: capas estables memoizadas y efectos VFX montados solo cuando estan activos

---

## Checklist reciente - Resonancia ambiental local

- [x] Documentar v1 en estado de proyecto
- [x] Mostrar contador de resonancia en pantalla de jugador con color `#9ED300`
- [x] Sumar `+3` al abrir `balones` una sola vez
- [x] Generar spawn ambiental local cada 25-40s
- [x] Animar circulo `1 -> 8`, emergencia del cuadrado, flotacion y despawn suave
- [x] Mantener v1 sin click/recogida antes de activar hover
- [x] Implementar recogida de resonancia ambiental por hover de 0,5s con feedback luminoso y `+1`

---

## Checklist reciente - Optimizacion web de jugador

- [x] Documentar objetivos: memoria de mapas, payload Firebase, renders por polling y coste visual del mapa
- [x] Generar WebP/AVIF responsive para `almacen_A` y `almacen_B`
- [x] Actualizar `BackgroundLayer` con `<picture>`, `srcSet`, `sizes` y PNG fallback
- [x] Sustituir polling completo de jugador por lecturas parciales de ramas necesarias
- [x] Evitar doble lectura de sesion en jugador durante polling
- [x] Evitar `setRemoteState` si el estado relevante no cambia
- [x] Reducir escrituras de `playerViews` con debounce mayor, umbral de camara y publicacion final tras pan
- [x] Memoizar capas estables del mapa donde aplica
- [x] Optimizar recogida de resonancia leyendo solo `gameState/resonance`
- [ ] Medicion comparativa antes/despues con Chrome Task Manager: 1 jugador, 4 jugadores y GM con monitores

---

## Archivos clave

| Archivo | Para editar |
|---|---|
| `docs/INDEX.md` | Indice y mapa de busqueda de documentacion |
| `docs/experiencia-ux-onboarding.md` | UX onboarding, mecanicas a ensenar y timeline de estimulos/tooltips |
| `docs/art-prompt-process.md` | Proceso para prompts de arte de puzzles, overlays, variantes y objetos independientes |
| `docs/ECO Tech Props v1.md` | ADN visual ECO Tech Props para objetos industriales modulares |
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
