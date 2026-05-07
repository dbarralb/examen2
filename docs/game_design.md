# Game Design Document - El Examen II

> Estado: Nivel 1 activo - Almacen. Flujo actual: acceso por codigo, lobby GM y partida parcial/manual.

## Concepto

Juego narrativo cooperativo asimetrico tipo point & click. Cuatro alumnos exploran el mismo espacio, pero no perciben la misma realidad.

La verdad no esta en lo que ve un jugador, sino en lo que el grupo reconstruye al comparar perspectivas.

## Loop principal

0. El GM entra con codigo unico de sesion GM y abre lobby.
1. Los jugadores entran con codigos neutrales de jugador, reclaman rol y esperan inicio.
2. Observar el escenario propio.
3. Compartir informacion por voz o chat.
4. Detectar contradicciones entre realidades y generar resonancia compartida.
5. Usar `Accion_Inspeccion` o `Accion_Interaccion` sobre hotspots.
6. Completar el minijuego de carga: cada chip aporta carga numerica.
7. Activar fusion desde el movil cuando el objetivo lo requiera. En taquillas, el GM no inicia la fusion en el flujo canonico.
8. Esperar el pulso del GM para resolver chips normales.
9. Resolver acciones, acumular carga por hotspot, consumir resonancia cuando proceda y abrir objetos fusionados.
10. Actualizar el tablero.

## Acceso y lobby

La sesion separa tres conceptos:

- Codigo GM: clave manual unica para entrar al panel Game Master. Actualmente es `delfin` y se guarda solo en `sessionStorage` del navegador del GM.
- Codigo de partida GM: codigo numerico generado al abrir lobby y guardado en `session.accessCode`; identifica la sesion activa para el propio GM y compatibilidad interna.
- Codigos neutrales de jugador: cuatro codigos numericos generados como `jugador1` a `jugador4`. No estan ligados a un rol hasta que el jugador reclama uno en el lobby.

El flujo canonico es:

1. El GM entra desde `access` introduciendo el codigo GM.
2. El GM pulsa `Abrir lobby`.
3. El sistema genera codigos neutrales de jugador.
4. Cada jugador introduce un codigo, entra a seleccion de rol y reclama personaje.
5. El GM puede iniciar partida con al menos 1 jugador preparado. Si los 4 roles estan reclamados, el arranque automatico con countdown puede seguir funcionando.

Este codigo GM es una barrera de flujo local, no una autorizacion fuerte de Firebase.

## Nivel 1 - Almacen del gimnasio

Objetivo: salir del almacen hacia el gimnasio.

Realidades iniciales:

- Realidad A: Empollon + Guaperas
- Realidad B: Manitas + Mistica
- Realidades C/D: reservadas para futuros niveles o pruebas

Elementos activos:

- Pizarra: plan del robo del examen, incompleto o desplazado segun realidad.
- Taquillas: bloqueo principal de tutorial; solo se abren tras fusionar propiedades de A y B.
- Caja: introduce la regla "no todo lo que ves es real".
- Balones: contradiccion observable entre realidades.
- Panel de salida: combina codigo numerico y mecanismo fisico.
- Puerta: salida final; se abre cuando el panel fusionado valida el codigo.

## Resonancia, carga, pulso y fusion

La resonancia es un recurso compartido que aparece cuando el grupo detecta contradicciones entre las variantes A y B. En la version actual vive en `gameState.sharedResonance`, se muestra como contador a los jugadores y puede crecer por hallazgos, excedentes de carga o resonancia ambiental recogida por hover.

El pulso del GM mantiene su funcion actual: resuelve las acciones encoladas despues del minijuego. A partir de este nivel, el pulso tambien puede consumir resonancia para estabilizar una contradiccion y crear un estado fusionado de un objeto.

La carga es acumulativa por hotspot y variante. Un chip no tiene que alcanzar por si solo el umbral de descubrimiento: si aporta menos carga de la necesaria, esa carga queda guardada en `gameState.accumulatedCharge`. Cuando se completan los slots de descubrimiento de un hotspot, el excedente se convierte en resonancia compartida.

