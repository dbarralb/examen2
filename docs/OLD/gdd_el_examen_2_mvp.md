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
- pull de acciones visible por rol con contador de usos,
- sistema de cola de acciones con staging, carga local y minijuego de confirmación,
- inventario de objeto (6 slots) e inventario de jugador (3 slots) con arrastre bidireccional,
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
    - abre cards de hotspot para explorar objetos y leer su inventario,
    - arrastra cartas e ítems al slot de acción de la card de objeto,
    - pulsa "Cargar software" para iniciar el minijuego de confirmación,
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

Los cuatro roles están diseñados para forzar cooperación y repartir funciones mentales distintas. Los jugadores ven el mismo escenario general, pero cada rol tiene un pull de cartas de acción propio, una identidad de personaje definida y un tipo de contribución diferenciado.

Ningún rol puede resolver la sala en solitario. Los puzles están diseñados para que la **combinación de acciones en el mismo pulso** produzca los mejores resultados.

---

### 5.1 El Empollón

**Objetivo:** Reducir la incertidumbre del grupo convirtiendo información confusa en información accionable.

**Identidad de personaje:** Alumno que entiende lo que otros ven pero no saben leer. Tiene referencias cruzadas mentales de los manuales técnicos que encontraría en cualquier laboratorio o cuarto de instalaciones. No actúa sobre el mundo físico, pero su análisis previo mejora drásticamente lo que hacen los demás.

**Función en partida:**
- Es el único rol que puede leer e interpretar documentos técnicos del escenario (manuales, esquemas, paneles de información).
- Sus acciones no cambian directamente el estado de un objeto, pero desbloquean acciones más eficaces de otros roles.
- Cuando analiza un sistema antes de que otro jugador lo manipule, el resultado de esa manipulación mejora o evita consecuencias negativas.
- Su valor no es visible inmediatamente: requiere que los compañeros confíen en su diagnóstico y coordinen sus acciones en el mismo pulso.

**Contribución cooperativa:** Actúa como intel del grupo. Si no actúa, los demás resuelven a ciegas.

**Cartas de acción:**
- `mirar_bien` — Analiza un objeto en profundidad. Revela su estado oculto, activa condiciones de preparación y reduce el riesgo de manipulación posterior.
- `consultar_apuntes` — Aplica conocimiento previo sobre un sistema. Equivale a "entender" un objeto sin haberlo tocado, con acceso a hints narrativos y técnicos.

**Límite de uso:** Cada carta puede usarse 3 veces. A la tercera queda inhabilitada. El Empollón tiene pocas cartas, pero son de alto valor por su efecto en cadena.

---

### 5.2 La Manitas

**Objetivo:** Habilitar el acceso físico a objetos y preparar condiciones para que otros actúen con seguridad.

**Identidad de personaje:** Alumna que trastea, desmonta, arregla y puentea. Tiene experiencia práctica con circuitos, cerraduras y sistemas mecánicos. No le da miedo romperse las uñas ni meter la mano donde no hay espacio. Su approch es metódico aunque parezca improvisado.

**Función en partida:**
- Es la especialista en objetos físicos que requieren manipulación técnica: cerraduras, cajas eléctricas, sistemas mecánicos.
- Sus acciones de preparación multiplican la eficacia de las acciones que van después, especialmente del Guaperas.
- Puede acceder a sistemas eléctricos y de seguridad que otros roles no pueden manipular sin consecuencias.
- Es la que mejor aprovecha los ítems usables del inventario combinados con sus cartas de acción.

**Contribución cooperativa:** El puente entre saber (Empollón) y hacer (Guaperas). Sin ella, muchas acciones físicas tienen consecuencias negativas.

**Cartas de acción:**
- `apanar` — Prepara un objeto para una acción posterior: afloja una cerradura, puentea un sistema, deja algo listo para forzar sin ruido.
- `puenteo_rapido` — Bypass directo de un sistema electrónico. Más rápido que entenderlo, pero arriesgado si el sistema no ha sido analizado antes.
- `desmontar` — Desmantela un elemento del escenario, inutilizándolo o accediendo a su interior.

**Límite de uso:** 3 usos por carta. Con 3 cartas, tiene el mayor pool de acciones físicas.

---

### 5.3 El Guaperas

**Objetivo:** Producir cambios físicos directos e inmediatos, aunque no siempre de forma controlada.

**Identidad de personaje:** Alumno impulsivo que confía más en su cuerpo que en su cabeza. No analiza: actúa. Su fuerza y seguridad en sí mismo le permiten mover, romper y empujar cosas que otros ni intentarían. El problema es que no distingue entre forzar bien y forzar a lo bruto.

**Función en partida:**
- Es el ejecutor final de las acciones físicas de alto impacto.
- Sus cartas producen cambios de estado inmediatos, pero la calidad del resultado depende de lo que haya hecho la Manitas antes (preparación).
- Sin preparación previa, sus acciones avanzan igual, pero con consecuencias narrativas negativas o pérdida de información.
- Es el rol que más presión ejerce sobre el equipo para coordinarse: su impulso natural es actuar ya, y eso a veces choca con los tiempos del Empollón y la Manitas.

**Contribución cooperativa:** Garantiza progreso incluso en situaciones trabadas. El coste de usarlo solo es la calidad del resultado, no el avance en sí.

**Cartas de acción:**
- `a_lo_bestia` — Fuerza un objeto o situación sin protocolo. Siempre produce resultado, a veces con daño colateral (alarma, nota rota, estado degradado).
- `empujar` — Aplica fuerza controlada sobre un objetivo específico. Si las condiciones previas están dadas (preparación, análisis), el resultado es limpio.

**Límite de uso:** 3 usos por carta. Con solo 2 cartas, su valor está en cuándo y con qué combinación las usa.

