# El Examen 2 - Estado del prototipo

## Plan activo - Nuevo panel de lobby tipo expediente

- [x] Descartar la arquitectura por secciones/rasgos del panel anterior.
- [x] Colocar imagen fija real en `assets/Lobby/UI/Lobby_panel_empollon.png`.
- [x] Sustituir el panel azul actual de `LobbyStage.jsx` por un panel basado en imagen fija.
- [x] Mantener el input de nombre como elemento funcional superpuesto bajo la imagen.
- [x] Ajustar responsive desktop/tablet/movil sin romper la posicion de personajes.
- [x] Verificar con `npm.cmd run build`.
- [x] Revisar visualmente antes de hacer commit.

## Cambios cerrados - Lobby React

- El lobby usa paneles fijos por rol desde `assets/Lobby/UI`.
- `LobbyRolePanel.jsx` conserva solo la imagen del panel, el input de nombre y el estado de seleccion.
- El input de nombre queda superpuesto sobre `Lobby_inputNamecard.png` y mantiene la funcionalidad editable.
- El boton `Continuar` / `Cambiar rol` vive bajo la ficha de rol y el input de nombre, con imagen dedicada para cada estado.
- `Continuar` se confirma con hold de 3 segundos: inicia reserva en Firebase al pulsar, muestra relleno/brillo progresivo y libera el intento si se suelta antes.
- El logo Newton queda reducido y anclado al extremo derecho del footer para equilibrar visualmente el panel izquierdo.
- El rol antes llamado `bruto` pasa a llamarse `guaperas` en textos y codigo React, con alias legacy para datos/rutas antiguas.
- La seleccion visual de personaje es inmediata y la previsualizacion se sincroniza con Firebase en segundo plano cada 2 segundos como maximo.
- El selector sigue al personaje clicado tambien despues de confirmar rol, permitiendo consultar otras fichas.
- Los personajes del lobby tienen escala y alineacion inferior ajustadas para escritorio/tablet.
- Los textos de debug del lobby se muestran en la zona superior derecha sobre el fondo azul.

## Deudas tecnicas

- Reemplazar `assets/Lobby/UI/Lobby_panel_guaperas.png` por una version final exportada desde diseno. La actual puede generarse o sobrescribirse desde el asset oficial del rol.
- Revisar si los assets `Lobby_Button_*`, `Lobby_Waiting_Icon.png` y `assets/Lobby/UI/Orlas/` se integran en el flujo real o quedan como material descartable.

## Estado actual

- `index.html` es la seleccion de rol.
- `waiting.html` es la pantalla intermedia narrativa para jugadores que eligen rol antes de que el GM inicie la partida.
- `game-empollon.html`, `game-manitas.html`, `game-bruto.html` y `game-mistica.html` son pantallas de jugador.
- `gm.html` es el panel del Game Master.
- Las pantallas de jugador usan el escenario como pantalla completa (`100vw x 100vh`).
- El flujo de jugador ya no usa boton de encolar como interaccion principal: las cartas se arrastran a la ventana del objeto.
- El GM no tiene escenario propio: ve cuatro monitores superiores con las webs de jugador en modo `?view=gm-monitor`.
- Los monitores del GM estan bloqueados con `pointer-events: none`; son solo observacion.
- En los monitores GM se ve escenario, hotspots y acciones del jugador. Se ocultan chat, historial, cola, dispositivo, seleccion y popovers.
- Debajo de cada monitor GM se muestra la ultima accion conocida de ese rol.
- El GM conserva paneles externos de cola, controles de partida, historial, chat, estado global y organigrama.
- El panel GM muestra estado de partida: `sin comenzar` o `partida en curso`.

## Sincronizacion

- Firebase Realtime Database:
  `https://project-butterfly-d0242-default-rtdb.firebaseio.com/`
- Se sincronizan:
  - estado del escenario,
  - feedback de objetos,
  - cola de acciones,
  - estado de pulso,
  - ultimas acciones por rol,
  - historial,
  - chat,
  - estado de sesion.
- El selector de rol manda a `waiting.html?role=...`; esa pantalla consulta `session.status` y entra al rol cuando pasa a `in_game`.
- La sincronización usa exclusivamente polling cada segundo con `cache: "no-store"`.
- EventSource (SSE) está desactivado: cada conexión SSE ocupa un slot HTTP persistente y Firefox limita a ~6 conexiones por dominio, lo que bloqueaba el polling con 5 pestañas abiertas.
- El polling es el único mecanismo autoritativo de sincronización. Las escrituras locales (`firebasePatch`/`firebasePut`) invalidan `lastRemoteSnapshot` para que el siguiente tick de polling detecte el cambio.

