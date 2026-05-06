# Proceso de prompts de arte para puzzles

> Uso: leer este documento antes de redactar prompts de arte para assets del juego.
> Lectura obligatoria asociada: `docs/ECO Tech Props v1.md`.

## Objetivo

Este documento fija el proceso para generar prompts de arte de objetos interactivos del juego, especialmente cuando un elemento tiene variantes, estados u overlays de puzzle.

El objetivo no es solo pedir imagenes bonitas. Cada prompt debe producir una pieza funcional que ayude al jugador a entender:

- que ve cada realidad,
- que falta,
- que ha cambiado tras una accion,
- que estado del puzzle esta activo,
- como encaja ese asset con los demas estados del mismo objeto.

## Regla base de estilo

Antes de escribir cualquier prompt de arte, leer `docs/ECO Tech Props v1.md` y aplicar su ADN visual:

- objetos industriales modulares,
- marcos metalicos robustos,
- volumen claro,
- bordes biselados,
- desgaste sutil,
- detalles tecnologicos minimos,
- lectura rapida en entorno de juego.

La regla practica es: **lectura > detalle**. Si una imagen no comunica su funcion en un segundo, el prompt debe simplificarse.

## Regla de overlays

Cuando el asset pertenezca a un puzzle con variantes o estados, debe tratarse como overlay del mismo objeto, no como rediseño independiente.

El prompt debe exigir:

- mismo encuadre,
- misma escala,
- misma perspectiva,
- misma iluminacion,
- mismos materiales base,
- mismo desgaste,
- misma posicion general,
- misma silueta principal salvo que el estado obligue a cambiarla.

Las diferencias entre renders deben limitarse al cambio funcional del puzzle: cerrado, incompleto, vibrando, fusionado, abierto, contenido visible, nota, modulo, etc.

## Contexto comun para assets de puzzle

Usar este bloque como base cuando se pida un conjunto de estados:

```text
Estos assets forman parte de un puzzle de realidades paralelas en una sala de escape narrativa. Existen dos variantes del mismo escenario: Variante A y Variante B. Los jugadores ven la misma zona fisica, pero cada variante muestra una mitad distinta de la informacion. El objeto se resuelve al comparar ambas realidades, generar resonancia, fusionar las dos mitades y despues interactuar con el estado fusionado.

Todas las imagenes deben ser overlays del mismo objeto y del mismo encuadre base. No deben rediseñar la escena completa ni cambiar la posicion general del objeto. Deben encajar encima de la imagen principal como capas de estado. Mantener escala, perspectiva, iluminacion, angulo de camara, proporciones y ubicacion identicas entre todos los estados.

Cada imagen debe comunicar una informacion jugable concreta. El jugador debe poder entender que falta, que cambio o que se desbloqueo. Evitar elementos decorativos que no aporten al puzzle.
```

## Proceso paso a paso

1. Identificar la funcion del asset:
   - estado inicial,
   - variante A,
   - variante B,
   - detalle de inspeccion,
   - feedback intermedio,
   - fusion,
   - apertura,
   - item recogible,
   - pista o nota.

2. Identificar la referencia visual:
   - asset anterior,
   - variante opuesta,
   - estado cerrado,
   - estado fusionado,
   - slot o panel donde debe encajar.

3. Escribir primero la continuidad:
   - "Usa X como referencia exacta de encuadre, escala, perspectiva, iluminacion, materiales y desgaste."

4. Escribir despues la diferencia funcional:
   - "La diferencia exacta es..."
   - "En Variante A se ve..."
   - "En Variante B se ve..."
   - "En estado fusionado..."

5. Prohibir rediseños accidentales:
   - "No rediseñar el objeto."
   - "No cambiar fondo, marco, puerta, silueta ni composicion."
   - "No añadir pistas nuevas que pertenezcan a otro asset."

6. Cerrar con resultado esperado:
   - una linea concreta que diga que debe devolver la IA.

## Patron de prompt

```text
Usa [ASSET_REFERENCIA] como referencia exacta de encuadre, escala, perspectiva, iluminacion, materiales, desgaste y posicion.

Genera [ASSET_NUEVO] como [estado/overlay/item] del mismo puzzle.

Diferencia funcional exacta:
[Explicar que cambia y por que importa para el puzzle.]

Regla de continuidad:
[Explicar que no debe cambiar.]

Regla funcional:
[Explicar que informacion jugable comunica.]

Resultado esperado:
[Una frase clara sobre lo que debe devolver.]
```

## Ejemplo: taquillas A/B

En el puzzle de taquillas:

- `LOCKER_CLOSED_VAR_A` muestra la carcasa/cierre fisico exterior incompleto.
- `LOCKER_CLOSED_VAR_B` muestra la logica mecanica interna que A no muestra.
- `LOCKER_PADLOCK_DETAIL_VAR_A` es el detalle inspeccionable del cierre exterior.
- `LOCKER_MECHANISM_DETAIL_VAR_B` es el detalle inspeccionable del mecanismo interno.
- `LOCKER_FUSION` combina ambas mitades en un cierre manipulable, pero todavia cerrado.
- `LOCKER_OPEN` muestra el mismo objeto ya abierto.
- `MODULE_SYNC_IN_LOCKER` es un objeto independiente para insertar luego por edicion.
- `NOTE_PANEL_MODULE_IN_LOCKER` es una pista independiente que referencia el modulo.

La estructura correcta no es "hacer una taquilla nueva", sino mantener la misma taquilla y cambiar solo la informacion funcional.

## Items independientes para editar despues

Si el usuario dice que insertara el elemento despues por edicion, el prompt debe pedir solo el objeto independiente.

Reglas:

- no rediseñar la taquilla,
- no incluir puerta,
- no incluir marco,
- no incluir fondo,
- no incluir interior completo,
- mantener perspectiva compatible con el estado donde se insertara,
- respetar materiales, luz, desgaste y escala visual.

Ejemplo para modulo:

```text
Crear unicamente el objeto MODULE_SYNC_IN_LOCKER como recorte/elemento independiente para insertar despues dentro de LOCKER_OPEN mediante edicion.

No rediseñar la taquilla. No incluir puerta, marco, fondo ni interior completo. Solo generar el modulo aislado.
```

## Checklist final

Antes de entregar un prompt, comprobar:

- ¿El prompt explica la funcion jugable del asset?
- ¿Dice que referencia visual debe mantener?
- ¿Dice que cambia exactamente frente al asset anterior?
- ¿Prohibe rediseñar el objeto base si debe ser overlay?
- ¿Distingue entre overlay de estado y objeto independiente?
- ¿Usa el lenguaje ECO Tech Props sin sobrecargar detalle?
- ¿Incluye una linea de resultado esperado?

## Regla para futuras peticiones

Cada vez que se solicite un prompt para implementar arte en el juego, leer primero:

1. `docs/art-prompt-process.md`
2. `docs/ECO Tech Props v1.md`

Despues redactar el prompt segun el puzzle, el estado y las referencias disponibles.