---

### 5.4 La Mística

**Objetivo:** Encontrar soluciones no convencionales y abrir rutas alternativas que los demás roles no contemplan.

**Identidad de personaje:** Alumna con una lógica propia que mezcla intuición, superstición y razonamiento lateral. No es irracional: es que su modelo del mundo incluye variables que los demás ignoran. Tono ligeramente Cthulhu humorístico: todo puede tener un patrón si sabes dónde mirar. Sus soluciones parecen absurdas hasta que funcionan.

**Función en partida:**
- Es el comodín del grupo: tiene acceso a resoluciones alternativas de casi cualquier objeto.
- Sus acciones no siguen la lógica técnica estándar, pero producen resultados válidos (a veces superiores) cuando se dan condiciones específicas.
- Algunas de sus cartas son las únicas que pueden interactuar con ciertos estados ocultos del escenario (patrones de sensor, propiedades no documentadas de objetos).
- Es especialmente útil cuando el grupo no tiene tiempo o usos disponibles para la ruta estándar.

**Contribución cooperativa:** Descubre caminos que el grupo no habría encontrado solo con lógica técnica. Su valor aumenta conforme avanza la partida y se agotan los usos de otros roles.

**Cartas de acción:**
- `y_si` — Pregunta "¿y si esto funciona así?" sobre un objeto. Puede producir resultados sorprendentes, a veces abriendo directamente contenedores o activando estados alternativos.
- `esto_vibra_raro` — Detecta anomalías de comportamiento en un sistema. Revela patrones o estados ocultos que otros análisis no capturan.
- `ritual_improvisado` — Aplica un procedimiento sin lógica aparente sobre un objeto. Puede crear condiciones especiales que facilitan acciones posteriores de cualquier rol.

**Límite de uso:** 3 usos por carta. Con 3 cartas y la mayor variedad de efectos alternativos, es el rol más impredecible y el más valioso en situaciones bloqueadas.

**Inestabilidad inherente (regla 14.19):** Ninguna acción de la Mística garantiza un resultado concreto. Sus cartas tienen variabilidad o condiciones ocultas que el jugador no controla del todo. Cuantas más veces se usen en la misma sala, más impredecibles e intensas serán sus consecuencias.

---

## 6. Sistema de acciones

### 6.1 Concepto
Los jugadores no ejecutan directamente acciones instantáneas. Arrastran una carta de acción (y opcionalmente un ítem usable) al slot de acción dentro de la card de un hotspot. La acción entra en un estado de staging donde el jugador la revisa y confirma. Al pulsar "Cargar software" se inicia un minijuego de confirmación. Superado el minijuego, la acción se encola en Firebase. Se resolverá cuando el GM lance el siguiente pulso de ejecución.

### 6.2 Flujo de una acción

**Staging (fase previa):**
1. El jugador abre la card de un hotspot.
2. Arrastra una carta de acción desde su pull al slot de acción (drop zone) de la card.
3. Opcionalmente arrastra un ítem usable desde su inventario personal al mismo slot.
4. El drop zone muestra el staging: carta seleccionada + ítem (si hay).
5. El jugador pulsa **"Cargar software"** para confirmar y comenzar la carga.
6. Puede pulsar **"Cancelar"** en cualquier momento para vaciar el staging.

**Carga y minijuego:**
7. Se inicia el minijuego de confirmación: una secuencia de 4 flechas direccionales que el jugador debe reproducir.
8. Si completa la secuencia correctamente, la acción se encola en Firebase como `queued`.
9. Si falla, puede reintentar o cancelar.
10. Durante la carga:
    - la acción es privada (otros jugadores no la ven),
    - el mismo jugador no puede cargar otra acción,
    - se puede cancelar en cualquier momento.
11. Si el objeto cambia de estado remoto mientras la acción está cargando, la acción se cancela automáticamente.
12. Se permite una sola acción pendiente/encolada por jugador.

### 6.3 Contador de usos por carta

Cada carta de acción tiene un **máximo de 3 usos** por jugador por partida.

- **0 usos:** tres pips vacíos `○○○`.
- **1 uso:** `●○○` — un pip blanco.
- **2 usos:** `●●○` — dos pips en ámbar (aviso: el próximo uso la inhabilita).
- **3 usos:** carta en blanco y negro, bloqueada. No se puede seleccionar ni arrastrar.

El contador se incrementa en Firebase al encolarse la acción con éxito. Se persiste entre reinicios de partida dentro de la misma sesión.

### 6.4 Lo que debe ver el equipo
Cada acción encolada muestra:
- jugador que la ha lanzado,
- carta de acción elegida,
- objetivo/objeto afectado,
- orden en la cola.

### 6.5 Ejecución (Pulsos)
- El GM gobierna los pulsos manualmente.
- `Comenzar pulso` inicia un aviso de 10 segundos.
- Al terminar el aviso, entran en el pulso las acciones con `loadedAt <= pulseStartAt`.
- Acciones cargadas después del corte esperan al siguiente pulso.
- Las acciones se ejecutan en orden de `loadedAt`.
- Cada acción tarda 3 segundos en ejecutarse.
- Los efectos y cambios de estado se aplican al final de esos 3 segundos.
- Después de cada acción ejecutada aparece un overlay de resultado durante 5 segundos en las pantallas de jugadores (no en la del GM).
- Durante el overlay de resultado nadie puede preparar nuevas acciones.

### 6.6 Cooperación dentro del pulso
`buildPulseFlags()` analiza todas las acciones del pulso antes de ejecutarlas, reduciendo la dependencia del orden exacto. Ejemplos:
- Puerta abre limpia si en el mismo pulso se resuelven panel, sensor y preparación de puerta.
- `y_si` sobre sensor se beneficia de un patrón detectado en el mismo pulso.
- Taquilla abre limpia si la preparación (`apanar`) entra en el mismo pulso que la fuerza (`a_lo_bestia`).
- `puenteo_rapido` sobre panel evita alerta si el panel se entiende en el mismo pulso.