## Flujo de acciones

- El jugador abre la ventana de un objeto haciendo click en su hotspot.
- Arrastra una carta al slot de accion dentro de esa ventana.
- La accion entra en carga local durante 5 segundos.
- Durante la carga local:
  - puede cancelarse,
  - otros jugadores no la ven,
  - el mismo jugador no puede cargar otra accion.
- Al terminar la carga, la accion se escribe en Firebase como `queued`.
- Por ahora se permite una accion pendiente/encolada por jugador.
- Si el objeto cambia mientras una accion local esta cargando sobre ese objeto:
  - la accion local se cancela,
  - el slot muestra estado de objeto actualizado.

## Pulsos

- El GM gobierna los pulsos.
- El GM inicia partida desde el panel `Partida`; esto pone `session.status = in_game` y arranca el temporizador sincronizado.
- Resetear partida pone `session.status = role_select`, limpia estado y devuelve a jugadores reales a seleccion con fade.
- Regla: mientras la partida esté en estado `sin comenzar` (`role_select`), los jugadores son redirigidos a selección de rol en cada tick de polling, sin excepción.
- `Comenzar pulso` inicia un aviso de pulso de 10 segundos.
- Al terminar el aviso, entran en el pulso las acciones con `loadedAt <= pulseStartAt`.
- Acciones cargadas despues del corte esperan al siguiente pulso.
- Las acciones se ejecutan en orden de `loadedAt`.
- Cada accion tarda 3 segundos en ejecutarse.
- Los efectos de reglas y cambios de assets se aplican al final de esos 3 segundos.
- Despues de cada accion ejecutada aparece un overlay centrado de resultado durante 5 segundos en las pantallas de jugadores.
- El overlay de resultado no aparece en el GM.
- Durante el overlay de resultado nadie puede preparar nuevas acciones.
- La interferencia previa al pulso fue retirada porque estaba generando problemas en la ejecucion.
- `Auto pulso` existe como control GM, pero el modo manual sigue siendo el flujo principal de prueba.

## Reglas y cooperacion

- `buildPulseFlags()` reduce la dependencia del orden exacto dentro del pulso.
- Ejemplos ya contemplados:
  - puerta limpia si en el mismo pulso se resuelven panel, sensor y preparacion de puerta,
  - `y_si -> sensor` puede beneficiarse de patron detectado en el mismo pulso,
  - taquilla puede abrir limpia si la preparacion entra en el mismo pulso,
  - `puenteo_rapido -> panel` puede evitar alerta si el panel se entiende en el mismo pulso.
- Las acciones sin regla caen en feedback debug tipo:
  `No hay regla MVP para empujar sobre material deportivo.`

## Layout de jugador

- La escena ocupa todo el ancho y alto visible.
- Los elementos de jugador viven como overlays dentro de `#scene`:
  - hotspots/objetos clicables,
  - historial,
  - chat,
  - cola de acciones,
  - pull de acciones,
  - dispositivo de rol.
- Los objetos del escenario se representan como 6 hotspots cuadrados visibles:
  - puerta,
  - panel,
  - sensor,
  - taquilla,
  - cuadro electrico,
  - material deportivo.
- Al hacer hover sobre un hotspot se muestra el nombre del objeto.
- Al hacer click sobre un hotspot se abre una tarjeta junto al hotspot con:
  - nombre,
  - estado,
  - feedback/debug,
  - imagen del estado si existe asset,
  - slot de accion para drag and drop.
- El historial colorea mensajes relacionados con jugadores usando los mismos colores del chat.
- Los cambios de pantalla usan fade in/out para evitar saltos bruscos.

## Pantalla de espera

- `waiting.html` muestra un mensaje narrativo de conexion con el Instituto Newton.
- Recibe el rol por querystring (`?role=empollon`, `?role=manitas`, etc.).
- Mientras `session.status !== in_game`, mantiene al jugador esperando.
- Cuando el GM inicia partida, redirige al `game-*.html` correspondiente con fade.
- Si Firebase no responde, muestra mensaje de reintento.

## Layout GM

- La parte superior contiene cuatro monitores horizontales:
  - El Empollón,
  - La Manitas,
  - El guaperas,
  - La Mística.
