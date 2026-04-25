# GDD — El Examen 2 (MVP)

## 1. Visión general

**Título del proyecto:** El Examen 2  
**Formato:** Aventura gráfica cooperativa + escape room digital con GM en vivo  
**Plataforma:** Web  
**Jugadores:** 4 jugadores + 1 GM  

### Premisa
Cuatro alumnos de instituto han robado un examen de ciencias un sábado por la mañana. Justo después, el sistema de seguridad del instituto se activa y los encierra dentro. Lo que parece un castigo por haber entrado donde no debían termina revelándose como una prueba secreta organizada por un grupo de escapistas profesionales. El examen era un cebo para encontrar a los elegidos.

### Fantasía de jugador
- Sentirse dentro de una aventura gráfica cooperativa en tiempo real.
- Resolver enigmas en grupo sin que nadie se pierda lo que ha ocurrido.
- Vivir una experiencia parecida a un escape room físico, pero digital y guiada por un GM.
- Tomar decisiones que afectan a cómo se descubre la historia, no solo a si se avanza o no.

### Pilares del proyecto
1. **Cooperación visible:** todo el mundo debe saber qué hacen sus compañeros.
2. **Narrativa con consecuencias:** la forma de resolver importa, sobre todo a nivel narrativo.
3. **Acciones en cola:** los jugadores encolan intenciones y el sistema las ejecuta en momentos concretos.
4. **GM en vivo:** acompaña, da inmersión y regula el ritmo sin resolver los puzles.
5. **Aventura gráfica primero:** la base es exploración, observación, deducción y conversación.

---

## 2. Objetivo del MVP

Construir un prototipo funcional de una sesión jugable con:
- acceso por navegador,
- entrada a partida mediante código de 6 dígitos generado por el GM,
- lobby visual compartido para 4 jugadores con personajes seleccionables,
- selección de rol con claim atómico,
- transición de inicio con cuenta atrás y fade,
- una interfaz individual por rol con escenario paneable y zoomable,
- chat de texto entre jugadores y GM,
- escenario visible con hotspots interactivos,
- pull de acciones visible por rol,
- sistema de cola de acciones con carga local y minijuego de confirmación,
- panel GM con monitores de jugadores, control de pulsos y herramientas de sesión.

El MVP no necesita todavía todo el contenido narrativo final ni todas las cartas cerradas, pero sí debe validar el bucle principal de experiencia.

---

## 3. Flujo de usuario

### 3.1 Flujo del jugador
1. El jugador entra en la web React (`react.html?screen=access`).
2. Introduce el código de partida de 6 dígitos.
3. El sistema valida ese código contra la sesión activa en Firebase.
4. Si la validación es correcta, entra al lobby visual compartido (`?screen=lobby`).
5. En el lobby ve a los personajes de los 4 roles con sus fichas y nombres editables.
6. Hace click en un personaje para previsualizar su ficha.
7. Pulsa `Continuar` con un hold de 3 segundos para reservar el rol (claim atómico con `If-Match`).
8. Si otro jugador reservó el mismo rol antes, se notifica el conflicto.
9. Espera a que los 4 roles estén confirmados.
10. Cuando todos han elegido, aparece una cuenta atrás de 5 segundos.
11. Se produce un fade out y el jugador entra a la interfaz de juego (`?screen=player&role=...`).
12. Durante la partida:
    - ve el escenario paneable y zoomable,
    - ve su pull de cartas de acción flotante,
    - usa el chat,
    - arrastra cartas a hotspots para encolar acciones,
    - completa un minijuego de confirmación (secuencia de flechas) para cada acción,
    - ve el resultado de cada pulso como overlay.