### 6.7 Combos ítem + acción
Un ítem usable del inventario personal puede combinarse con una carta de acción arrastrando ambos al drop zone de un hotspot. Al pulsar "Cargar software" se genera una acción compuesta. El sistema de resolución evalúa la combinación en `resolveItemCombo()` antes de aplicar la lógica estándar.

Ejemplo: `empujar` + ganzúa sobre puerta → apertura silenciosa sin requisito de preparación previa de panel/sensor.

---

## 7. Sistema de inventario

### 7.1 Inventario de objeto (ObjectInventoryGrid)

Cada hotspot tiene hasta **6 slots de inventario** que se muestran en su card cuando está abierta. Los ítems están clasificados en dos tipos:

- **Readable:** documentos, notas, esquemas. Al hacer click se abre un modal con el contenido completo. Se marcan como "vistos" (globalmente, para todos los jugadores) al abrirlos.
- **Usable:** objetos físicos. Muestran un icono de mano. Se pueden arrastrar al inventario personal del jugador (3 slots en la barra inferior).

**Estados visuales de los slots:**

| Estado | Visual |
|---|---|
| Buscando (aún no revelado) | Barra de progreso circular SVG animada (10s por slot, stagger de 0.8s) |
| Revelado + tiene ítem | Contenido del ítem con animación de entrada |
| Revelado + vacío | Texto "Vacío" |
| Ítem recogido (usable) | Slot marcado como "Vacío" en tono depletado |
| Unseen (no visto aún) | Drop-shadow ámbar + punto indicador |

**Progresividad de la búsqueda:**
- Los slots se revelan secuencialmente con una animación de barra de progreso circular (10s por slot, 0.8s de stagger entre ellos).
- La búsqueda solo avanza mientras la card del hotspot está abierta. Si el jugador la cierra o cambia de punto de interés, los timers se cancelan.
- Los slots ya revelados no se vuelven a ocultar aunque se cierre y reabra la card.
- Cuando se reabre una card, los slots ya revelados aparecen directamente; los no revelados inician su timer de 10s desde cero.

### 7.2 Contenedores: estado abierto/cerrado

Los hotspots de clase **contenedor** (taquilla, cuadro eléctrico) tienen un subcomportamiento según su estado:

**Cerrado:**
- No se ejecuta la animación de búsqueda.
- Se muestra el número exacto de ítems que hay dentro como slots con "?" (el jugador sabe que hay algo, pero no qué).
- Los slots sobrantes aparecen vacíos.

**Abierto** (estado cambia via pulso):
- Se inicia la animación de búsqueda (barra de progreso, 10s por slot).
- Completada la búsqueda, se revela el contenido de cada slot.

### 7.3 Inventario personal del jugador (PlayerInventoryBar)

Barra de 3 slots centrada en la parte inferior de la pantalla, entre el pull de cartas y la cola de acciones. Los slots usan texturas del Design System.

- **Slots vacíos (inactivos):** textura base `Player_slots.png`.
- **Slots vacíos (arrastrando un usable):** textura activa `Player_slots_Active.png`.
- **Slot con ítem:** textura base + placeholder `Inventory_Slot_Object_usable_placeholder.png` superpuesto.

Los ítems del inventario personal pueden:
1. Hacerse click para ver su descripción (igual que desde la card de objeto).
2. Arrastrarse al drop zone de cualquier hotspot para combinarlos con una acción.

### 7.4 Estado en Firebase

```
itemSeenState: { "<itemId>": { seen: bool, pickedUp: bool } }
playerInventories: { "<roleId>": { slots: [{ itemId } | null, ...] } }
pendingItemUsage: { "<roleId>": { itemId, targetId, createdAt } | null }
cardUsage: { "<roleId>": { "<cardId>": number } }
```

---

## 8. UI general del jugador

### 8.1 Distribución base
La interfaz de jugador ocupa toda la pantalla (`100vw x 100vh`) y se organiza como un escenario paneable y zoomable con overlays:

1. **Escenario (SceneMap):** mapa del instituto con 3 capas:
   - **BackgroundLayer:** fondo compuesto por 6 tiles PNG (grid 3x2, 1826x1080 total).
   - **StructureLayer:** SVG inline con contornos de salas, paredes, puertas y pasadizos que reaccionan al estado del juego.
   - **InteractiveLayer:** hotspots clicables con iconos, marcas/trazos dinámicos y cards de objeto.
2. **Pull de cartas:** flotante abajo a la izquierda dentro del escenario, con las acciones del rol actual y sus contadores de uso.
3. **Inventario personal:** barra de 3 slots centrada en la parte inferior, con texturas del DS.
4. **Cola de acciones:** overlay visible a todos.
5. **Overlay de resultado de pulso:** aparece al finalizar cada acción ejecutada.

### 8.2 Interacción con el escenario
- Click en hotspot: abre una card de objeto junto al hotspot con nombre, clase (contenedor/puerta/sensor/información/genérico), estado, imagen, feedback, inventario de objeto (6 slots) y slot de acción.
- Solo puede haber una card de objeto abierta; click fuera cierra la selección.
- Click en hotspot hace foco y zoom relativo sobre la zona para mostrar hotspot + card.
- Pan con arrastre del ratón, zoom con rueda del ratón.
- Zoom mínimo: 1× (fit). Zoom máximo: 3×.

