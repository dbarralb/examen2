# Arquitectura técnica — El Examen II

> Estado: **Blank slate** — sistemas listos, contenido narrativo pendiente.

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React (Vite) |
| Estado compartido | Firebase Realtime Database |
| Sincronización | Polling 1s (clientes) |
| Routing | URL search params (`?screen=player&role=empollon`) |

---

## Sistemas principales

### 1. Jugadores y roles

4 roles fijos. Cada jugador conecta con su código único y entra como uno de los roles.

| Rol | Archivo | Cartas |
|---|---|---|
| El Empollón | `src/data/roles.js` | mirar_bien, consultar_apuntes |
| La Manitas | `src/data/roles.js` | apanar, puenteo_rapido, desmontar |
| El Guaperas | `src/data/roles.js` | a_lo_bestia, empujar |
| La Mística | `src/data/roles.js` | y_si, esto_vibra_raro, ritual_improvisado |

Cartas definidas en `src/data/gameData.js` → `cards[]`.

---

### 2. Tablero individual por jugador

Cada jugador tiene **un tablero único**:
- Paneable (drag) y zoomeable (rueda)
- Fondo de imagen distinto según escenario + variante
- 3 hotspots interactivos: `hotspot_1`, `hotspot_2`, `hotspot_3`
- La lógica de hotspots es **blank** hasta que se defina el contenido del escenario

Componentes:
- `src/screens/PlayerScreen.jsx` — pantalla principal del jugador
- `src/components/SceneMap.jsx` — canvas paneable/zoomeable
- `src/data/gameData.js` → `boardHotspots[]`

---

### 3. Escenarios y variantes

Un **escenario** es el entorno narrativo (e.g., "Almacén").
Una **variante** (A, B, C, D) es una realidad paralela del mismo escenario.

El GM asigna qué variante ve cada jugador desde su panel.
Dos jugadores pueden estar en el "mismo lugar" pero en realidades distintas.

```
Escenario: Almacén
  ├── Variante A → jugadores: Empollón, Guaperas
  ├── Variante B → jugadores: Manitas, Mística
  ├── Variante C → (sin asignar)
  └── Variante D → (sin asignar)
```

Definición: `src/data/scenarioData.js`
Estado por jugador: `playerBoards[roleId].variant`, `playerBoards[roleId].scenarioId`

---

### 4. Hotspots y familias

Cada hotspot tiene una **familia** que define su categoría semántica:

| Familia | Uso típico |
|---|---|
| `acceso` | Puertas, entradas, salidas |
| `contenedor` | Cajas, taquillas, mochilas |
| `dispositivo` | Terminales, paneles, consolas |
| `informacion` | Notas, carteles, documentos |
| `objeto` | Elementos físicos sueltos |
| `sensor` | Cámaras, detectores |

Definición: `src/data/gameData.js` → `hotspotFamilies`, `boardHotspots[]`

---

### 5. Inventario

Cada jugador tiene:
- **Barra de inventario**: 3 slots activos siempre visibles
- **Grid de objetos del hotspot**: revelados al buscar en un contenedor
- Los items se definen por escenario (actualmente vacíos)

Componentes: `PlayerInventoryBar`, `ObjectInventoryGrid`
Estado: `playerInventories[roleId].slots[]` en Firebase

---

### 6. Minijuegos

Las acciones del jugador requieren completar un minijuego de carga antes de entrar en la cola.
El minijuego actual: `SoftwareLoadMinigame` (secuencia de direcciones con tiempo límite).

Flujo:
```
Jugador arrastra carta → hotspot (target)
→ SoftwareLoadMinigame se lanza en cliente
→ Al completar: acción entra en queuedActions (Firebase)
→ Esperando pulso del GM
```

---

### 7. Sistema de pulso

El **pulso** es la ventana de ejecución controlada por el GM.

Estados del pulso:
```
idle → charging (10s) → executing → idle
```

