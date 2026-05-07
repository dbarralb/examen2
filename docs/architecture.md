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
| Deploy | SPA estatica en Netlify (`dist/`) |

El sistema antiguo `Instituto Newton Design System` esta archivado en `docs/OLD/design-systems` y no debe usarse para nuevas pantallas.

La guia de despliegue online esta en `docs/deployment.md`. Vite se usa para build, pero produccion sirve archivos estaticos y no depende de un servidor Vite.

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

## Acceso y sesion

La pantalla `access` es la entrada canonica.

- Jugadores: introducen un codigo numerico de 6 digitos generado por `Abrir lobby`. La app guarda el codigo en `sessionStorage` bajo `elExamen2.sessionCode`.
- GM: introduce un codigo manual unico (`delfin` temporalmente). La app guarda esa validacion en `sessionStorage` bajo `elExamen2.gmSessionCode`.
- Router: `src/App.jsx` redirige `?screen=gm` a `access` si no hay codigo GM valido en la sesion local.

`session.accessCode` sigue existiendo como codigo numerico GM interno de la partida. `session.playerCodes` contiene codigos neutrales de jugador; el rol real se decide despues en `lobby.roleClaims`.

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
2. Jugadores entran con codigos neutrales y reclaman rol.
3. La partida arranca automaticamente cuando los roles estan completos, o manualmente desde GM con al menos 1 jugador preparado.
4. Cada jugador ve su variante del almacen.
5. Jugador abre hotspot, arrastra `Accion_Inspeccion`, `Accion_Interaccion` o item y completa minijuego.
6. La accion entra en `queuedActions` con su carga.
7. Si el objetivo es fusionable, como `taquillas`, los jugadores pueden iniciar `fusionSession` desde el movil; el GM solo conserva boton debug.
8. GM inicia pulso para chips normales.
9. `pulseService` ejecuta acciones y llama a `resolveActionWithResult()`.
10. `gameRules` delega a `scenarioContent`.
11. `scenarioContent` aplica carga acumulada, resonancia compartida, flags, feedback y log.

Las guias de jugador se resuelven en `src/data/playerTooltips.js` y se presentan desde `PlayerScreen` con una cola local: cada guia se marca como vista al entrar en cola, se muestra como overlay superior no bloqueante durante 10s y deja al menos 3s antes de mostrar la siguiente.

## Eventos internos del pulso

La onda de anomalia temporal debe emitir eventos internos solo en transicion, nunca en cada tick/render. Esto deja preparado el contrato para sonido y otros efectos posteriores.

Flags/eventos reservados:

- `pulse.signal.stable.enter`: la senal entra en fase estable.
- `pulse.signal.unstable.enter`: la senal entra en fase inestable.
- `pulse.signal.critical.enter`: la senal entra en fase critica.
- `pulse.execution.start`: el pulso pasa a ejecucion.
- `pulse.action.start`: cambia la accion actual del pulso.
- `pulse.action.resolved`: aparece un resultado visible de accion.
- `pulse.action.resultHidden`: desaparece el resultado visible de accion.
- `pulse.execution.end`: el pulso termina y vuelve a idle con nuevo schedule.

Regla de implementacion: comparar el snapshot anterior y el actual de `pulseState`; disparar solo cuando cambia `phase`, `status`, `currentActionId` o la visibilidad de `currentActionResult`. La logica visual puede refrescar con frecuencia, pero los eventos internos deben ser discretos e idempotentes por transicion.

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
| `src/screens/AccessScreen.jsx` | Acceso de jugadores y formulario de codigo GM |
| `src/components/SceneMap.jsx` | Tablero paneable con escala fija |
| `src/components/map/*` | Capas del mapa y overlay de coordenadas |
| `src/components/DeviceConsole.jsx` | Consola generica de dispositivo |
| `src/services/pulseService.js` | Ciclo del pulso |
| `src/services/gameRules.js` | Alarma y dispatch de resolucion |
| `src/services/remoteState.js` | Estado inicial de Firebase |
| `src/services/sessionAccess.js` | Codigos locales de sesion, validacion GM y helpers de acceso |

## Archivado

Todo lo anterior que no forma parte de la app activa vive en `docs/OLD`.