Las guias de jugador aparecen como overlays superiores no bloqueantes: se muestran centradas bajo la onda de anomalia, duran 10 segundos, tienen barra de progreso y tambien pueden cerrarse con boton. Si se disparan varias guias seguidas, se encolan con una pausa minima de 3 segundos entre ellas.

La fusion combina propiedades de dos realidades en una nueva version estable. No es una tercera variante visual completa: es un nuevo estado del objeto dentro del escenario actual. Ejemplo: una taquilla que en A parece cerrada con candado y en B muestra una anomalia mecanica puede pasar a `LOCKER_FUSION`, donde ambas propiedades conviven y el bloqueo ya es manipulable.

### Flujo del bloqueo de taquillas

1. Los jugadores comparan variantes A/B y detectan contradicciones en caja, balones o taquillas.
2. Esas contradicciones generan resonancia compartida.
3. Los jugadores usan `Accion_Inspeccion` sobre caja, balones o taquillas para convertir contradicciones y carga acumulada en descubrimientos/resonancia.
4. Los jugadores activan la fusion desde el terminal movil de la taquilla cuando hay resonancia suficiente.
5. Las variantes A y B completan la sincronizacion en el movil.
6. La fusion consume resonancia y la taquilla pasa de `LOCKER_LOCKED` a `LOCKER_FUSION`.
7. Solo desde `LOCKER_FUSION`, usando la llave sobre la taquilla, una nueva `Accion_Interaccion` puede abrirla y pasarla a `LOCKER_OPEN`.

La taquilla deja de poder abrirse por rutas paralelas. `Accion_Inspeccion` revela contradicciones, acumula carga y genera resonancia; la fusion la activan los jugadores desde el movil; `Accion_Interaccion` con llave abre la taquilla ya fusionada. La apertura requiere siempre fusion previa.

### Flujo canonico del Nivel 1

1. Los jugadores detectan contradicciones entre A/B.
2. Las contradicciones y la carga acumulada generan resonancia compartida.
3. Los jugadores activan la fusion desde el movil de la taquilla.
4. La resonancia compartida se consume y la taquilla se fusiona.
5. Los jugadores usan la llave y abren la taquilla fusionada.
6. Obtienen el modulo de sincronizacion.
7. Colocan el modulo en el panel.
8. El panel se fusiona/activa.
9. Introducen el codigo reconstruido.
10. Se abre la puerta.

Estados principales: `LOCKER_LOCKED`, `LOCKER_FUSION`, `LOCKER_OPEN`, `PANEL_NEEDS_MODULE`, `PANEL_FUSION`, `PANEL_OK`, `DOOR_OPEN`.

## Roles

| Rol | Funcion | Cartas |
|---|---|---|
| Empollon | Instrucciones, logica y reglas de sistemas | Accion_Inspeccion, Accion_Interaccion |
| Manitas | Mecanismos, herramientas y manipulacion fisica | Accion_Inspeccion, Accion_Interaccion |
| Guaperas | Fuerza, empuje y avance bajo riesgo | Accion_Inspeccion, Accion_Interaccion |
| Mistica | Anomalias, duplicados y falsos positivos | Accion_Inspeccion, Accion_Interaccion |

Cada rol conserva su identidad visual y narrativa, pero el MVP reduce la baraja a dos verbos atomicos:

- `Accion_Inspeccion`: inspeccionar una zona para obtener resonancia de anomalia.
- `Accion_Interaccion`: manipula un objeto para intentar arreglarlo o resolverlo.

Las familias visibles de accion no son atributos del personaje. Para conservar la ambiguedad del sistema, toda inspeccion se presenta como **Revelación** y toda interaccion como **Alteración**. El rol aporta tono e ilustracion, pero no cambia la categoria mecanica de la carta.

## Regla fundamental

No todo lo que ves es real.

El nivel debe provocar:

- "Yo no tengo toda la informacion."
- "Necesito a los demas."
- "Algo no encaja."
- "Lo hemos resuelto juntos."

## Pendiente de diseno

- Arte final por variante.
- Ajuste fino de combinaciones y flags de victoria.
- Pulso como ventana de visibilidad temporal entre jugadores.
- Interferencias de comunicacion progresivas.
- Migrar el codigo GM de constante local a configuracion/entorno si se publica una prueba abierta.