- Cada monitor carga la pantalla del jugador correspondiente con `?view=gm-monitor`.
- Bajo cada monitor se muestra la ultima accion conocida de ese rol.
- En el panel `Partida` se muestran estado de partida y temporizador.
- El panel de cola muestra estado `queued` / `executing` y barra de ejecucion.
- El historial usa color por rol.
- Hay una seccion desplegable con el organigrama de la partida.
- El codigo original del organigrama esta guardado en:
  `organigrama_gm_gimnasio_react.jsx`.

## Assets

- Cartas de accion:
  `assets/actions/`
- Objetos del escenario:
  `assets/objects/`
- El overlay de alarma usa:
  `assets/objects/alarm_active_overlay.png`
- Puerta todavia puede funcionar con fallback visual si faltan assets de estado.
- Deuda tecnica: generar un cambio de asset especifico para el panel digital, para que no se confunda visualmente con el cuadro electrico ni con overlays globales de alarma.

## Archivos principales

- `app.js`: logica de render, estado, reglas MVP, drag/drop, pulsos y sincronizacion Firebase.
- `styles.css`: layout, monitores GM, overlays, slots, estados visuales y responsive.
- `gm.html`: panel del GM, monitores, controles, organigrama, cola, historial y chat.
- `waiting.html`: pantalla narrativa intermedia antes de entrar a rol.
- `game-*.html`: pantallas de jugador full-scene.
- `organigrama_gm_gimnasio_react.jsx`: fuente React del organigrama de partida.

## Migracion React + Instituto Newton Design System

### Decision de arquitectura

- La migracion React existe en paralelo al prototipo legacy.
- El prototipo legacy sigue siendo el flujo jugable completo:
  - `index.html`,
  - `roles.html`,
  - `waiting.html`,
  - `gm.html`,
  - `game-*.html`,
  - `app.js`,
  - `styles.css`.
- La app React nueva entra por:
  `react.html?screen=...`
- No se deben sustituir todavia `gm.html` ni `game-*.html` por React porque la pantalla de jugador React aun no es equivalente al legacy completo.
- Vite se usa como build/dev server de React:
  - `npm.cmd run dev`
  - `npm.cmd run build`
- Si se usa Live Server sin Vite, hay que servir `dist/react` despues de ejecutar `npm.cmd run build`.

### Design system

- Se ha anadido `Instituto Newton Design System/`.
- Tokens principales:
  - navy `#013E70`,
  - sky blue `#0276D6`,
  - cream `#E2D6AF`,
  - gold `#F5B800`,
  - League Spartan.
- Logo oficial para pantallas React:
  `assets/Logo/Newton_Logo_final.png`
- Fuente local usada por React:
  `Instituto Newton Design System/fonts/LeagueSpartan-VariableFont_wght.ttf`

### Estado React actual

- Fase A completada: base React/Vite creada.
- Fase B completada: acceso, roles y espera React conectados a Firebase.
- Fase C completada para flujo manual: GM React funcional con sesion y pulso manual portado.
- Fase D completada en primer corte: Player React ya permite preparar, cargar y encolar acciones.
- Fase D actualizada: se elimina el iframe React del mapa para evitar dependencia de una ruta viva; el escenario vuelve a usar una imagen estatica desde `assets/maps/instituto_newton_plano.png`.
- Fase D actualizada: las cartas de accion del jugador flotan dentro del frame del escenario, ancladas abajo a la izquierda, manteniendo click y drag/drop.
- Fase D2 completada en primer corte: lobby visual React para seleccion/espera de roles con personajes, selector, nombres editables, claims atomicos, contador de 5 segundos y auto-start.
- Fase D2 soporte debug temporal: el GM React tiene boton `Forzar inicio` para pruebas con 1 solo jugador real; solo arranca si existe al menos 1 rol confirmado en `lobby.roleClaims`.
- Ultima verificacion registrada: 2026-04-22 20:25:28. `npm.cmd run build` pasa. Sigue el aviso esperado del asset pendiente `assets/maps/instituto_newton_plano.png`.
- Punto de control de test: la migracion React parece exitosa en navegacion y pantallas principales; se continua validando en navegador.
- `src/App.jsx` enruta por querystring:
  - `?screen=access`
  - `?screen=roles`
  - `?screen=waiting&role=...`
  - `?screen=player&role=...`
  - `?screen=gm`
  - `?screen=minigames`
- Componentes Newton creados:
  - `NewtonLogo`,
  - `NButton`,
  - `NBadge`,
  - `NCard`,
  - `NProgress`,
  - `NTimer`.