### 3.2 Flujo del GM
1. El GM accede a su interfaz (`react.html?screen=gm`).
2. Pulsa `Abrir lobby` para generar un código de partida de 6 dígitos y abrir la sesión.
3. El código se guarda en `localStorage` para persistencia.
4. Espera a que entren los 4 jugadores en el lobby.
5. Ve el estado de cada rol (conectado / sin jugador) en los monitores superiores.
6. Opcionalmente, usa `Forzar inicio` (herramienta debug temporal) para arrancar con menos de 4 jugadores.
7. Cuando la partida arranca:
   - observa las 4 pantallas de jugador en monitores iframe de solo lectura (`?view=gm-monitor`),
   - ve la última acción conocida de cada rol bajo su monitor,
   - gestiona la cola de acciones encoladas,
   - lanza pulsos manuales con `Comenzar pulso`,
   - ve el historial de acciones resueltas,
   - puede enviar mensajes al chat,
   - puede resetear la partida devolviendo a todos al lobby.
8. Herramienta debug: `Modo coordenadas` muestra un mapa interactivo con coordenadas porcentuales y en píxeles al mover el ratón, para facilitar el posicionamiento de elementos de diseño.

---

## 4. Estructura de sesión

### 4.1 Requisitos de sala
- 1 partida activa vinculada a un código de 6 dígitos.
- 4 plazas de jugador.
- 1 plaza de GM.
- Cada rol solo puede ser elegido por un jugador (claim atómico con ETag / `If-Match`).

### 4.2 Estados de sesión
- **`role_select`** — lobby abierto, jugadores eligen rol.
- **`in_game`** — partida en curso.
- Regla: mientras la partida esté en `role_select`, los jugadores son redirigidos a selección de rol en cada tick de polling.
- Resetear partida devuelve a `role_select`, limpia estado y redirige a todos con fade.

### 4.3 Sincronización
- Firebase Realtime Database como backend.
- Polling cada 1 segundo con `cache: "no-store"` como único mecanismo de sincronización.
- EventSource (SSE) descartado: cada conexión SSE ocupa un slot HTTP persistente y Firefox limita a ~6 conexiones por dominio, bloqueando el polling con 5 pestañas abiertas.
- Las escrituras locales invalidan `lastRemoteSnapshot` para que el siguiente tick de polling detecte el cambio.

---

## 5. Roles

Los cuatro roles están diseñados para forzar cooperación y repartir funciones mentales distintas. Los jugadores ven el mismo escenario general, pero cada rol tiene un pull de cartas de acción propio.

### 5.1 El Empollón
**Función principal:** interpretar sistemas y reducir incertidumbre.  
**Identidad:** alumno que entiende lo que otros ven pero no saben leer. Recurre a apuntes, manuales e instrucciones.  
**Valor en partida:** convierte información confusa en información útil.  
**Principio clave:** no bloquea el avance, pero mejora la calidad de la resolución.  
**Cartas:** `mirar_bien`, `consultar_apuntes`.

### 5.2 La Manitas
**Función principal:** manipular sistemas físicos y preparar objetos.  
**Identidad:** alumna que trastea, desmonta, arregla y puentea.  
**Valor en partida:** habilita interacciones seguras y accesos técnicos.  
**Cartas:** `apanar`, `puenteo_rapido`, `desmontar`.

### 5.3 El Guaperas
**Función principal:** ejecutar cambios físicos de forma directa.  
**Identidad:** alumno impulsivo que fuerza, empuja o rompe.  
**Valor en partida:** asegura progreso aunque con riesgo de consecuencias.  
**Cartas:** `a_lo_bestia`, `empujar`.

### 5.4 La Mística
**Función principal:** reinterpretar objetos desde una lógica absurda pero útil.  
**Identidad:** alumna con aura medio ritualista, medio cómica, que encuentra usos inesperados en las cosas. Tono ligeramente Cthulhu humorístico.  
**Valor en partida:** abre caminos alternativos y soluciones no evidentes.  
**Cartas:** `y_si`, `esto_vibra_raro`, `ritual_improvisado`.

---

## 6. Sistema de acciones

