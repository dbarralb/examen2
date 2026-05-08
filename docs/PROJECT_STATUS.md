# Estado del Proyecto - El Examen II

**Fecha de ultima actualizacion:** 2026-05-08
**Rama activa:** `react-oficial`
**Historico:** `docs/OLD`

---

## Estado actual

**Nivel 1 activo: Almacen.** La app React ya apunta al primer escenario real. `sandbox` queda solo como fallback tecnico.

**Flujo actual de sesion:** el GM entra desde `access` con codigo unico (`delfin` por ahora), abre lobby, reparte codigos neutrales de jugador y puede iniciar partida con al menos 1 rol preparado.

### Que esta listo

- [x] Tablero unico por jugador, paneable y con escala fija sin zoom
- [x] Sistema de escenarios y variantes A/B/C/D
- [x] Escenario `almacen` con realidades A/B repartidas 2+2
- [x] Hotspots base del almacen: pizarra, taquillas, caja, balones, panel de salida
- [x] Contenido inicial por escenario en `src/data/scenarioContent.js`
- [x] Resolver inicial por escenario conectado a `gameRules.js`
- [x] Panel GM con asignacion de variantes por jugador
- [x] Acceso GM protegido por codigo local de sesion antes de abrir `?screen=gm`
- [x] Codigos neutrales de jugador generados por lobby (`jugador1`-`jugador4`), no ligados a rol hasta reclamarlo
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
- [x] Resonancia compartida centralizada en `gameState.sharedResonance`
- [x] Carga acumulada por hotspot/variante para desbloquear descubrimientos por pasos
- [x] UI de bateria/carga en chips y panel GM
- [x] Cola inferior centrada de hasta 8 chips con carga amarilla, animacion de pulso y resumen final por variante
- [x] Historial de tooltips de jugador con iconos de notificacion
- [x] Tooltips convertidos en overlays superiores no bloqueantes con confirmacion, autocierre y barra de progreso
- [x] Pantalla de jugador migrada a escena de mapa a pantalla completa, sin frame exterior visible
- [x] QR del terminal movil migrado a icono lateral dentro de la escena
- [x] Contador de resonancia reubicado junto a la onda de anomalia
- [x] Fusion de taquillas activada por jugadores desde movil; boton GM mantenido como debug
- [x] Apertura de taquilla fusionada exige usar la llave
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
- [ ] Mover el codigo GM (`delfin`) a variable de entorno/configuracion antes de una prueba publica
- [ ] Revisar seguridad real por rol si el proyecto sale de una prueba controlada; los codigos actuales son UX, no permisos fuertes
- [ ] Deuda tecnica: estudiar un modo de accesibilidad para ampliar el texto de las cajas sin reactivar zoom del escenario
- [ ] Deuda tecnica: separar entornos PRE y PROD con dos instancias de Firebase Realtime Database (requiere plan de pago en Firebase). La rama `react-oficial` apuntaria a PRE y `legacy` a PROD. Implica tambien configurar contextos de build en Netlify (`context.production` para `legacy` y `context.branch-deploy` para `react-oficial`) con variables `VITE_FIREBASE_*` distintas por entorno, y eliminar el fallback hardcodeado de URL en `src/services/firebaseClient.js`.
- [x] Migrar chat de jugador al interior de la escena de mapa
- [ ] Decidir si el log de debug vuelve solo como herramienta GM/dev o queda eliminado para jugadores
- [ ] Deuda tecnica: optimizar rendimiento web antes de escalar contenido y monitores GM
  - [x] Generar variantes WebP/AVIF responsive de los mapas `almacen_A/B` y conservar PNG como fallback
  - [x] Revisar polling de Firebase cada 1s para evitar leer `getRemoteState()` completo en la web de jugador; quedan monitores GM con lectura completa
  - [ ] Dividir el bundle inicial de Vite si el chunk principal sigue superando 500 kB minificado
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

## Checklist reciente - Acceso GM y codigos de sesion

- [x] Sustituir el boton directo "Entrar como Game Master" por formulario de codigo GM
- [x] Validar `delfin` como codigo GM temporal
- [x] Guardar autorizacion GM en `sessionStorage` con clave separada de jugadores
- [x] Bloquear acceso directo a `?screen=gm` si no existe codigo GM valido en sesion
- [x] Mantener acceso de jugadores con codigos numericos generados por el lobby
- [x] Documentar que el codigo GM no sustituye seguridad fuerte de Firebase

---

## Checklist reciente - Carga acumulada, resonancia y guias

- [x] Documentar `gameState.sharedResonance` como bolsa compartida de resonancia
- [x] Documentar `gameState.accumulatedCharge` como carga persistente por hotspot/variante
- [x] Mostrar carga en chips/cola para que GM y jugadores entiendan el peso de cada accion
- [x] Convertir excedente de carga en resonancia cuando el hotspot ya esta analizado
- [x] Mostrar contador de resonancia compartida en jugador
- [x] Guardar historial de tooltips por sesion/rol/escenario/variante
- [x] Mostrar cada guia como overlay superior bajo la onda de anomalia sin congelar interaccion
- [x] Encolar guias con al menos 3s de separacion entre una y otra
- [x] Autocerrar cada guia tras 10s con barra de progreso decreciente
- [x] Usar textos de confirmacion rotativos como `Vale, recibido`

---

## Checklist reciente - Objetivo taquilla

- [x] Aclarar en guia que la taquilla se abre con llave
- [x] Aclarar que antes de la llave hay que fusionar la taquilla
- [x] Activar fusion desde el movil al entrar en el puerto mecanico de taquillas con resonancia suficiente
- [x] Completar fusion con sincronizacion A/B de jugadores
- [x] Mantener boton GM solo como herramienta debug

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
- [ ] Evaluar code splitting/lazy loading para reducir el warning de Vite por chunk inicial mayor de 500 kB
- [ ] Medicion comparativa antes/despues con Chrome Task Manager: 1 jugador, 4 jugadores y GM con monitores

---

## Checklist reciente - HUD de escena y migracion a pantalla completa

- [x] Eliminar el frame exterior de la pantalla de jugador
- [x] Renderizar la escena de mapa a `100vw` x `100vh`
- [x] Quitar el panel lateral exterior del jugador
- [x] Quitar el chat exterior de jugador del render y de la lectura parcial de Firebase
- [x] Quitar el log flotante de debug del render de jugador
- [x] Mantener historial/tooltips/QR como herramientas dentro de la escena
- [x] Reducir iconos laterales de escena un 20%
- [x] Mostrar contador de resonancia a la derecha de la onda de anomalia
- [x] Definir e integrar el chat dentro de la escena
- [x] Sustituir cola lateral antigua por cola inferior unica de acciones
- [ ] Revisar posicion final del HUD superior con chat ya integrado
- [ ] Definir si el contador de resonancia necesita variante compacta en portatil

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
| `src/services/sessionAccess.js` | Codigos de sesion de jugadores y acceso local GM |
| `src/services/firebaseClient.js` | Lectura/escritura REST de Firebase |
| `src/components/SceneMap.jsx` | Tablero paneable con escala fija |
| `src/components/map/*` | Capas visuales e interactivas del mapa |
| `docs/game_design.md` | Diseno narrativo y mecanicas |
| `docs/architecture.md` | Referencia tecnica del sistema |
| `docs/gm-operations.md` | Reglas operativas del panel GM |
| `El Examen 2 Design System/` | Sistema de diseno activo |