- Servicios React creados:
  - `src/services/firebaseClient.js`,
  - `src/services/sessionAccess.js`,
  - `src/services/clientIdentity.js`,
  - `src/services/remoteState.js`,
  - `src/services/gmService.js`,
  - `src/services/lobbyService.js`,
  - `src/services/gameRules.js`,
  - `src/services/pulseService.js`.
- `GMScreen` React ya puede:
  - leer estado remoto cada segundo,
  - abrir lobby,
  - generar codigo de sesion,
  - guardar codigo en `localStorage`,
  - resetear partida,
  - mostrar timer,
  - mostrar cola remota,
  - mostrar historial resumido,
  - comenzar pulso manual,
  - usar lock remoto por ETag / `If-Match`,
  - refrescar `queuedActions` justo al corte de pulso,
  - ejecutar acciones en orden de `loadedAt`,
  - escribir acciones por `queuedActions/<id>` sin pisar acciones tardias,
  - borrar solo acciones resueltas,
  - aplicar reglas MVP portadas a React.
- `GMScreen` React todavia NO tiene `Auto pulso`.
- Los monitores GM React todavia no estan portados.
- `PlayerScreen` React ya tiene primer corte jugable:
  - polling de estado remoto,
  - validacion de codigo de sesion,
  - redireccion si `session.status !== in_game`,
  - escena visual inicial,
  - hotspots,
  - popover de objeto,
  - imagen/estado/feedback del target,
  - cartas por rol,
  - drag/drop a slot de accion,
  - carga local de 5 segundos,
  - cancelacion de carga local,
  - encolado seguro por `queuedActions/<id>`,
  - cola propia resumida,
  - historial resumido,
  - overlay de resultado de pulso.
- `PlayerScreen` React todavia NO es equivalente al legacy completo:
  - falta chat,
  - falta layout final responsive,
  - falta modo `?view=gm-monitor`,
  - falta cancelacion por cambio remoto de estado del objeto mientras carga,
  - faltan monitores GM React,
  - falta validacion manual completa multi-pestana.

### Checklist de test React actual

- Acceso:
  - validar codigo incorrecto,
  - validar codigo correcto tras iniciar partida desde GM React,
  - confirmar persistencia en `localStorage`.
- Roles:
  - seleccionar cada rol,
  - confirmar redireccion a espera,
  - confirmar bloqueo si no hay codigo valido.
- Espera:
  - quedarse esperando si `session.status !== in_game`,
  - entrar a jugador cuando GM inicia partida,
  - volver a acceso tras reset.
- Jugador:
  - abrir cada hotspot,
  - arrastrar carta valida al slot,
  - comprobar carga local de 5 segundos,
  - cancelar carga local,
  - confirmar que la accion aparece en cola GM,
  - confirmar una sola accion pendiente por jugador.
- GM:
  - iniciar partida y generar codigo,
  - resetear partida,
  - comenzar pulso manual,
  - comprobar que acciones cargadas antes del corte entran,
  - comprobar que acciones tardias esperan al siguiente pulso.
- Compatibilidad Firefox:
  - mantener polling puro,
  - probar con varias pestanas abiertas,
  - confirmar que no se reintroduce SSE/EventSource.

### Minijuegos

- Carpeta:
  `assets/Minigames/`
- Minijuegos detectados:
  - `hexer_falling_index.html`: HTML standalone con logica propia, Web Audio y estilo terminal.
  - `puzzle_sincronizacion_ondas_react.jsx`: React JSX para sincronizacion de ondas.
- El minijuego de ondas depende de:
  - `framer-motion`,
  - `lucide-react`,
  - componentes tipo shadcn `@/components/ui/...`.
- Aun no se ha integrado ningun minijuego en el flujo de partida.
- Pantalla React de laboratorio:
  `react.html?screen=minigames`
- Decision pendiente: adaptar minijuegos al design system Newton antes de conectarlos a reglas de acciones.

### Plan de continuacion React

#### Fase C1 - Completar GM React

- Completado: portar `Comenzar pulso` manual.
- Completado: extraer logica legacy de pulso a servicios React:
  - lock remoto por ETag / `If-Match`,
  - refresco de `queuedActions` justo al corte de pulso,
  - escritura por accion `queuedActions/<id>`,
  - borrado solo de acciones resueltas,
  - mantener polling puro por compatibilidad Firefox.
- Pendiente: `Auto pulso`.
- Pendiente: mejorar render de cola con barras de ejecucion por accion.
- Portar `lastRoleActions`.
- Portar monitores GM como iframes React o legacy temporal.
- Mantener `Auto pulso` como pendiente si mete riesgo; flujo manual primero.