### 6.1 Concepto
Los jugadores no ejecutan directamente acciones instantáneas. Arrastran una carta de acción desde su pull al hotspot de un objeto en el escenario. La acción pasa por una fase de carga local privada y un minijuego de confirmación antes de encolarse. Se resolverá cuando el GM lance el siguiente pulso de ejecución.

### 6.2 Flujo de una acción
1. El jugador arrastra una carta al slot de acción dentro de la ventana de un hotspot.
2. Se inicia un minijuego de confirmación: una secuencia de 4 flechas direccionales que el jugador debe reproducir.
3. Si completa la secuencia correctamente, la acción se encola en Firebase como `queued`.
4. Si falla, puede reintentar o cancelar.
5. Durante la carga local:
   - la acción es privada (otros jugadores no la ven),
   - el mismo jugador no puede cargar otra acción,
   - se puede cancelar en cualquier momento.
6. Si el objeto cambia de estado remoto mientras la acción está cargando, la acción se cancela automáticamente.
7. Se permite una sola acción pendiente/encolada por jugador.

### 6.3 Lo que debe ver el equipo
Cada acción encolada muestra:
- jugador que la ha lanzado,
- carta de acción elegida,
- objetivo/objeto afectado,
- orden en la cola.

### 6.4 Ejecución (Pulsos)
- El GM gobierna los pulsos manualmente.
- `Comenzar pulso` inicia un aviso de 10 segundos.
- Al terminar el aviso, entran en el pulso las acciones con `loadedAt <= pulseStartAt`.
- Acciones cargadas después del corte esperan al siguiente pulso.
- Las acciones se ejecutan en orden de `loadedAt`.
- Cada acción tarda 3 segundos en ejecutarse.
- Los efectos y cambios de estado se aplican al final de esos 3 segundos.
- Después de cada acción ejecutada aparece un overlay de resultado durante 5 segundos en las pantallas de jugadores (no en la del GM).
- Durante el overlay de resultado nadie puede preparar nuevas acciones.
- `Auto pulso` existe como control GM pero está deshabilitado; el flujo manual es el principal.

### 6.5 Cooperación dentro del pulso
`buildPulseFlags()` analiza todas las acciones del pulso antes de ejecutarlas, reduciendo la dependencia del orden exacto. Ejemplos:
- Puerta abre limpia si en el mismo pulso se resuelven panel, sensor y preparación de puerta.
- `y_si` sobre sensor se beneficia de un patrón detectado en el mismo pulso.
- Taquilla abre limpia si la preparación (`apanar`) entra en el mismo pulso que la fuerza (`a_lo_bestia`).
- `puenteo_rapido` sobre panel evita alerta si el panel se entiende en el mismo pulso.

---

## 7. Filosofía de resolución

### 7.1 Siempre progresable
Los puzles no deben bloquearse por una única solución correcta. Si un jugador usa la fuerza, debe poder producirse avance.

### 7.2 Calidad de resolución
La diferencia entre resolver "bien" o "mal" no debe ser bloquear el juego, sino afectar a:
- claridad de la información conseguida,
- cantidad de historia descubierta,
- acceso a habitaciones o eventos ocultos,
- tono y consecuencias de la escena.

### 7.3 Pérdidas prioritarias
La pérdida preferente para este proyecto es la **pérdida narrativa**:
- notas rotas,
- mensajes incompletos,
- contexto oculto,
- rutas opcionales no descubiertas.

Esto da valor al GM, a las habitaciones ocultas y a la rejugabilidad.

---

## 8. UI general del jugador

### 8.1 Distribución base
La interfaz de jugador ocupa toda la pantalla (`100vw x 100vh`) y se organiza como un escenario paneable y zoomable con overlays:

1. **Escenario (SceneMap):** mapa del instituto con 3 capas:
   - **BackgroundLayer:** fondo compuesto por 6 tiles PNG (grid 3x2, 1826x1080 total).
   - **StructureLayer:** SVG inline con contornos de salas, paredes, puertas y pasadizos que reaccionan al estado del juego.
   - **InteractiveLayer:** hotspots clicables con iconos, marcas/trazos dinámicos y cards de objeto.
2. **Pull de cartas:** flotante abajo a la izquierda dentro del escenario, con las acciones del rol actual.
3. **Dispositivo del jugador:** pendiente de implementación por rol.

### 8.2 Interacción con el escenario
- Click en hotspot: abre una card de objeto junto al hotspot con nombre, estado, imagen, feedback y slot de acción para drag and drop.
- Solo puede haber una card de objeto abierta; click fuera cierra la selección.
- Click en hotspot hace foco y zoom relativo sobre la zona para mostrar hotspot + card.
- Pan con arrastre del ratón, zoom con rueda del ratón.

### 8.3 Elementos compartidos
- chat de texto,
- cola de acciones visible (overlay),
- feedback de ejecución (overlay de resultado),
- identificación visual del rol propio.

### 8.4 Marcas y trazos
Indicadores visuales dinámicos que aparecen en la capa interactiva conforme los jugadores descubren información:
- Tipos: `discovery`, `danger`, `clue`, `progress`.
- Cada marca tiene una condición `visibleWhen(gameState)`.
- Animaciones opcionales: `pulse`, `glow`.

---

## 9. Chat

### 9.1 Participantes
- Los 4 jugadores pueden enviar mensajes.
- El GM también puede enviar mensajes.

### 9.2 Función
- comunicación estratégica,
- inmersión,
- guía diegética o semidiegética del GM,
- refuerzo narrativo.

### 9.3 MVP
El chat del MVP es exclusivamente de texto. El historial colorea mensajes por rol.

---

## 10. Escenario MVP: Gimnasio

### 10.1 Propósito
El gimnasio es la primera sala para validar el sistema de juego.

### 10.2 Objetivo del puzle
Abrir la salida de emergencia sin activar la respuesta más agresiva del sistema.

### 10.3 Elementos de la sala (hotspots)
- **Puerta de emergencia** (`door`): objetivo principal. Puede abrirse limpia, forzada o con alarma según las condiciones.
- **Panel digital** (`panel`): sistema de bloqueo digital. Puede ser entendido (Empollón) o bypasseado (Manitas). Bypass sin entender primero activa alerta.
- **Sensor ambiental** (`sensor`): detecta anomalías. Puede ser desmontado (Manitas), engañado (Mística si detecta patrón antes) o desactivado.
- **Taquillas** (`locker`): contienen una nota con lore. Se pueden abrir limpiamente (Manitas prepara + Guaperas abre, o Mística directamente) o reventar (nota rota, lore parcial).
- **Cuadro eléctrico** (`electrical_box`): sin reglas MVP cerradas todavía.
- **Material deportivo** (`sports_gear`): sin reglas MVP cerradas todavía.

### 10.4 Reglas MVP implementadas

**Panel:**
- `mirar_bien` o `consultar_apuntes` → panel entendido (`understood`), se revela hint.
- `puenteo_rapido` → bypass (`tampered`). Si el panel no se entendió antes en el mismo pulso, activa alerta secundaria.

**Sensor:**
- `esto_vibra_raro` o `ritual_improvisado` → patrón detectado.
- `y_si` con patrón detectado → sensor engañado (`fooled`).
- `desmontar` → sensor desactivado (`disabled`).

**Taquillas:**
- `apanar` → cerradura preparada.
- `a_lo_bestia` con preparación → apertura limpia, nota completa.
- `a_lo_bestia` sin preparación → taquilla reventada, nota rota (lore parcial).
- `y_si` → apertura limpia directa, nota completa.

