# Experiencia UX Onboarding

**Fecha:** 2026-05-07  
**Contexto:** Nivel 1 activo, Almacen. Flujo actual: el jugador explora en pantalla grande y crea chips de accion navegando una red de nodos en el terminal movil.

---

## Objetivo del documento

Definir que mecanicas necesita entender un jugador durante los primeros minutos de partida y en que momentos el producto digital debe ayudarle con tooltips, microcopy, estimulos visuales o feedback de estado.

La intencion no es convertir el juego en un tutorial cerrado. El objetivo es evitar que el primer contacto sea solo "tocar el escenario sin mas" y que cada nueva mecanica aparezca con una pista minima justo cuando el jugador la necesita.

---

## Principios UX

1. **Primero curiosidad, luego explicacion.** El jugador debe poder tocar y descubrir, pero el sistema debe responder con claridad cuando una accion abre una regla nueva.
2. **Una mecanica nueva cada vez.** No explicar NodeGraph, pulso, fusion, inventario y variantes a la vez.
3. **El producto debe confirmar el modelo mental.** Si el jugador selecciona algo, debe entender si esta leyendo, preparando un chip, esperando pulso o viendo un resultado.
4. **La pantalla grande es el tablero; el movil es la herramienta.** La pantalla grande es exploracion, lectura, inventario y feedback. El terminal movil es la red de nodos: el espacio donde encontrar los puertos de cada objeto y crear chips.
5. **El GM no debe ser el tutorial permanente.** El GM puede contextualizar, pero la interfaz debe sostener los primeros pasos sin depender de explicacion oral constante.
6. **La ayuda debe desaparecer cuando ya no aporta.** Tooltips y estimulos de primera vez deben ser breves, persistentes solo cuando haya bloqueo real.
7. **La red premia la exploracion, no la memorizacion.** El jugador aprende el mapa de nodos jugando: las capas de zoom y la organizacion por salas eliminan la carga de tener que memorizar posiciones.

---

## Mecanicas que hay que ensenar

### 1. Exploracion del escenario (pantalla grande)

El jugador necesita aprender que el escenario es tactil, que puede moverse por el mapa y que hay zonas interactivas no siempre obvias.

**Conceptos clave**

- Mover/panear el mapa de escenario en pantalla grande.
- Detectar proximidad a hotspots.
- Tocar un hotspot para abrir una object card.
- Cerrar una card tocando fuera.
- La pantalla grande muestra informacion; la accion se ejecuta desde el movil.

**Ayuda recomendada**

- Tooltip inicial ligero: "Explora el escenario. Acercate a zonas que reaccionen."
- Estimulo de cursor/proximidad: intensificar el cursor cuando se acerca a un hotspot.
- Primer hotspot abierto: microcopy "Has seleccionado un objetivo."
- Al final de la primera card: "Para actuar sobre este objetivo, encuentra su puerto en el terminal movil."

---

### 2. Object cards y lectura de estado

Al abrir un hotspot, el jugador debe entender que la card no es solo descripcion: tambien contiene estado, familia, objetos, descubrimientos y proxima accion sugerida.

**Conceptos clave**

- Nombre del objetivo.
- Tipo/familia del hotspot.
- Estado actual.
- Feedback textual.
- Bloque de ayuda: "Encuentra el puerto de este objetivo en tu terminal."

**Ayuda recomendada**

- Resaltar visualmente el estado del objetivo.
- Copy corto dentro de la card: "Objetivo activo. Busca su puerto de red en el terminal movil."
- Evitar botones de accion en pantalla grande: la card no ejecuta chips.

---

### 3. Descubrimientos progresivos

Los slots bloqueados son una promesa de informacion futura. El jugador debe entender que inspeccionar desbloquea conocimiento y que puede haber varias capas.

**Conceptos clave**

- Slot bloqueado.
- Slot desbloqueado tras inspeccion.
- Persistencia al cerrar/reabrir.
- Diferencia entre primera y segunda inspeccion.

**Ayuda recomendada**

- Texto de slot bloqueado: "Analisis pendiente" o "Requiere otra inspeccion".
- Animacion al desbloquear: candado/filtro se desvanece, borde verde, contenido aparece con fade.
- Notificacion tras pulso: "Taquillas: analisis desbloqueado."

---

### 4. Inventario