#### Fase D - Player React funcional

- Completado primer corte: portar escena de jugador:
  - fondo de escenario como imagen estatica local,
  - hotspots,
  - popover de objeto,
  - imagen del estado,
  - feedback del target.
- Completado primer corte: pull de cartas por rol.
- Completado: baraja de acciones integrada dentro del escenario como elemento flotante.
- Completado primer corte: drag/drop de cartas a slot de accion.
- Completado primer corte: carga local de 5 segundos:
  - cancelable,
  - privada,
  - una accion por jugador,
  - bloqueo durante overlay de resultado.
- Completado primer corte: encolado seguro:
  - `queuedActions/<id>`,
  - `clientId`,
  - `sessionCode`,
  - manejo de error Firebase.
- Completado parcial: historial resumido.
- Completado primer corte: overlay de resultado de pulso.
- Completado: retirada la pantalla embebible `?screen=map` y la capa `iframe`; queda preparado el asset fijo `assets/maps/instituto_newton_plano.png`.
- Pendiente: portar chat.
- Pendiente: portar `?view=gm-monitor` para que el GM observe pantallas jugador sin controles.
- Pendiente: test manual completo del lobby con 4 pestanas Firefox:
  - entrada por codigo,
  - edicion de nombres,
  - conflicto de rol,
  - 4 jugadores listos,
  - contador 5s,
  - fade y entrada al rol asignado.
- Pendiente: recalibrar posiciones/tamanos de hotspots contra el plano definitivo.
- Pendiente: cancelar carga local si el objeto cambia de estado remoto mientras carga.
- Pendiente: pulir layout responsive y estetica final del escenario.

#### Fase E - Reglas y dominio

- Extraer reglas de `app.js` a modulo compartido:
  - `resolveAction`,
  - `resolveActionWithResult`,
  - `buildPulseFlags`,
  - consecuencias narrativas,
  - outcome de salida limpia.
- Mantener equivalencia de comportamiento con legacy antes de redirigir pantallas.
- Anadir pruebas manuales documentadas:
  - accion cargada en segundo 9 del aviso entra en pulso,
  - accion tardia durante ejecucion espera al siguiente,
  - dos GM no ejecutan pulsos simultaneos,
  - reset devuelve jugadores al acceso,
  - Firefox con 5 pestanas no bloquea polling.

#### Fase D2 - Lobby visual de seleccion de rol

- Estado: primer corte implementado en React.
- Objetivo completado: sustituir las 4 tarjetas actuales por una sala/lobby compartido tras introducir codigo de sesion.
- Orden visual confirmado:
  - El guaperas,
  - El Empollón,
  - La Mística,
  - La Manitas.
- Assets disponibles:
  - `assets/Lobby/Characters/*_Idle.png`,
  - `assets/Lobby/Characters/*_Selected.png`,
  - `assets/Lobby/Selector.png`.
- Flujo confirmado:
  - completado: pantalla `Selecciona un rol`,
  - completado: jugador puede clicar cualquier personaje para ver tarjeta superior izquierda,
  - completado: incluso si el rol esta reclamado por otro, se puede previsualizar,
  - completado: solo `Continuar` intenta reservar el rol,
  - completado: empate resuelto por claim atomico con `If-Match`,
  - completado: pantalla `Esperando jugadores...`,
  - completado: al estar los 4 listos aparece contador de 5 segundos sobre el boton inferior derecho,
  - completado: despues fade out hacia la partida,
  - completado: auto-start sin intervencion del GM.
- Debug temporal:
  - completado: boton GM `Forzar inicio`,
  - arranca `session.status = in_game` con timer activo si hay al menos 1 claim real,
  - no crea jugadores falsos ni modifica `lobby.roleClaims`,
  - deuda tecnica: retirar antes de considerar cerrado el lobby real.
- Modelo tecnico previsto:
  - `lobby.players/<clientId>` para nombre, preview, estado y rol confirmado,
  - `lobby.roleClaims/<roleId>` para reserva real del rol,
  - claims con ETag / `If-Match`, no con escritura completa,
  - `session.status` pasa a `in_game` cuando hay 4 claims.
- Nombre de jugador:
  - completado: por defecto `Jugador1`, `Jugador2`, `Jugador3`, `Jugador4` segun orden de llegada,
  - completado: editable en lobby,
  - completado: editable tambien en la pantalla de partida en primer corte provisional,
  - completado: las acciones usan el nombre guardado localmente.