### 8.3 Card de objeto
Cada card de hotspot muestra:
1. Nombre del hotspot.
2. Clase del hotspot (etiqueta de tipo: contenedor, puerta, sensor, información, genérico).
3. Imagen de estado del objeto (varía con `gameState`).
4. Badge de estado actual.
5. Feedback de texto (actualizado por el sistema tras cada resolución).
6. **Inventario de objeto** — grid 6 slots con animación de búsqueda progresiva.
7. **Drop zone** — slot de acción con estados: staging, cargando (minijuego), resultado de pulso en espejo (solo monitor GM).

### 8.4 Elementos compartidos
- chat de texto,
- cola de acciones visible (overlay),
- feedback de ejecución (overlay de resultado),
- identificación visual del rol propio.

### 8.5 Marcas y trazos
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

## 10. Sala 1 — Despacho del Profesor (Protocolo ECO)

### 10.1 Intención de diseño
La Sala 1 introduce el bucle principal del juego: explorar, interpretar pistas, ejecutar una secuencia y entender que las acciones tienen consecuencias.

No se busca dificultad, sino aprendizaje. El objetivo oculto es que los jugadores entiendan que no están resolviendo un simple puzzle, sino siendo evaluados.

### 10.2 Contexto narrativo
Un grupo de alumnos se infiltra en el despacho de un profesor para robar un examen de ciencias que se encuentra dentro de una vitrina de cristal.

El examen está expuesto de forma sospechosa, lo que sugiere que alguien quiere que lo encuentren.

**Pregunta abierta que deja la sala:** ¿Por qué el examen estaba ahí?

### 10.3 Objetivo
Robar el examen sin levantar sospechas.

**Solución base:**
1. Encontrar la clave del sistema láser.
2. Desactivar el sistema.
3. Acceder a la vitrina.
4. Sustituir el examen por una copia.
5. Salir.

### 10.4 Zonas

| Zona | ID | Descripción |
|---|---|---|
| Entrada (ventana) | `window_entry` | Punto de acceso. Aporta contexto inicial y pistas de observación. |
| Puerta acorazada | `armored_door` | Salida. Objetivo de salida al resolver la sala. |
| Escritorio del profesor | `desk` | Contiene documentos, notas y pistas sobre la clave del sistema láser. |
| Vitrina con sistema láser | `showcase` | Contiene el examen. Bloqueada por sistema láser activo. |
| Cámara de vigilancia | `camera` | Sistema de vigilancia. Observable, engañable o bypasseable según acciones. |

Cada zona contiene hotspots que aportan información relevante o contextual.

### 10.5 Ítems del escenario

| Ítem | Hotspot | Tipo | Contenido |
|---|---|---|---|
| Cuaderno de notas | `desk` | readable | Contiene la clave del sistema láser parcialmente anotada. |
| Copia del examen | `desk` | usable | Fotocopia en blanco. Necesaria para sustituir el original. |
| Manual del sistema láser | `showcase` | readable | Protocolo de desactivación. Revela la secuencia correcta. |
| Examen original | `showcase` | usable | El objetivo real. Solo accesible tras desactivar el láser. |

### 10.6 Puzzle principal

**Qué bloquea:** el examen dentro de la vitrina, protegido por el sistema láser.

**Qué pregunta realmente:** ¿son capaces los jugadores de observar, conectar pistas y ejecutar un plan básico?

**El puzzle es autosuficiente.** Las habilidades de los personajes no son obligatorias: aceleran la resolución, permiten atajos y generan consecuencias si se abusan, pero ninguna acción de personaje es una dependencia necesaria para completar la sala.

### 10.7 Reglas MVP

**Escritorio:**
- `mirar_bien` o `consultar_apuntes` → revela la clave del sistema láser y la copia del examen.
- `y_si` → puede revelar directamente la clave por vía no convencional.
- `a_lo_bestia` → busca sin método; revela ítems pero suma `alarmState.noise`.

**Sistema láser (vitrina):**
- `puenteo_rapido` con clave conocida → desactiva el láser (`laser_disabled`).
- `puenteo_rapido` sin clave → intento fallido, escala `alarmState.level` a 2, añade trigger.
- `desmontar` → desactiva el láser (`laser_disabled`) pero suma `alarmState.noise`.
- `ritual_improvisado` → puede desactivar el láser por ruta alternativa, sin garantías.

**Vitrina (acceso al examen):**
- Solo accesible cuando `laser_disabled`.
- `empujar` o `apanar` con láser desactivado → acceso limpio (`showcase_open`).
- `a_lo_bestia` con láser desactivado → acceso (`showcase_open`), suma `alarmState.noise`.
- `a_lo_bestia` con láser activo → rompe vitrina (`showcase_broken`), escala `alarmState.level` a 3.

**Sustitución del examen:**
- Si el jugador tiene la copia (`copyInInventory`) y accede a la vitrina: puede sustituir (`replacedExam: true`).
- Si sale con el original sin sustituir: `replacedExam: false`; el sistema lo registra y puede tener consecuencias posteriores.

**Cámara de vigilancia:**
- `esto_vibra_raro` → detecta punto ciego o ciclo de la cámara.
- `y_si` con ciclo detectado → cámara engañada (`camera_fooled`).
- `ritual_improvisado` → puede crear distracción visual.
- `a_lo_bestia` → hace foto automática (consecuencia cómica, genera flag `photographed`).

**Puerta acorazada (salida):**
- `empujar` con misión completada → salida limpia.
- `a_lo_bestia` → salida forzada, suma `alarmState.noise`.

### 10.8 Estado de alarma y flags generados

**Estado de alarma (Firebase / `gameState.alarmState`):**
```javascript
alarmState: {
  level: 0,     // 0 normal · 1 sospecha · 2 alarma · 3 contención
  noise: 0,     // acumulador — cada acción impulsiva suma
  triggers: []  // registro de qué causó cada escalada
}
```