El inventario debe entenderse como consecuencia de explorar, no como accion principal del puzzle desde el primer segundo.

**Conceptos clave**

- Hay objetos dentro de algunos hotspots.
- Se pueden recoger.
- Algunos objetos sirven mas adelante.
- Los detalles del objeto pueden contener pistas.

**Ayuda recomendada**

- Primer objeto visible: brillo breve sobre la celda del objeto.
- Primer objeto recogido: toast "Objeto guardado en inventario."
- Primer click en objeto de inventario: tooltip "Abre los objetos para leer detalles."

---

### 5. Red de nodos (Network Canvas)

El terminal movil simula la navegacion por una red de datos fisica. No es un minimapa del escenario: es una representacion de la infraestructura de red del almacen. Cada objeto del escenario tiene uno o varios puertos de red en este canvas, y hackear un puerto crea un chip de accion.

**El canvas funciona como un mapa interactivo:**
- Se puede panear arrastrando con un dedo.
- Se puede hacer zoom in/out con gesto de pinza (como Google Maps).
- Los nodos estan organizados por salas para facilitar la navegacion.

**Tres capas de zoom:**

| Capa | Nivel de zoom | Informacion visible |
|---|---|---|
| Macro | Alejado | Clusters de salas etiquetados. Vista de conjunto del almacen. |
| Medio | Normal | Iconos de nodo por objeto/hotspot dentro de cada sala. Nombre y familia del objeto. |
| Micro | Acercado | Puertos individuales del nodo seleccionado. Tipo de puerto visible y clicable. |

**Conceptos clave**

- El canvas es diferente al mapa de la pantalla grande (no es una copia 1:1 del escenario visual).
- Los nodos en el canvas representan objetos del escenario; los jugadores aprenden el lenguaje de iconos.
- Hacer zoom in sobre un nodo revela sus puertos disponibles.
- La organizacion por salas elimina la necesidad de memorizar posiciones.
- Los jugadores de la misma partida son visibles en el canvas: aparece un indicador de donde esta mirando cada jugador en ese momento.

**Lenguaje visual de nodos:**

El sistema usa familias de hotspot ya establecidas en el escenario (contenedor, dispositivo, persona, objeto, acceso) para generar iconos y colores consistentes en el canvas. Los jugadores aprenden este lenguaje durante la partida sin necesidad de un tutorial previo: el icono de "contenedor" siempre parece un contenedor, el de "acceso" siempre parece una puerta.

**Panel de nodos descubiertos:**

Los nodos con los que el jugador ha interactuado al menos una vez aparecen en un panel de acceso rapido (lista lateral o pull-up). Esto permite al jugador volver a un nodo conocido sin tener que encontrarlo de nuevo en el canvas. El panel no muestra nodos no descubiertos: la exploracion sigue siendo necesaria para la primera vez.

**Ayuda recomendada**

- Primera apertura del terminal: tooltip breve "Esta es la red del almacen. Aleja para ver las salas, acerca para ver los puertos."
- Primera interaccion de zoom: solo estimulo visual (ninguna pantalla de tutorial).
- Nodo no descubierto: visible en el canvas pero sin etiqueta de puerto (hay que acercarse para ver que tiene).
- Panel de acceso rapido: etiqueta "Visto antes" para distinguirlo del canvas completo.

**Indicadores de posicion de otros jugadores:**

Cada jugador tiene un icono de color persistente en el canvas que muestra donde esta mirando en ese momento. Si un jugador dice en radio "mira, estoy aqui", los demas pueden tocar su icono y el canvas se desplaza automaticamente hasta la zona donde ese jugador tiene el foco. Esto sustituye la necesidad de dar instrucciones verbales de posicion ("es el nodo de arriba a la derecha del cluster central").

---

### 6. Relacion hotspot-puerto (1:N)

Cada hotspot del escenario tiene uno o mas puertos de red en el canvas. Los puertos no son equivalentes: cada uno tiene un tipo que determina el tipo de accion que genera.

**Tipos de puerto:**

| Tipo | Nombre en canvas | Accion que genera | Para que sirve |
|---|---|---|---|
| `PORT_INFO` | Puerto de informacion | Chip de Inspeccion | Leer estado, obtener descubrimientos, analizar el objeto |
| `PORT_MECH` | Puerto de mecanismo | Chip de Interaccion | Activar, abrir, modificar, manipular el objeto fisicamente |

