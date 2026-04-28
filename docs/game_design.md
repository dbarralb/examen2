# Game Design Document — El Examen II

> Estado: **Blank slate** — framework listo, contenido narrativo pendiente de redacción.

---

## Concepto

**El Examen II** es un juego de escape room narrativo cooperativo para 4 jugadores + 1 GM.

Los jugadores son estudiantes del Instituto Newton, cada uno con una personalidad y habilidades distintas. Viven una aventura que sucede en el mismo escenario, pero cada jugador existe en una **realidad paralela** de ese lugar.

---

## Estructura de la aventura

### Escenarios

Un escenario es un lugar físico del instituto (pasillo, almacén, laboratorio, etc.).
Cada escenario tiene hasta **4 variantes** (A, B, C, D) — versiones paralelas del mismo lugar.

El GM decide qué variante ve cada jugador. Por ejemplo:
- Jugadores A + B ven el "Almacén A" (realidad calmada, luces encendidas)
- Jugadores C + D ven el "Almacén B" (realidad alterada, algo ha pasado aquí)

Los jugadores pueden descubrir que no todos están en el mismo sitio durante el pulso.

---

## Los 4 jugadores

| Rol | Descripción | Cartas |
|---|---|---|
| **El Empollón** | Analítico, metódico. Sabe cómo funcionan los sistemas. | mirar_bien, consultar_apuntes |
| **La Manitas** | Práctica, ingeniosa. Arregla y rompe cosas. | apanar, puenteo_rapido, desmontar |
| **El Guaperas** | Directo, impulsivo. Usa la fuerza. | a_lo_bestia, empujar |
| **La Mística** | Intuitiva, observadora. Percibe lo que otros no ven. | y_si, esto_vibra_raro, ritual_improvisado |

---

## Game loop

```
1. Ver el escenario (tablero paneable con fondo de variante)
2. Hacer clic en un hotspot → ver la tarjeta del elemento
3. Elegir una carta de acción y arrastrarla al hotspot
4. Completar el minijuego de carga
5. Acción encolada → esperar pulso del GM
6. GM inicia pulso → acciones se resuelven con resultado visible
7. El tablero refleja los cambios → volver al paso 2
```

---

## Hotspots y tarjetas de elemento

Cada tablero tiene **3 hotspots**. Cada hotspot pertenece a una **familia**:

| Familia | Descripción |
|---|---|
| Acceso | Entradas, salidas, puertas |
| Contenedor | Cajas, muebles, mochilas |
| Dispositivo | Electrónica, paneles |
| Información | Notas, carteles, documentos |
| Objeto | Elementos físicos sueltos |
| Sensor | Cámaras, detectores |

Al hacer clic en un hotspot, el jugador ve la **tarjeta de elemento** (blank hasta que el escenario se diseñe):
- Nombre del elemento
- Familia
- Descripción narrativa
- Acciones disponibles según el rol

---

## Sistema de alarma

Compartida entre todos los jugadores. Escala de 0 a 3:

| Nivel | Estado | Consecuencias |
|---|---|---|
| 0 | Normal | Sin restricciones |
| 1 | Sospecha | Tensión creciente |
| 2 | Alarma | El GM activa efectos (luz roja, bloqueos) |
| 3 | Contención | Salida bloqueada, interferencia máxima |

El ruido se acumula con acciones fallidas o ruidosas. El GM decide cuándo y cómo reaccionar narrativamente.

---

## Sistema de pulso

El **pulso** es el momento en que las acciones encoladas se resuelven. El GM lo inicia manualmente.

**Arquitectura futura**: El pulso pasará a ser una **ventana de visibilidad** — durante el pulso, los jugadores podrán ver los tableros de los demás durante unos segundos. Esto crea el momento de coordinación narrativa entre realidades paralelas.

---

## Inventario

Cada jugador tiene:
- **3 slots** en la barra de inventario (siempre visibles)
- Los items se recogen de hotspots de tipo contenedor
- Los items pueden usarse como parte de una acción (arrastrar item + carta)

---

## Lo que falta definir (pendiente de guion)

- [ ] Nombre y descripción de cada escenario
- [ ] Contenido de las 4 variantes por escenario
- [ ] Qué hay en cada hotspot por variante
- [ ] Qué items existen y dónde
- [ ] Lógica de resolución de acciones (gameRules.js → resolveActionWithResult)
- [ ] Flags de progreso y condición de victoria
- [ ] Arte de fondos por variante
- [ ] Texto narrativo de tarjetas de elemento
- [ ] Conexión entre realidades paralelas (qué sabe un jugador del otro)