**Puerta:**
- `mirar_bien` → puerta preparada (detecta cómo empujar sin forzar).
- `empujar` con panel resuelto + sensor resuelto + puerta preparada → apertura limpia.
- `empujar` con sensor resuelto pero sin todo → apertura forzada sin alarma.
- `empujar` sin condiciones → apertura forzada + alarma.
- `a_lo_bestia` → puerta reventada. Alarma si sensor o panel siguen activos.

**Consecuencias narrativas:**
- Nota completa → revela que la prueba evalúa cómo colaboran los jugadores.
- Nota parcial → solo un fragmento legible: "...no todos... elegidos..."
- Salida limpia + nota completa → se desbloquea pista oculta hacia la verdadera prueba (`hiddenRouteFlag`).

### 10.5 Resultados posibles
- **Resolución óptima:** salida limpia + nota completa + pista oculta desbloqueada.
- **Resolución parcial:** se avanza pero con pérdida narrativa (nota rota, sin pista oculta).
- **Resolución caótica:** puerta forzada con alarma, consecuencias negativas.

---

## 11. Panel GM

### 11.1 Layout
- **Monitores superiores:** 4 iframes con las pantallas de jugador en modo `?view=gm-monitor` (solo observación, `pointer-events: none`). Bajo cada monitor se muestra la última acción conocida del rol.
- **Panel Partida:** estado de sesión, código de acceso, timer de partida, botones `Abrir lobby` y `Resetear`.
- **Cola de acciones:** muestra acciones encoladas con estado `queued` / `executing`.
- **Historial:** últimas acciones resueltas, coloreadas por rol.
- **Herramientas debug temporales:**
  - `Forzar inicio` — arranca partida con al menos 1 jugador (sin esperar 4).
  - `Modo coordenadas` — mapa interactivo con overlay de coordenadas para diseño.

### 11.2 Principio clave
La interfaz y la mecánica deben explicar lo que ocurre. El GM lo refuerza, no lo sustituye.

---

## 12. Lobby visual

### 12.1 Flujo
1. Los jugadores entran al lobby tras validar el código de sesión.
2. Ven los 4 personajes con sus fichas: El Guaperas, El Empollón, La Mística, La Manitas.
3. Click en un personaje muestra su ficha (previsualización incluso si el rol ya está reservado).
4. `Continuar` con hold de 3 segundos intenta reservar el rol (claim atómico con `If-Match`).
5. Si hay conflicto, el jugador es notificado y puede elegir otro.
6. Cada jugador puede editar su nombre (por defecto `Jugador1`, `Jugador2`, etc.).
7. Cuando los 4 roles están confirmados, aparece un contador de 5 segundos.
8. Fade out y entrada al juego sin intervención del GM (auto-start).

### 12.2 Assets
- Personajes idle y selected: `assets/Lobby/Characters/*_Idle.png`, `*_Selected.png`.
- Selector: `assets/Lobby/Selector.png`.
- Paneles por rol: `assets/Lobby/UI/Lobby_panel_*.png`.
- Input de nombre: `assets/Lobby/UI/Lobby_inputNamecard.png`.
- Botones: `assets/Lobby/UI/Lobby_Button_Continue.png`, `Lobby_Button_Change.png`.

---

## 13. Sistema de capas del mapa

### 13.1 Arquitectura
El escenario usa 3 capas apiladas dentro de `.scene-map-world`, todas comparten pan/zoom:

1. **BackgroundLayer** — Grid 3x2 de tiles PNG (609x540px cada uno, 1826x1080 total). Fallback a imagen temporal si no hay tiles.
2. **StructureLayer** — SVG inline (`viewBox="0 0 100 100"`) con contornos de salas, paredes, puertas y pasadizos. Cada elemento tiene estado reactivo al `gameState`.
3. **InteractiveLayer** — Hotspots clicables, marcas/trazos dinámicos y cards de objeto.