**Umbrales de escalada (`updateAlarmLevel`):**
```javascript
if (noise >= 4) return 3;  // contención
if (noise >= 2) return 2;  // alarma
if (noise >= 1) return 1;  // sospecha
return 0;                  // normal
```

**Efectos por nivel (`alarmEffects`):**

| Nivel | Nombre | Modificadores activos |
|---|---|---|
| 0 | Normal | — |
| 1 | Sospecha | `increaseFeedback`, `minorDelay` |
| 2 | Alarma | `lockRandomObject`, `increaseCameraSpeed`, `restrictRepeatActions` |
| 3 | Contención | `lockExitTemporarily`, `forceAlternateGoal`, `increaseSystemInterference` |

**Hook en resolución de acción:**
```
resolveAction → applyActionLogic → [si generatesNoise] applyNoiseToAlarm → updateAlarmLevel → applyAlarmEffects
```

Los modificadores son stubs hasta que se implemente el contenido de sala. Cada acción real declarará `generatesNoise: true` y `noiseValue` cuando corresponda.

| Nivel | Qué significa en partida |
|---|---|
| 0 | Sin incidencias. |
| 1 | Ruido detectado. El sistema observa. Consecuencia cómica leve. |
| 2 | Incidencia clara. Señal visible + frase del sistema. |
| 3 | Escalada máxima. Consecuencias diferidas garantizadas en sala siguiente. |

**Flags de comportamiento:**

| Flag | Qué registra |
|---|---|
| `resolvedByMainPath` | Siguieron la secuencia lógica base. |
| `usedForce` | Usaron fuerza en al menos un punto. |
| `usedBypass` | Puentearon sin comprender el sistema. |
| `failedAttempts` | Número de intentos fallidos registrados. |
| `replacedExam` | Sustituyeron el examen por la copia. |
| `photographed` | La cámara hizo una foto automática. |
| `camera_fooled` | La cámara fue engañada o neutralizada. |

### 10.9 Perfil del jugador

El sistema clasifica el comportamiento del grupo a partir de los flags:

| Perfil | Indicadores clave |
|---|---|
| **Analítico** | `resolvedByMainPath`, `alarmState.level <= 0`, `replacedExam: true`. |
| **Impulsivo** | Alto `usedForce`, `alarmState.noise` alto, `failedAttempts > 0`. |
| **Técnico** | `usedBypass`, acceso sin entender el sistema. |
| **Caótico** | `alarmState.level >= 2`, `showcaseBroken`, `replacedExam: false`. |

Los perfiles determinan la selección dinámica de salas siguientes, el ajuste de dificultad narrativa y los callbacks a decisiones previas.

### 10.10 Tipos de fallo (no bloqueantes)

La sala no tiene fracaso clásico. El jugador siempre puede completar el objetivo, pero de forma incorrecta. El sistema registra cómo lo ha hecho.

| Tipo | Conducta |
|---|---|
| **Impulsividad** | No leer pistas, probar acciones sin contexto. |
| **Fuerza bruta** | Romper la vitrina, ignorar sistemas. |
| **Bypass técnico** | Hackear sin comprender el mecanismo. |
| **Chapuza** | No sustituir el examen o sustituirlo incorrectamente. |

### 10.11 Narrativa del fallo

Al completar la sala, el sistema responde. El tono es frío, evaluador y levemente cómico.

**Base:**
> "Respuesta registrada."
> "Metodología… cuestionable."

**Variante cómica:**
> "Protocolo ECO: sujeto detectado como 'resolutivo creativo'."
> "Nivel de sutileza: preocupante."

**Variante incómoda:**
> "Solución obtenida sin proceso válido."
> "Evaluación incompleta."

El sistema nunca castiga directamente. Observa y etiqueta.

### 10.12 Consecuencias cómicas

El humor se usa como feedback del sistema:
- Alarma absurda (música ridícula en lugar de sirena).
- Cámara hace foto automática al recibir `a_lo_bestia` cerca.
- Mensajes pasivo-agresivos del sistema.
- Sustitución incorrecta del examen detectada más adelante en la narrativa.

El jugador se ríe, pero entiende que algo ha quedado registrado.

### 10.13 Estados de resolución (regla 14.16)

**Condición mínima (progress gate):**
- Examen robado. La sala puede completarse independientemente del método.

**Condición óptima (clean solve):**
- Examen sustituido por la copia + `alarmState.level === 0` + cámara no disparada.
- Sistema responde con evaluación positiva. Perfil tendiente a Analítico.

**Condiciones degradadas:**

| Variante | Estado de alarma | Consecuencia |
|---|---|---|
| Examen robado con sospecha | `alarmState.level === 1` | Consecuencia cómica leve. Leve presión en sala siguiente. |
| Examen robado con alarma | `alarmState.level === 2` | Señal visible + frase del sistema. Presión aumentada en sala siguiente. |
| Vitrina rota, sin sustitución | `alarmState.level === 3`, `replacedExam: false` | Perfil Caótico. Contención activa. Sala siguiente ajustada a tensión máxima. |
| Bypass sin comprensión | `usedBypass`, `alarmState.level <= 1` | Perfil Técnico. Evaluación futura limitada sin consecuencia inmediata. |
| Examen robado sin sustituir | `replacedExam: false`, cualquier nivel | Detectado en sala posterior. Mensaje pasivo-agresivo del sistema. |

---

## 11. Filosofía de resolución

Las reglas sistémicas completas de diseño están en la **sección 14**. Este apartado recoge los principios de aplicación específicos al contenido de partida.

### 11.1 El fallo no bloquea el progreso. El fallo define la experiencia.
Los puzles son autosuficientes y siempre progresables. La calidad del resultado, no el avance en sí, varía según el método. Ver regla 14.4.