**Ejemplo con Taquillas:**

La taquilla del almacen tiene dos puertos en el canvas de red:
- `PORT_INFO` → al hackearlo se genera un chip de Inspeccion → el pulso resuelve el chip → se desbloquea un slot de descubrimiento
- `PORT_MECH` → al hackearlo se genera un chip de Interaccion → el pulso resuelve el chip → se activa el mecanismo de apertura

El jugador debe entender que no es lo mismo leer la taquilla que intentar abrirla. La distincion es visual desde el momento en que ve los dos puertos al hacer zoom sobre el nodo.

**Implicacion sobre el NodeGraph:**

Cuando el jugador toca un puerto, el tipo de puerto pre-selecciona el NodeGraph que aparece a continuacion:
- `PORT_INFO` → el grafo tiene mayoria de nodos I (Inspeccion)
- `PORT_MECH` → el grafo tiene mayoria de nodos N (Interaccion)

El jugador puede seguir eligiendo su camino dentro del grafo, pero el tipo de puerto inclina el resultado. Esto da coherencia narrativa: hackear un puerto de informacion produce casi siempre un chip de inspeccion.

**Ayuda recomendada**

- Primera vez que el jugador ve dos puertos en un mismo nodo: tooltip breve "Este objeto tiene puertos de distinto tipo. El tipo de puerto define la accion."
- Icono diferenciado en el canvas: puerto INFO con icono de ojo/lupa; puerto MECH con icono de llave/engranaje.
- Al seleccionar un puerto: etiqueta clara del tipo antes de abrir el NodeGraph.

---

### 7. NodeGraph

El NodeGraph convierte la seleccion de un puerto en un chip concreto. El tipo de puerto pre-configura el grafo, pero el jugador puede modular el resultado segun el camino que elija.

**Conceptos clave**

- I = Inspeccion.
- N = Interaccion.
- Signo de resonancia (✦) = bonus de energia al resolver.
- Solo nodos adyacentes son alcanzables desde la posicion actual.
- La mayoria de nodos visitados define el tipo de chip.
- El timer confirma automaticamente si el jugador no actua.
- El tipo de puerto del que viene pre-configura la distribucion inicial del grafo.

**Ayuda recomendada**

- Primera vez: preambulo corto antes de iniciar timer: "I inspecciona, N interactua, el pulso resolvera el chip."
- Leyenda persistente debajo del grafo.
- Nodos alcanzables con pulso visual.
- Tap invalido: shake corto del nodo, sin texto intrusivo.
- Resultado: "Chip creado: Inspeccion" o "Chip creado: Interaccion."

---

### 8. Cola de chips

El jugador debe entender que crear un chip no resuelve inmediatamente el puzzle.

**Conceptos clave**

- Chip en cola.
- Espera al siguiente pulso.
- No se puede crear otro chip mientras hay uno pendiente.
- El GM tambien ve la cola.

**Ayuda recomendada**

- En movil: badge "En cola".
- En tablero grande: bloque en object card "Chip en cola: Inspeccion."
- Overlay de cola siempre visible pero no dominante.

---

### 9. Pulso

El pulso es la regla temporal que transforma chips en consecuencias. Es critico que no parezca un retraso tecnico.

**Conceptos clave**

- El pulso resuelve chips.
- Hay estado de ejecucion.
- Aparecen resultados, notificaciones y VFX.
- Despues del pulso puede cambiar el estado del escenario.

**Ayuda recomendada**

- Antes del primer pulso: indicador "El proximo pulso resolvera los chips."
- Durante pulso: overlay visual y texto "Resolviendo chip."
- Despues: notificacion concreta con objetivo y consecuencia.

---

### 10. Resonancia

La resonancia es una moneda/energia narrativa. Debe presentarse como consecuencia de descubrir contradicciones, no como numero abstracto.

**Conceptos clave**

- Contador de resonancia.
- Inspeccionar contradicciones puede sumar resonancia.
- Puede habilitar estabilizaciones o fusiones.
- Puede aparecer resonancia ambiental recogible.

**Ayuda recomendada**

- Primera subida: toast "Resonancia +3: contradiccion detectada."
- Brillo breve en el contador.
- Primer spawn ambiental: estimulo visual suficiente; tooltip solo si el jugador no interactua tras unos segundos.