### 13.2 Datos
- Definidos en `src/data/mapData.js`: `backgroundTiles`, `rooms`, `structures`, `markDefinitions`.
- Los elementos estructurales usan `visibleWhen(gameState)` para pasadizos secretos.
- Las marcas usan `visibleWhen(gameState)` y animaciones CSS.

---

## 14. Requisitos funcionales MVP

### Jugadores
- Acceso a la web de jugador.
- Introducción de código de partida.
- Validación de sesión activa.
- Entrada al lobby visual.
- Previsualización de fichas de personaje.
- Selección de rol con claim atómico.
- Edición de nombre de jugador.
- Espera con estado visual de jugadores conectados.
- Cuenta atrás automática al completar grupo.
- Entrada al juego con fade.
- Visualización de escenario paneable/zoomable.
- Hotspots interactivos con cards de objeto.
- Visualización del pull de acciones por rol.
- Drag and drop de cartas a hotspots.
- Minijuego de confirmación de acción.
- Envío y recepción de mensajes en chat.
- Overlay de resultado de pulso.

### GM
- Acceso a la web de GM.
- Generación de código de 6 dígitos.
- Monitores de observación de las 4 pantallas de jugador.
- Última acción conocida por rol.
- Control de pulsos manuales.
- Reseteo de partida.
- Envío de mensajes al chat.
- Herramientas debug: forzar inicio y modo coordenadas.

### Sistema
- Firebase Realtime Database como backend.
- Polling cada 1 segundo como único mecanismo de sincronización.
- Gestión de sesión con estados `role_select` / `in_game`.
- Claims atómicos con ETag / `If-Match`.
- Cola compartida de acciones con escritura por `queuedActions/<id>`.
- Resolución de acciones con `buildPulseFlags` para cooperación intra-pulso.
- Consecuencias narrativas post-acción.
- Evaluación de resultado de salida.

---

## 15. Alcance del MVP

### Dentro de alcance
- 1 partida de 4 jugadores + 1 GM,
- lobby visual funcional con claim atómico,
- selección de rol con previsualización,
- transición de inicio con cuenta atrás,
- chat de texto,
- escenario paneable/zoomable con 3 capas,
- 6 hotspots interactivos,
- pull de acciones por rol (10 cartas total),
- cola de acciones con minijuego de confirmación,
- pulsos manuales del GM,
- reglas MVP del gimnasio implementadas,
- consecuencias narrativas (nota, pista oculta),
- monitores GM con observación en tiempo real,
- 1 sala prototipo (gimnasio).

### Fuera de alcance por ahora
- sistema completo de cartas balanceadas,
- múltiples salas,
- sistema final de habitaciones ocultas,
- dispositivos completos por rol,
- cinemáticas reales,
- arte final,
- sistema avanzado de puntuación o evaluación,
- persistencia compleja entre sesiones,
- auto pulso,
- minijuegos integrados en el flujo de partida.

---

## 16. Preguntas abiertas para siguiente iteración

1. Qué cartas adicionales necesita cada rol y cómo se balancean.
2. Cómo se estructura la navegación entre salas cuando haya más de una.
3. Qué forma toma el dispositivo individual de cada rol.
4. Qué reglas completas necesitan cuadro eléctrico y material deportivo.
5. Cómo se integran los minijuegos (hexer, puzzle de ondas) en el flujo de acciones.
6. Cuándo retirar el botón `Forzar inicio` y sustituirlo por un modo simulación separado.
7. Cómo se gestionan los pasadizos secretos y habitaciones ocultas a nivel de datos y navegación.
8. Qué criterios determinan el resultado final de la partida (puntuación, evaluación narrativa).

---

## 17. Objetivo inmediato de producción

Construir un prototipo navegable que permita validar tres cosas:

1. si el flujo de entrada a partida funciona bien,  
2. si la cooperación se entiende desde la UI,  
3. si el sistema de cola de acciones evita que los jugadores se pierdan lo que hacen sus compañeros.