### 11.2 Pérdidas prioritarias
La pérdida preferente es la **pérdida narrativa y de perfil**:
- información incompleta obtenida por no leer pistas,
- contexto oculto que no se descubre,
- perfil desfavorable que ajusta salas futuras,
- rutas opcionales no descubiertas.

Esto da valor al GM, a las salas ocultas y a la rejugabilidad. Ver reglas 14.3 y 14.8.

### 11.3 Tono del sistema evaluador
El sistema observa, etiqueta y responde. Nunca castiga directamente. El tono mezcla espías, comedia y frialdad institucional. Ver reglas 14.9 y 14.10.

> "Solución válida."
> "Proceso… discutible."

---

## 12. Panel GM

### 12.1 Layout
- **Monitores superiores:** 4 iframes con las pantallas de jugador en modo `?view=gm-monitor` (solo observación, `pointer-events: none`). Bajo cada monitor se muestra la última acción conocida del rol.
- **Panel Partida:** estado de sesión, código de acceso, timer de partida, botones `Abrir lobby` y `Resetear`.
- **Cola de acciones:** muestra acciones encoladas con estado `queued` / `executing`.
- **Historial:** últimas acciones resueltas, coloreadas por rol.
- **Herramientas debug temporales:**
  - `Forzar inicio` — arranca partida con al menos 1 jugador (sin esperar 4).
  - `Modo coordenadas` — mapa interactivo con overlay de coordenadas para diseño.

### 12.2 Principio clave
La interfaz y la mecánica deben explicar lo que ocurre. El GM lo refuerza, no lo sustituye.

---

## 13. Lobby visual

### 13.1 Flujo
1. Los jugadores entran al lobby tras validar el código de sesión.
2. Ven los 4 personajes con sus fichas: El Guaperas, El Empollón, La Mística, La Manitas.
3. Click en un personaje muestra su ficha (previsualización incluso si el rol ya está reservado).
4. `Continuar` con hold de 3 segundos intenta reservar el rol (claim atómico con `If-Match`).
5. Si hay conflicto, el jugador es notificado y puede elegir otro.
6. Cada jugador puede editar su nombre (por defecto `Jugador1`, `Jugador2`, etc.).
7. Cuando los 4 roles están confirmados, aparece un contador de 5 segundos.
8. Fade out y entrada al juego sin intervención del GM (auto-start).

### 13.2 Assets
- Personajes idle y selected: `assets/Lobby/Characters/*_Idle.png`, `*_Selected.png`.
- Selector: `assets/Lobby/Selector.png`.
- Paneles por rol: `assets/Lobby/UI/Lobby_panel_*.png`.
- Input de nombre: `assets/Lobby/UI/Lobby_inputNamecard.png`.
- Botones: `assets/Lobby/UI/Lobby_Button_Continue.png`, `Lobby_Button_Change.png`.

---

## 14. Reglas Sistémicas Reutilizables

Este apartado define las reglas aplicables a **todo el juego**, no solo a una sala concreta. Cualquier diseño de puzzle, zona o mecánica que entre en conflicto con estas reglas debe ser revisado antes de incorporarse.

### 14.1 Regla de Puzzle Autosuficiente

Todo puzzle debe poder resolverse **sin habilidades de personaje**.

Debe existir siempre:
- Un conjunto de pistas internas a la sala.
- Una lógica interpretable sin acción de personaje.
- Una acción final clara disponible para cualquier jugador.

Las habilidades de personaje **nunca son requisito obligatorio**.

### 14.2 Regla de Acciones como Modificadores

Las acciones de personaje siempre cumplen uno de estos roles:
- **Revelar** información oculta.
- **Acelerar** la resolución.
- **Permitir atajos** hacia la solución.
- **Resolver instantáneamente** (con coste en flags o consecuencias).
- **Generar consecuencias** si se usan sin contexto.

Nunca deben ser la **única vía de progreso**.

### 14.3 Regla de Doble Capa

Todo puzzle tiene dos capas:
- **Capa lógica:** la resolución base (qué hace el jugador).
- **Capa de comportamiento:** cómo lo resuelve.

El sistema evalúa la segunda, no solo la primera.

### 14.4 Regla de Fallo No Bloqueante

El fallo **nunca detiene el progreso**.

El fallo:
- Cambia el perfil del jugador.
- Activa consecuencias (inmediatas o diferidas).
- Modifica la experiencia en salas futuras.

### 14.5 Regla de Registro de Comportamiento

Cada acción relevante actualiza métricas globales:

| Métrica | Qué mide |
|---|---|
| `forceCount` | Uso de fuerza o impacto directo. |
| `analysisCount` | Lecturas, análisis, consultas. |
| `repairCount` | Reparaciones y preparaciones técnicas. |
| `intuitionCount` | Acciones de la Mística, rutas alternativas. |
| `failedAttempts` | Intentos fallidos acumulados. |
| `repeatedActions` | Acciones repetidas sobre el mismo target. |
| `alarmState.noise` | Ruido acumulado por acciones impulsivas. |
| `alarmState.level` | Nivel de escalada de alarma (0–3). |
| `alarmState.triggers` | Registro de causas de escalada. |
| `shortcutUsage` | Atajos usados sin comprender el sistema. |

Estas métricas alimentan el sistema de decisión de salas y el perfil del grupo.

### 14.6 Regla de Perfil Dinámico

El juego clasifica al grupo en tiempo real:

| Perfil | Indicadores principales |
|---|---|
| **Analítico** | Alto `analysisCount`, `alarmState.level === 0`, `resolvedByMainPath`. |
| **Impulsivo** | Alto `forceCount`, `alarmState.noise` alto, `failedAttempts > 0`. |
| **Técnico** | Alto `shortcutUsage`, `repairCount`, bypass sin comprensión. |
| **Caótico** | `alarmState.level >= 2`, `alarmState.noise` alto, `replacedExam: false`. |

