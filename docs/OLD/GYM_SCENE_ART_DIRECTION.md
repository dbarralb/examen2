# Dirección visual - Escena Gimnasio MVP

## Objetivo de la ilustración

La escena debe representar un gimnasio de instituto cerrado por un sistema de seguridad. Tiene que funcionar como fondo jugable para una aventura gráfica: los objetos importantes deben leerse rápido, tener espacio alrededor para hotspots y no quedar tapados por la UI flotante.

La imagen debe pensarse como un plano horizontal panorámico, porque en la web el escenario ocupa todo el viewport.

## Formato recomendado

- Proporción base: `16:9`.
- Tamaño recomendado de trabajo: `1920 x 1080`.
- La composición debe tolerar recorte responsive en pantallas algo más estrechas.
- Evitar detalles críticos pegados a los bordes.
- Mantener una zona central limpia para que el jugador entienda la sala.

## Composición general

La cámara debe estar en una vista frontal ligeramente elevada, como si el jugador mirase el gimnasio desde una esquina o desde la entrada.

Distribución sugerida:

```txt
┌────────────────────────────────────────────────────────────┐
│  Zona alta izquierda/media: pared, luces, sensor            │
│                                                            │
│  Taquillas      Cuadro eléctrico     Panel        Puerta    │
│                                                            │
│                                                            │
│                 Pista / suelo del gimnasio                  │
│                                                            │
│       Material deportivo                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Objetos interactivos y ubicación

### Puerta de emergencia

Ubicación recomendada:
- Lado derecho de la escena.
- Algo elevada respecto al centro vertical.
- Debe ser claramente una salida de emergencia.

Lectura visual:
- Puerta metálica o doble puerta con barra antipánico.
- Puede tener luz de salida, señal verde o marco de seguridad.
- Tiene que admitir estados posteriores: cerrada, forzada, abierta limpia.

Espacio UI:
- Dejar margen alrededor para que el hotspot y la tarjeta de información no tapen detalles importantes.

### Panel digital

Ubicación recomendada:
- A la izquierda de la puerta o cerca de ella.
- En pared, aproximadamente a altura humana.

Lectura visual:
- Pequeño panel con pantalla, números, led o interfaz digital.
- Debe verse como parte del sistema de bloqueo.

Relación narrativa:
- Es el objeto que El Empollón interpreta y La Manitas puede puentear.
- Conviene que parezca conectado a la puerta.

### Sensor ambiental

Ubicación recomendada:
- Zona alta, cerca del techo o parte superior de la pared.
- Aproximadamente centro-superior o ligeramente a la derecha.

Lectura visual:
- Cámara, detector, sensor circular o caja con luz.
- Debe destacar lo suficiente para ser reconocible, pero puede estar arriba.

Relación narrativa:
- La Mística detecta patrones raros en él.
- La Manitas puede desmontarlo.

### Taquillas

Ubicación recomendada:
- Lado izquierdo de la escena.
- En pared, como bloque vertical de varias taquillas.

Lectura visual:
- Grupo de lockers escolares/deportivos.
- Una taquilla puede destacar con pegatina, candado o puerta mal cerrada.

Relación narrativa:
- Contiene la nota.
- Debe admitir versión cerrada, abierta limpia y reventada.

### Cuadro eléctrico

Ubicación recomendada:
- Pared izquierda-media o centro-izquierda.
- Cerca de conducciones/cables que sugieran relación con panel y sistema.

Lectura visual:
- Caja eléctrica con tapa, símbolo de peligro o cables.
- De momento es placeholder, pero debe poder volverse relevante.

### Material deportivo

Ubicación recomendada:
- Zona baja izquierda o baja central.
- En el suelo, sin tapar el botón central de encolar.

Lectura visual:
- Balones, conos, colchonetas, raquetas, bancos, cuerdas o material apilado.
- Debe parecer manipulable.

## Zonas reservadas para UI

La interfaz actual coloca overlays sobre el escenario. La ilustración debe dejar aire en esas zonas.

### Inferior izquierda

Aquí vive el pull de acciones.

Reservar:
- Desde el borde izquierdo hasta aproximadamente el 35% del ancho.
- Altura aproximada: los últimos 160px de pantalla.

Evitar aquí:
- Detalles narrativos pequeños.
- Texto dentro de la ilustración.
- Objetos críticos demasiado pegados al borde inferior.

### Encima del pull, izquierda-media

Aquí vive la cola de acciones.

Reservar:
- Banda horizontal baja, encima de las cartas.
- Puede tapar parte del suelo.

### Centro inferior

Aquí vive:
- texto de intención,
- botón `Encolar acción`.

Evitar:
- El objeto principal del puzle justo en el centro inferior.
- Detalles visuales que compitan con el botón.

### Izquierda centro

Aquí vive el dispositivo de rol.

Reservar:
- Una zona pequeña en el lateral izquierdo, centrada verticalmente.
- No poner información crítica justo detrás.

### Derecha superior

Aquí vive el historial.

Reservar:
- Esquina superior derecha.
- Evitar poner texto, señales o pistas pequeñas ahí.

### Derecha inferior

Aquí vive el chat.

Reservar:
- Esquina inferior derecha.
- Evitar poner objetos críticos en esa zona.

## Hotspots actuales

Los hotspots son cuadrados visibles, no los objetos completos.

Ubicación actual aproximada en porcentaje:

```txt
puerta:             x 82%, y 42%
panel:              x 66%, y 36%
sensor:             x 50%, y 18%
taquilla:           x 18%, y 42%
cuadro eléctrico:   x 35%, y 32%
material deportivo: x 48%, y 68%
```

Estos puntos pueden ajustarse cuando la ilustración final esté colocada. Lo importante es que cada objeto quede cerca de su hotspot y sea reconocible.

## Prioridades visuales

Orden de lectura recomendado:

1. Puerta de emergencia.
2. Panel digital.
3. Sensor.
4. Taquillas.
5. Cuadro eléctrico.
6. Material deportivo.

La puerta debe sentirse como objetivo final. El panel y sensor deben sentirse como bloqueo/sistema. Taquillas y material deportivo deben sentirse como recursos o pistas.

## Tono

El gimnasio debe parecer de instituto, no una sala futurista pura.

Mezcla recomendada:
- gimnasio escolar cotidiano,
- seguridad exagerada,
- tono ligeramente misterioso,
- espacio creíble para humor y caos.

Ideas visuales:
- suelo de pista deportiva con líneas,
- pared con espalderas o canastas,
- fluorescentes,
- señalética escolar,
- puerta de emergencia con iluminación,
- cables o cajas añadidas por el sistema de seguridad,
- algún cartel institucional o deportivo.

## Evitar

- No poner todos los objetos en el mismo lado.
- No llenar el fondo de detalles con lectura parecida a objetos interactivos.
- No poner texto pequeño importante en las esquinas derecha superior/inferior.
- No situar la puerta demasiado abajo, porque competiría con el botón de encolar.
- No esconder el sensor demasiado; debe poder descubrirse visualmente.

## Entrega útil para implementación

Cuando exista la ilustración final, conviene exportarla como:

```txt
assets/scene/gym_background.png
```

Después se ajustarán los porcentajes de hotspots en `app.js` para que coincidan exactamente con la ilustración.