Durante `executing`:
1. Recoge todas las acciones con `status: "queued"`
2. Ejecuta cada una secuencialmente (3s/acción)
3. Llama a `resolveActionWithResult()` por cada acción
4. Muestra resultado en overlay (5s)
5. Limpia acciones resueltas

Archivo: `src/services/pulseService.js`

**Arquitectura futura del pulso**: El pulso pasará a ser una ventana de tiempo donde los jugadores pueden ver los tableros de otros jugadores. Implementación pendiente.

---

### 8. Sistema de alarma

Alarma compartida (afecta a todos los jugadores simultáneamente):

| Nivel | Estado | Efecto |
|---|---|---|
| 0 | Normal | Sin restricciones |
| 1 | Sospecha | Feedback aumentado, ligero retraso |
| 2 | Alarma | Objetos bloqueados, cámara activa |
| 3 | Contención | Salida bloqueada, interferencia |

El nivel se calcula automáticamente por ruido acumulado.
El GM activa efectos visuales manualmente desde el panel (no son automáticos).

Archivos: `src/services/gameRules.js`, `src/services/gmSceneControl.js`

---

### 9. Panel GM

El GM controla:
- Apertura de lobby y generación de códigos
- Asignación de variantes por jugador (A/B/C/D)
- Inicio del pulso
- Efectos visuales de escena
- Vista de monitores de todos los jugadores (iframe)

Archivo: `src/screens/GMScreen.jsx`

---

## Estructura de Firebase

```
/session          — estado de sesión (status, códigos, timer)
/gameState        — alarma, flags, descubrimientos, efectos GM
/pulseState       — estado del pulso actual
/targetFeedback   — texto de feedback por hotspot
/lobby            — jugadores conectados, roleClaims
/queuedActions    — acciones encoladas esperando pulso
/actionLog        — historial de acciones (array)
/chatMessages     — mensajes de chat entre jugadores y GM
/playerViews      — vista del jugador (cámara, selección) para monitores GM
/playerBoards     — tablero de cada jugador: variante, estado de hotspots
/playerInventories — inventario por rol
/playerZones      — posición de zona por jugador (legacy, pendiente de limpieza)
/itemSeenState    — qué items ha visto/recogido cada sesión
/cardUsage        — usos de cartas por rol
/pendingItemUsage — item en uso durante un pulso
/sessionState     — escenario activo
```

---

## Flujo de un turno completo

```
1. GM asigna variantes (A/B/C/D) a cada jugador
2. Jugadores ven su tablero con fondo de la variante
3. Jugador hace clic en hotspot → ve tarjeta del elemento
4. Jugador arrastra carta de acción sobre el hotspot
5. Minijuego de carga se ejecuta en cliente
6. Al completar: acción → queuedActions (Firebase, status: "queued")
7. GM inicia pulso manual
8. pulseService ejecuta acciones → resolveActionWithResult()
9. Resultado en overlay (5s por acción)
10. gameState mutado según lógica del escenario
11. Jugadores ven cambios en sus tableros
12. Vuelta al paso 3
```

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/data/gameData.js` | Hotspots, cartas, familias, utilidades |
| `src/data/scenarioData.js` | Escenarios y variantes |
| `src/data/roles.js` | Definición de roles |
| `src/data/mapData.js` | Capas visuales del tablero (tiles, marks) |
| `src/services/gameRules.js` | Alarma + resolver de acciones (genérico) |
| `src/services/pulseService.js` | Ciclo completo del pulso |
| `src/services/gmSceneControl.js` | Efectos visuales GM |
| `src/services/remoteState.js` | Estado inicial de Firebase |
| `src/screens/PlayerScreen.jsx` | Pantalla completa del jugador |
| `src/screens/GMScreen.jsx` | Panel del GM |
| `src/components/SceneMap.jsx` | Canvas paneable/zoomeable |
| `src/components/SoftwareLoadMinigame.jsx` | Minijuego de carga de acción |