El perfil **no es fijo**. Evoluciona con cada sala.

### 14.7 Regla de Selección de Experiencia

Las salas futuras no son fijas. Se seleccionan según el comportamiento acumulado:
- Uso alto de fuerza → sala de tensión física.
- Uso alto de deducción → puzzle cruzado entre zonas.
- Comportamiento mixto → sala híbrida.

### 14.8 Regla de Consecuencia Diferida

Las consecuencias **no siempre son inmediatas**.

Ejemplos:
- Sustituir mal el examen → detectado en una sala posterior.
- Generar ruido → incrementa presión o dificultad más adelante.
- Bypass sin comprensión → limita evaluación futura o cierra rutas narrativas.

### 14.9 Regla de Humor Funcional

El humor no es decorativo. Debe:
- Comunicar el estado del sistema al jugador.
- Reforzar consecuencias sin eliminar la tensión.
- Aliviar sin borrar la incomodidad de haber fallado.

Formato:
> "Mensaje serio + giro incómodo."

### 14.10 Regla de Feedback del Sistema

El sistema **nunca explica completamente**. Debe:
- Observar.
- Etiquetar.
- Sugerir.
- Nunca confirmar del todo.

Esto mantiene la ambigüedad evaluadora y la sensación de ser observado.

### 14.11 Regla de Diseño de Zonas

Cada sala debe tener entre **5 y 6 zonas**.

Cada zona debe:
- Contener al menos un hotspot.
- Aportar una pista, contexto o distracción.
- Tener sentido espacial y narrativo dentro de la sala.

### 14.12 Regla de Conexión de Pistas

Las pistas **nunca deben ser aisladas**. Siempre deben:
- Cruzarse entre zonas de la misma sala.
- Confirmarse entre sí (dos fuentes, misma conclusión).
- Permitir deducción sin que una sola pista sea suficiente por sí sola.

### 14.13 Regla de Evaluación Invisible

El jugador **no ve números ni stats**.

Pero el sistema siempre está evaluando:
- Cómo juega.
- Qué prioriza.
- Qué ignora.

### 14.14 Regla de Intención Oculta

Cada sala tiene una **pregunta real** distinta a la visible.

Ejemplo:
- **Visible:** robar el examen.
- **Real:** ¿siguen instrucciones o piensan por su cuenta?

Esta pregunta real no se comunica explícitamente al jugador. Solo se revela a través de las respuestas del sistema.

### 14.15 Regla de Coherencia de Mundo

Aunque el tono sea cómico:
- El sistema debe parecer consistente internamente.
- Las reglas deben mantenerse en todas las salas.
- Las consecuencias deben sentirse lógicas dentro del mundo del juego.

### 14.16 Regla de Legibilidad

Cada consecuencia debe comunicarse mediante tres canales simultáneos:

- **Señal visual o sonora:** algo perceptible e inmediato (alarma, flash, música ridícula, foto de cámara, texto parpadeante).
- **Frase del sistema:** un mensaje del evaluador que etiqueta lo ocurrido sin explicarlo del todo.
- **Cambio perceptible en el entorno:** el estado visible del hotspot, zona o sala cambia de forma que el jugador nota que algo es distinto.

El jugador no ve números ni stats. Pero **siempre entiende que algo ha cambiado**.

Esta regla se aplica a toda consecuencia, tanto positiva como negativa, tanto inmediata como diferida.

### 14.17 Regla de Foco de Sala

Cada sala debe tener exactamente:

- **1 sistema principal:** el bloqueo central que define el puzzle. Todo gira en torno a él.
- **1 sistema secundario:** una complicación adicional que añade tensión o rutas alternativas, pero no es el objetivo.
- **El resto:** contexto, soporte o distracción. Aportan pistas o atmósfera, pero no son sistemas con reglas propias.

Ejemplo en Sala 1:
- **Principal:** sistema láser de la vitrina.
- **Secundario:** cámara de vigilancia.
- **Contexto/soporte:** escritorio, entrada (ventana), puerta acorazada.

Si una sala acumula más de un sistema principal, se divide en dos salas o se reclasifica uno como secundario.

### 14.19 Regla de Inestabilidad de la Mística

Las acciones de la Mística nunca deben ser 100% fiables:

- **Variabilidad:** el resultado varía según condiciones ocultas del estado de la sala, no solo de la acción en sí. El jugador no puede predecir exactamente qué ocurrirá.
- **Condiciones ocultas:** algunas cartas solo producen ciertos resultados si el entorno cumple requisitos no documentados. Descubrirlos es parte del juego.
- **Escalada por abuso:** cuantas más acciones de la Mística se usen en la misma sala, mayores y más impredecibles serán las consecuencias. El valor de la Mística está en la precisión, no en la cantidad.

Esta regla se aplica al diseño de cada carta de la Mística en cualquier sala. Si una acción de la Mística produce siempre el mismo resultado sin condiciones, incumple esta regla.

### 14.20 Regla de Estado de Puzzle

Todo puzzle debe definir explícitamente tres niveles de resolución:

- **Condición mínima (progress gate):** lo que permite avanzar. Siempre alcanzable.
- **Condición óptima (clean solve):** la resolución completa y sin consecuencias negativas.
- **Condiciones degradadas:** variantes en que se avanza pero con pérdida narrativa, perfil afectado o consecuencias diferidas.

Ejemplo para Sala 1:
- **Mínimo:** examen robado.
- **Óptimo:** examen sustituido + sin alarma.
- **Degradado:** examen robado con alarma activa, o sin sustituir la copia.