---

### 11. Variantes y realidades paralelas

La cooperacion nace de entender que cada jugador ve una realidad incompleta.

**Conceptos clave**

- Cada jugador tiene variante.
- A/B pueden ver objetos distintos.
- Las diferencias son pistas, no errores.
- Hay que comunicarse.
- El canvas de red es compartido: los indicadores de posicion de otros jugadores muestran donde esta mirando cada uno.

**Ayuda recomendada**

- Header visible con "Realidad A/B".
- Primer resultado con contradiccion: microcopy "Comparad lo que veis."
- En el canvas: iconos de jugadores visibles en tiempo real. Tocar el icono de un companero desplaza el canvas hasta su posicion.
- Evitar explicar todas las variantes antes de que aparezca una diferencia real.

---

### 12. Fusion de Realidades

La fusion es un momento dramatico cooperativo. Debe sentirse como evento especial y dejar claro que desbloquea un cambio concreto.

**Conceptos clave**

- La inicia el GM cuando ambas variantes estan listas.
- Solo las variantes implicadas la ven en su terminal.
- Cada jugador completa su parte del circuito.
- Se espera a la otra variante antes de que se confirme la fusion.
- Al completarse, el objetivo queda estabilizado y cambia su estado en el escenario.

**Ayuda recomendada**

- En movil al activarse: "Sincroniza esta realidad con la otra variante."
- Al completar una parte: "Tu parte esta lista. Esperando Variante B/A."
- Al completar ambas: "Fusion completada. Taquillas estabilizadas."
- En tablero grande: overlay "Realidades fusionadas" + VFX y consecuencia concreta del cambio.

---

### 13. Dispositivos del escenario

Los dispositivos tienen consola propia. Deben aparecer despues de que el jugador ya entienda explorar y crear chips.

**Conceptos clave**

- Algunos hotspots son dispositivos.
- Se puede abrir consola.
- Hay comandos.
- Las respuestas son pistas o validaciones.

**Ayuda recomendada**

- Primer dispositivo abierto: "Este objetivo tiene consola propia."
- Boton claro "Conectarse a dispositivo".
- Primer comando ejecutado: feedback de sistema breve.

---

### 14. Comunicacion entre jugadores

La interfaz debe empujar a hablar sin convertirlo en una orden permanente. El canvas de red compartido refuerza la coordinacion sin que el GM tenga que mediarla.

**Conceptos clave**

- Comparar variantes.
- Compartir pistas sobre objetos descubiertos.
- Decidir objetivo conjunto.
- Coordinar fusion.
- Usar los indicadores de posicion en el canvas para guiar a companeros hacia un nodo.

**Ayuda recomendada**

- Tras primera contradiccion: "Comparad esta pista con la otra realidad."
- Durante fusion: estado A/B visible para reforzar la espera cooperativa.
- En el canvas: cuando un jugador toca el icono de otro companero, el canvas se desplaza a esa zona con una animacion suave. Esto hace que "mira, estoy aqui" se convierta en una accion digital, no solo verbal.

---

### 15. Progreso hacia objetivo final

El jugador debe sentir progreso aunque no conozca todo el puzzle.

**Conceptos clave**

- Estados de objetos.
- Modulo/panel/codigo/salida.
- Que falta por resolver.

**Ayuda recomendada**

- Estado del panel y taquillas en object cards.
- Notificaciones de progreso.
- Evitar checklist global visible desde el minuto 1; descubrir objetivos por capas.

---

## Timeline de onboarding propuesta

La timeline esta pensada para la primera partida de un jugador que no conoce el sistema. Los tiempos son orientativos; lo importante es el orden de exposicion.

