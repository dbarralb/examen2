# Game Design Document - El Examen II

> Estado: Nivel 1 activo - Almacen.

## Concepto

Juego narrativo cooperativo asimetrico tipo point & click. Cuatro alumnos exploran el mismo espacio, pero no perciben la misma realidad.

La verdad no esta en lo que ve un jugador, sino en lo que el grupo reconstruye al comparar perspectivas.

## Loop principal

1. Observar el escenario propio.
2. Compartir informacion por voz o chat.
3. Detectar contradicciones entre realidades y generar resonancia.
4. Usar `Accion_Inspeccion` o `Accion_Interaccion` sobre hotspots.
5. Completar el minijuego de carga.
6. Esperar el pulso del GM.
7. Resolver acciones, consumir resonancia cuando proceda y fusionar objetos.
8. Actualizar el tablero.

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

## Resonancia, pulso y fusion

La resonancia es un recurso compartido implicito que aparece cuando el grupo detecta contradicciones entre las variantes A y B. No necesita una UI compleja: puede vivir como contador interno y como feedback narrativo en los hotspots.

El pulso del GM mantiene su funcion actual: resuelve las acciones encoladas despues del minijuego. A partir de este nivel, el pulso tambien puede consumir resonancia para estabilizar una contradiccion y crear un estado fusionado de un objeto.

La fusion combina propiedades de dos realidades en una nueva version estable. No es una tercera variante visual completa: es un nuevo estado del objeto dentro del escenario actual. Ejemplo: una taquilla que en A parece cerrada con candado y en B muestra una anomalia mecanica puede pasar a `LOCKER_FUSION`, donde ambas propiedades conviven y el bloqueo ya es manipulable.

### Flujo del bloqueo de taquillas

1. Los jugadores comparan variantes A/B y detectan contradicciones en caja, balones o taquillas.
2. Esas contradicciones generan resonancia compartida.
3. Los jugadores usan `Accion_Inspeccion` sobre caja, balones o taquillas para convertir contradicciones en resonancia.
4. Los jugadores usan `Accion_Interaccion` sobre la taquilla para intentar estabilizar el cierre.
5. En el pulso del GM, si hay resonancia suficiente, la taquilla pasa de `LOCKER_LOCKED` a `LOCKER_FUSION`.
6. Solo desde `LOCKER_FUSION` una nueva `Accion_Interaccion` puede abrirla y pasarla a `LOCKER_OPEN`.

La taquilla deja de poder abrirse por rutas paralelas. `Accion_Inspeccion` revela contradicciones y genera resonancia; `Accion_Interaccion` manipula objetos para fusionarlos, abrirlos o resolverlos. La apertura requiere siempre fusion previa.

### Flujo canonico del Nivel 1

1. Los jugadores detectan contradicciones entre A/B.
2. Las contradicciones generan resonancia.
3. El GM lanza un pulso.
4. La resonancia se consume y la taquilla se fusiona.
5. Los jugadores abren la taquilla fusionada.
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