Estas tres condiciones deben estar definidas antes de implementar cualquier puzzle. Si un puzzle solo tiene una condición de resolución, no cumple esta regla.

---

## 15. Sistema de capas del mapa

### 15.1 Arquitectura
El escenario usa 3 capas apiladas dentro de `.scene-map-world`, todas comparten pan/zoom:

1. **BackgroundLayer** — Grid 3x2 de tiles PNG (609x540px cada uno, 1826x1080 total). Fallback a imagen temporal si no hay tiles.
2. **StructureLayer** — SVG inline (`viewBox="0 0 100 100"`) con contornos de salas, paredes, puertas y pasadizos. Cada elemento tiene estado reactivo al `gameState`.
3. **InteractiveLayer** — Hotspots clicables, marcas/trazos dinámicos y cards de objeto.

### 15.2 Datos
- Definidos en `src/data/mapData.js`: `backgroundTiles`, `rooms`, `structures`, `markDefinitions`.
- Los elementos estructurales usan `visibleWhen(gameState)` para pasadizos secretos.
- Las marcas usan `visibleWhen(gameState)` y animaciones CSS.

---

## 16. Requisitos funcionales MVP

### 16.1 Jugadores
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
- Hotspots interactivos con cards de objeto y clase visual.
- Inventario de objeto con animación de búsqueda progresiva (10s/slot).
- Comportamiento diferenciado para contenedores abiertos/cerrados.
- Drag de ítems usables desde hotspot a inventario personal.
- Inventario personal de 3 slots con texturas del DS.
- Drag de ítems desde inventario personal al drop zone de acción.
- Staging del drop zone con carta + ítem antes de confirmar.
- Pull de acciones por rol con contador de usos visual (pips).
- Minijuego de confirmación de acción.
- Envío y recepción de mensajes en chat.
- Overlay de resultado de pulso.

### 16.2 GM
- Acceso a la web de GM.
- Generación de código de 6 dígitos.
- Monitores de observación de las 4 pantallas de jugador.
- Última acción conocida por rol.
- Control de pulsos manuales.
- Reseteo de partida.
- Envío de mensajes al chat.
- Herramientas debug: forzar inicio y modo coordenadas.

### 16.3 Sistema
- Firebase Realtime Database como backend.
- Polling cada 1 segundo como único mecanismo de sincronización.
- Gestión de sesión con estados `role_select` / `in_game`.
- Claims atómicos con ETag / `If-Match`.
- Cola compartida de acciones con escritura por `queuedActions/<id>`.
- Resolución de acciones con `buildPulseFlags` para cooperación intra-pulso.
- Resolución de combos ítem+acción mediante `resolveItemCombo`.
- Consecuencias narrativas post-acción.
- Evaluación de resultado de salida.
- Persistencia de contadores de uso de cartas por rol en sesión.

---

## 17. Alcance del MVP

### Dentro de alcance
- 1 partida de 4 jugadores + 1 GM,
- lobby visual funcional con claim atómico,
- selección de rol con previsualización,
- transición de inicio con cuenta atrás,
- chat de texto,
- escenario paneable/zoomable con 3 capas,
- 6 hotspots interactivos con clase visual,
- inventario de objeto (6 slots, búsqueda progresiva, tipo readable/usable),
- contenedores con estado abierto/cerrado y slots "?",
- inventario personal de jugador (3 slots, texturas DS),
- drag bidireccional de ítems (hotspot ↔ inventario personal ↔ drop zone),
- staging de drop zone con "Cargar software",
- combos ítem+acción en el pulso,
- pull de acciones por rol (10 cartas total),
- contador de usos por carta (3 usos, inhabilitación B&N),
- cola de acciones con minijuego de confirmación,
- pulsos manuales del GM,
- reglas MVP de Sala 1 implementadas,
- flags de comportamiento (resolvedByMainPath, usedForce, usedBypass, noise, etc.),
- narrativa del fallo con respuesta del sistema evaluador,
- perfil del jugador generado al completar la sala,
- consecuencias cómicas y pasivo-agresivas del sistema,
- monitores GM con observación en tiempo real,
- 1 sala prototipo (Despacho del Profesor).

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
- minijuegos adicionales integrados en el flujo de partida.

---

## 18. Preguntas abiertas para siguiente iteración

1. Qué cartas adicionales necesita cada rol y cómo se balancean con el límite de 3 usos.
2. Cómo se estructura la navegación entre salas cuando haya más de una.
3. Qué forma toma el dispositivo individual de cada rol.
4. Cómo se integran minijuegos adicionales (hexer, puzzle de ondas) en el flujo de acciones.
5. Cuándo retirar el botón `Forzar inicio` y sustituirlo por un modo simulación separado.
6. Cómo se gestionan los pasadizos secretos y habitaciones ocultas a nivel de datos y navegación.
7. Qué criterios determinan el resultado final de la partida: ¿puntuación, perfil acumulado, evaluación narrativa?
8. Si el límite de usos de carta debe resetearse entre salas o mantenerse a lo largo de toda la partida.
9. Cómo se representa visualmente la pérdida narrativa (información incompleta, mensajes pasivo-agresivos del sistema) en la UI del jugador.
10. Cuándo y cómo el sistema revela al jugador que ha sido evaluado: ¿al final de la sala, al final de la sesión, o de forma progresiva?
11. Cómo se diseña la Sala 2 en función del perfil generado en Sala 1 (selección dinámica vs. sala fija con dificultad adaptada).

---

## 19. Objetivo inmediato de producción

Construir un prototipo navegable que permita validar tres cosas:

1. si el flujo de entrada a partida funciona bien,  
2. si la cooperación se entiende desde la UI,  
3. si el sistema de cola de acciones evita que los jugadores se pierdan lo que hacen sus compañeros.