- Pendientes/riesgos de esta fase:
  - decidir mas adelante liberacion automatica de roles si una pestana lista se cierra,
  - ajustar exacto posicion/escala de personajes contra los mockups,
  - validar manualmente con 4 pestanas reales en Firefox,
  - revisar si el boton GM debe llamarse definitivamente `Abrir lobby` en todo el texto de producto.

#### Fase F - Integracion de minijuegos

- Decidir si cada minijuego aparece como:
  - modal sobre objeto,
  - pantalla dedicada,
  - panel dentro del dispositivo de rol.
- Adaptar `hexer_falling_index.html` a React o aislarlo en iframe controlado.
- Adaptar `puzzle_sincronizacion_ondas_react.jsx`:
  - reemplazar shadcn por componentes Newton o instalar dependencias,
  - decidir si conservar `framer-motion`,
  - cambiar estetica a blueprint institucional,
  - exponer callbacks `onSolved`, `onFailed`, `onClose`.
- Conectar resultado de minijuego a reglas/estado remoto solo cuando el flujo principal React sea estable.

#### Fase G - Sustitucion del legacy

- Solo cuando GM React y Player React sean equivalentes al legacy:
  - redirigir `gm.html` a `react.html?screen=gm`,
  - redirigir `game-empollon.html` a `react.html?screen=player&role=empollon`,
  - redirigir `game-manitas.html` a `react.html?screen=player&role=manitas`,
  - redirigir `game-bruto.html` a `react.html?screen=player&role=guaperas`,
  - redirigir `game-mistica.html` a `react.html?screen=player&role=mistica`.
- Mantener una copia legacy o rama de respaldo hasta validar partida completa.

### Riesgos React actuales

- Hay dos apps conviviendo: legacy y React. Es facil confundirse abriendo `gm.html` y esperar cambios visuales React.
- El GM React escribe en la misma Firebase que legacy; evitar testear start/reset en ambas apps a la vez salvo que se quiera probar compatibilidad.
- El boton GM `Forzar inicio` es una herramienta debug temporal para simular partida con 1 jugador; debe retirarse o protegerse antes de una prueba real.
- El minijuego de ondas no compila tal cual dentro del proyecto porque importa dependencias externas y alias `@/components/ui/...`.
- Mantener polling puro; no reintroducir SSE/EventSource por Firefox.

## Riesgos y pendientes

- Media: definir reglas para targets todavía debug (`cuadro eléctrico`, `material deportivo`) o marcarlos visualmente como no implementados.
- Media: convertir el organigrama React en una vista renderizada real si se decide usarlo dentro del prototipo HTML actual.
- Media: generar un asset específico para el panel digital para diferenciarlo claramente del cuadro eléctrico.
- Media: revisar el modo `Auto pulso`; existe como control, pero el flujo estable probado es manual.
- Media: retirar el boton temporal `Forzar inicio` del GM cuando pueda testearse el lobby con 4 jugadores reales o sustituirlo por un modo simulacion claramente separado.
- Baja: reemplazar `assets/Lobby/UI/Lobby_panel_guaperas.png` por una version final exportada del diseno; ahora es un placeholder tecnico para completar el renombrado desde Bruto.
- Baja: normalizar nombres internos y textos entre inglés/español (`target`, `queued`, `pulse`, etc.) cuando el prototipo deje de moverse tan rápido.

## Deudas resueltas

- Alta: eliminadas las funciones legacy `renderQueueLegacy` y `createQueuedActionFromSelection`; el flujo principal queda centrado en drag/drop, carga local y pulso.
- Alta: eliminada la función duplicada `resolveActionLegacy`; solo queda `resolveAction()` como fuente de verdad para reglas MVP.
- Alta: limpiados los textos activos con mojibake y normalizados los mensajes visibles con acentos correctos.
- Alta: corregida la sincronización bidireccional de la cola de acciones entre las 5 pantallas. El bug era que EventSource agotaba los slots de conexión HTTP en Firefox, bloqueando el polling.
- Alta: eliminado EventSource (SSE) como mecanismo de sincronización; polling cada 1s es ahora el único canal.
- Alta: simplificado `handleRemoteEvent` — ya no aplica estado directamente, solo invalida el snapshot para que polling lo recoja.
- Alta: eliminadas funciones muertas `buildCurrentRemoteState`, `setRemotePath`, `refreshRemoteState`.
- Media: añadida regla de redirección continua: jugadores en pantalla de juego con partida sin comenzar son enviados a selección de rol en cada tick de polling.
