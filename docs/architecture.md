# Arquitectura tecnica - El Examen II

> Estado: React oficial con Nivel 1 (`almacen`) como escenario activo.

## Stack

| Capa | Tecnologia |
|---|---|
| UI | React (Vite) |
| Sistema de diseno | `El Examen 2 Design System` |
| Estado compartido | Firebase Realtime Database |
| Sincronizacion | Polling 1s |
| Routing | URL search params (`?screen=player&role=empollon`) |

El sistema antiguo `Instituto Newton Design System` esta archivado en `docs/OLD/design-systems` y no debe usarse para nuevas pantallas.

## Escenarios y contenido

`src/data/scenarioData.js` define escenarios y fondos por variante.

`src/data/scenarioContent.js` define el contenido jugable:

- hotspots por escenario/variante
- items por contenedor
- feedback inicial por hotspot
- configuracion de consola de dispositivo
- resolver inicial de acciones del escenario

`src/services/gameRules.js` mantiene la alarma y delega la resolucion narrativa a `resolveScenarioAction()`.

`src/data/actionTypes.js` define los dos tipos atomicos de accion del MVP: `Accion_Inspeccion` y `Accion_Interaccion`. Las cartas siguen siendo especificas por rol para conservar ilustraciones y usos independientes, pero el resolver del puzzle trabaja con el tipo atomico de accion.

El panel GM puede ajustar hotspots por escenario y variante. Esos overrides se guardan en `/hotspotOverrides` con clave `scenario_variant` y `SceneMap` los aplica tambien en la vista de jugador.

## Estado inicial

`src/services/remoteState.js` inicializa Firebase con:

- `sessionState.scenarioId = "almacen"`
- `playerBoards.empollon.variant = "A"`
- `playerBoards.guaperas.variant = "A"`
- `playerBoards.manitas.variant = "B"`
- `playerBoards.mistica.variant = "B"`

## Firebase

Las reglas viven en `database.rules.json`. El procedimiento de configuracion y despliegue esta en `docs/firebase-security.md`.

```
/session           estado de sesion, codigos y timer
/sessionState      escenario activo y escenarios completados
/gameState         alarma, flags, descubrimientos y efectos GM
/pulseState        estado del pulso actual
/targetFeedback    feedback por hotspot
/lobby             jugadores conectados y roleClaims
/queuedActions     acciones esperando pulso
/actionLog         historial de acciones
/chatMessages      chat
/playerViews       espejo de camara/seleccion para monitores GM
/playerBoards      escenario y variante por rol
/hotspotOverrides  posicion/tamano de hotspots editados por GM
/playerInventories inventario por rol
/itemSeenState     items vistos/recogidos
/cardUsage         usos de cartas por rol
/pendingItemUsage  item usado durante un pulso
```

## Flujo de turno

1. GM abre lobby.
2. Jugadores reclaman rol.
3. La partida arranca automaticamente cuando los roles estan completos, o manualmente desde GM con al menos 1 jugador preparado.
4. Cada jugador ve su variante del almacen.
5. Jugador abre hotspot, arrastra `Accion_Inspeccion`, `Accion_Interaccion` o item y completa minijuego.
6. La accion entra en `queuedActions`.
7. GM inicia pulso.
8. `pulseService` ejecuta acciones y llama a `resolveActionWithResult()`.
9. `gameRules` delega a `scenarioContent`.
10. Firebase recibe flags, feedback y log.

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/App.jsx` | Router por query params |
| `src/data/scenarioData.js` | Escenarios y fondos |
| `src/data/actionTypes.js` | Tipos atomicos de accion |
| `src/data/scenarioContent.js` | Contenido jugable por escenario |
| `src/data/gameData.js` | Cartas, familias y accessors globales |
| `src/data/roles.js` | Roles activos |
| `src/screens/PlayerScreen.jsx` | Pantalla del jugador |
| `src/screens/GMScreen.jsx` | Panel GM |
| `src/components/SceneMap.jsx` | Tablero paneable con escala fija |
| `src/components/map/*` | Capas del mapa y overlay de coordenadas |
| `src/components/DeviceConsole.jsx` | Consola generica de dispositivo |
| `src/services/pulseService.js` | Ciclo del pulso |
| `src/services/gameRules.js` | Alarma y dispatch de resolucion |
| `src/services/remoteState.js` | Estado inicial de Firebase |

## Archivado

Todo lo anterior que no forma parte de la app activa vive en `docs/OLD`.