| Momento | Situacion del jugador | Mecanica nueva | Tooltip / estimulo recomendado | Objetivo UX |
|---|---|---|---|---|
| 0:00 | Entra al rol y ve el escenario | Exploracion del mapa | Tooltip suave: "Explora el escenario. Acercate a zonas que reaccionen." | Evitar que toque al azar sin marco mental. |
| 0:10 | Mueve el cursor o dedo por el mapa | Deteccion de hotspots | Cursor/proximidad aumenta intensidad cerca de zonas interactivas | Ensenar que el escenario responde sin mostrar todos los hotspots. |
| 0:20 | Toca primer hotspot | Object card | Card aparece con estado resaltado y texto: "Objetivo seleccionado." | Confirmar que tocar abre informacion, no ejecuta accion. |
| 0:30 | Card abierta por primera vez | Pantalla grande vs movil | Bloque en card: "Para actuar sobre este objetivo, encuentra su puerto en el terminal movil." | Separar exploracion de accion. |
| 0:45 | Abre el terminal movil | Red de nodos — capa macro | Canvas de red aparece en zoom alejado. Tooltip: "Esta es la red del almacen. Aleja para ver las salas, acerca para ver los puertos." | Introducir el canvas como mapa interactivo, no como minimapa. |
| 1:00 | Hace zoom sobre una sala | Red de nodos — capa media | Iconos de nodo aparecen con nombre y familia. Sin tooltip extra. | Ensenar que el zoom revela informacion progresiva. |
| 1:10 | Hace zoom sobre un nodo | Puertos de red — capa micro | Aparecen 1-2 puertos con icono de tipo. Estimulo: "Toca un puerto para hackear este objetivo." | Introducir la relacion nodo-puerto. |
| 1:20 | Toca un puerto por primera vez | Tipo de puerto | Etiqueta breve del puerto seleccionado: "Puerto de informacion — Generara un chip de Inspeccion." | Que el jugador sepa que tipo de chip va a crear antes de abrir el grafo. |
| 1:25 | NodeGraph se abre | NodeGraph | Preambulo: "I inspecciona, N interactua, el pulso resolvera el chip." | Evitar que el grafo parezca arbitrario. |
| 1:30 | NodeGraph activo | Reglas de nodos | Leyenda persistente + nodos alcanzables pulsando | Guiar sin bloquear. |
| 1:40 | Toca nodo invalido | Adyacencia/no repetir | Shake corto del nodo invalido | Feedback tactil sin mensaje pesado. |
| 1:50 | Confirma o acaba timer | Resultado del chip | "Chip creado: Inspeccion/Interaccion" | Cerrar el loop de causa-efecto. |
| 2:00 | Vuelve a la red | Cola de chips | Badge "En cola" en movil + indicador en el nodo del canvas | Ensenar que no fallo: esta esperando pulso. |
| 2:20 | GM lanza o llega pulso | Pulso | Overlay: "Resolviendo chip" + animacion de senal | Convertir la espera en evento jugable. |
| 2:30 | Resultado del pulso | Feedback de consecuencia | Notificacion: "Taquillas: analisis desbloqueado" | Que sepa que el mundo cambio. |
| 2:40 | Reabre el hotspot en tablero grande | Descubrimientos progresivos | Slot desbloqueado con fade/borde verde | Ensenar que inspeccionar revela capas. |
| 3:00 | Aparece/recoge objeto | Inventario | Brillo en objeto + toast "Objeto guardado en inventario" | Introducir inventario como recompensa de exploracion. |
| 3:30 | Ve icono de otro jugador en el canvas | Posicion compartida | Estimulo: toca el icono del jugador para desplazarte a donde esta mirando | Activar coordinacion espacial sin radio. |
| 4:00 | Detecta diferencia A/B | Variantes | Microcopy tras contradiccion: "Comparad lo que veis." | Activar conversacion cooperativa. |
| 5:00 | Acumula resonancia | Resonancia | Contador brilla + "Resonancia +3" | Dar sentido al contador. |
| 6:00 | GM inicia fusion | Fusion cooperativa | Movil cambia de modo: "Sincroniza esta realidad con la otra variante." | Marcar evento especial. |
| 6:15 | Un jugador completa su parte | Espera cooperativa | "Tu parte esta lista. Esperando Variante B/A." | Evitar ansiedad o repeticion de taps. |
| 6:30 | Ambas partes completan | Consecuencia de fusion | "Fusion completada. Taquillas estabilizadas." + overlay tablero | Conectar minijuego con avance del puzzle. |
| 7:00 | Sigue explorando | Progreso objetivo | Estado actualizado en card y feedback de panel/taquillas | Mantener orientacion sin mostrar solucion completa. |

---

## Estimulos digitales por tipo

### Tooltips de primera vez

Usarlos solo en la primera aparicion de una mecanica. Deben ser cortos, con una accion esperada clara.

Ejemplos:

- "Explora el escenario. Acercate a zonas que reaccionen."
- "Esta es la red del almacen. Aleja para ver las salas, acerca para ver los puertos."
- "Puerto de informacion — Generara un chip de Inspeccion."
- "I inspecciona. N interactua. El pulso resolvera el chip."
- "Comparad esta pista con la otra realidad."

### Microcopy persistente

Textos pequenos que pueden quedarse porque definen estado actual.

Ejemplos:

- "Objetivo seleccionado."
- "Chip en cola: Inspeccion."
- "Pulso activo. Espera resolucion."
- "Tu parte esta lista. Esperando Variante B."

### Estimulos visuales

Feedback sin texto, util para guiar tactilmente.

Ejemplos:

- Cursor/proximidad a hotspots en pantalla grande.
- Glow breve al abrir primera card.
- Iconos de nodo con familia diferenciada en el canvas.
- Puertos visibles solo al hacer zoom sobre un nodo.
- Indicadores de posicion de otros jugadores en el canvas.
- Nodo alcanzable pulsando en NodeGraph.
- Shake de nodo invalido.
- Borde verde en slot desbloqueado.
- Brillo en contador de resonancia.

### Notificaciones de consecuencia

Mensajes tras pulso o evento importante. Deben responder: que objetivo cambio y que significa.

Ejemplos:

- "Taquillas: analisis desbloqueado."
- "La llave provoca una reaccion anomala."
- "Resonancia +3: contradiccion detectada."
- "Fusion completada: Taquillas estabilizadas."

---

## Recomendacion de implementacion por fases

### Fase A - Orientacion inicial

- Tooltip inicial de exploracion (pantalla grande).
- Bloque en object card que remite al terminal movil.
- Primera apertura del canvas: tooltip de orientacion de zoom.

### Fase B - Puertos y chip

- Icono diferenciado por tipo de puerto en el canvas.
- Etiqueta de tipo de puerto antes de abrir NodeGraph.
- Preambulo del primer NodeGraph.
- Leyenda persistente.
- Resultado "Chip creado".
- Notificacion tras pulso mas concreta.

### Fase C - Progreso y cooperacion

- Panel de nodos descubiertos (acceso rapido en movil).
- Indicadores de posicion de otros jugadores en el canvas.
- Animacion de slot desbloqueado en pantalla grande.
- Feedback de resonancia.
- Microcopy de comparar realidades.
- Copy de fusion con consecuencia.

### Fase D - Refinamiento

- Guardar "first seen" por mecanica en localStorage o estado de sesion.
- Ajustar tiempos de tutorial tras test real.
- Reducir ayudas que el GM observe como innecesarias.
- Sincronizar posicion del jugador en el canvas solo cuando el movil tiene foco (optimizar bateria).

---

## Riesgos UX a vigilar en test

- El jugador mira solo el tablero grande y no abre el terminal movil.
- El jugador confunde el canvas de red con un minimapa del escenario fisico y busca correspondencia exacta de posiciones.
- El jugador no entiende que tiene que hacer zoom para ver los puertos (queda en capa macro sin avanzar).
- El jugador cree que tocar un nodo (no un puerto) ejecuta una accion.
- El jugador cree que el chip deberia resolverse instantaneamente.
- El NodeGraph se percibe como minijuego aleatorio, no como generador de tipo de accion basado en el puerto elegido.
- La fusion se celebra pero no se entiende que objeto cambio ni como.
- Los indicadores de posicion de otros jugadores se leen como decoracion y no se interactua con ellos.
- El GM tiene que explicar demasiadas veces el mismo paso.

---

## Criterios de exito

- Un jugador nuevo puede abrir un hotspot en pantalla grande, navegar al nodo correspondiente en el canvas, seleccionar un puerto y crear un chip en menos de 90 segundos sin explicacion oral del GM.
- La distincion entre PORT_INFO y PORT_MECH es comprensible a partir del icono del puerto, sin leer texto de ayuda.
- Tras el primer pulso, el jugador sabe que el mundo puede cambiar y donde mirar (tablero grande + notificacion).
- Al menos un jugador por grupo usa el indicador de posicion de un companero para coordinar sin radio.
- La primera fusion se entiende como cooperativa y deja clara su consecuencia.
- El GM interviene para dirigir ritmo y narrativa, no para explicar controles basicos.
