# Lógica programable — Gimnasio (MVP)

Perfecto. Vamos a convertir el gimnasio en **lógica programable real**, simplificada para MVP.

La idea base es esta:

- cada objeto tiene **estados**
- cada carta dispara una **intención**
- al ejecutarse la cola, el sistema evalúa **condiciones**
- según esas condiciones, cambia estados y emite feedback

No voy a meter arquitectura pesada. Te lo dejo como sistema de reglas claro.

---

# Resumen muy corto del escenario

**Sala:** Gimnasio  
**Objetivo:** salir por la puerta de emergencia  
**Bloqueos:** panel digital, sensor, cerradura física  
**Óptima:** El Empollón interpreta, La Manitas prepara, La Mística engaña el sensor y El guaperas remata la apertura limpia.  
**Malas pero válidas:** romper, puentear o improvisar sin preparación; avanzan, pero con pérdida narrativa o consecuencias.

---

# 1. Estados del escenario

## Variables globales

```ts
doorState: "closed" | "forced_open" | "clean_open"
panelState: "active" | "understood" | "tampered"
sensorState: "active" | "fooled" | "disabled"
lockerState: "closed" | "broken_open" | "clean_open"
noteState: "hidden" | "partial" | "complete"
alarmState: "off" | "on"
loreFlagTestRevealed: boolean
hiddenRouteFlag: boolean
```

## Estado inicial

```ts
doorState = "closed"
panelState = "active"
sensorState = "active"
lockerState = "closed"
noteState = "hidden"
alarmState = "off"
loreFlagTestRevealed = false
hiddenRouteFlag = false
```

---

# 2. Acciones del MVP en esta sala

Cada acción en cola necesita:

```ts
type QueuedAction = {
  playerId: string
  role: "empollon" | "manitas" | "bruto" | "mistica"
  cardId: string
  targetId: string
}
```

Targets válidos en el gimnasio:

```ts
type TargetId =
  | "panel"
  | "sensor"
  | "door"
  | "locker"
  | "note"
  | "electrical_box"
  | "sports_gear"
```

Cartas relevantes aquí:

```ts
El Empollón:
- mirar_bien
- consultar_apuntes

La Manitas:
- apañar
- puenteo_rapido
- desmontar

El guaperas:
- a_lo_bestia
- empujar

La Mística:
- y_si
- esto_vibra_raro
- ritual_improvisado
```

---

# 3. Regla general de resolución por pulso

En cada anomalía:

1. leer cola en orden
2. aplicar acciones una a una
3. cada acción puede:
   - cambiar estados
   - crear flags temporales
   - producir feedback visible
4. al final del pulso:
   - revisar condiciones de alarma
   - revisar si la puerta puede abrirse
   - revisar si se desbloquea contenido narrativo

---

# 4. Flags temporales por pulso

Estas flags no son estados permanentes del escenario, sino “preparaciones” para este ciclo o para los siguientes.

```ts
panelHintKnown: boolean
lockerPrepared: boolean
doorPrepared: boolean
sensorPatternDetected: boolean
sensorTrickedThisPulse: boolean
```

Inicialmente:

```ts
panelHintKnown = false
lockerPrepared = false
doorPrepared = false
sensorPatternDetected = false
sensorTrickedThisPulse = false
```

---

# 5. Reglas if/then reales por objeto

## A. Panel digital

### El Empollón -> mirar_bien -> panel

```ts
IF action.cardId === "mirar_bien" AND action.targetId === "panel"
THEN
  panelState = "understood"
  panelHintKnown = true
  emit("El Empollón interpreta el protocolo 7-B: cierre por intrusión con evaluación activa.")
```

### El Empollón -> consultar_apuntes -> panel

```ts
IF action.cardId === "consultar_apuntes" AND action.targetId === "panel"
THEN
  panelState = "understood"
  panelHintKnown = true
  emit("Los apuntes revelan que el sistema combina bloqueo digital con redundancia física.")
```

### La Manitas -> puenteo_rapido -> panel

```ts
IF action.cardId === "puenteo_rapido" AND action.targetId === "panel"
THEN
  panelState = "tampered"
  emit("La Manitas fuerza un bypass temporal del panel.")

  IF panelState was not "understood" before resolution
  THEN
    alarmState = "on"
    emit("El bypass activa una alerta secundaria por manipulación insegura.")
```

---

## B. Taquilla

### El guaperas -> a_lo_bestia -> locker

```ts
IF action.cardId === "a_lo_bestia" AND action.targetId === "locker"
THEN
  IF lockerPrepared === true
  THEN
    lockerState = "clean_open"
    noteState = "complete"
    emit("La taquilla se abre sin destrozar el contenido.")
  ELSE
    lockerState = "broken_open"
    noteState = "partial"
    emit("La taquilla se revienta. La nota aparece rota.")
```

### La Manitas -> apañar -> locker

```ts
IF action.cardId === "apañar" AND action.targetId === "locker"
THEN
  lockerPrepared = true
  emit("La Manitas afloja la cerradura de la taquilla.")
```

### La Mística -> y_si -> locker

```ts
IF action.cardId === "y_si" AND action.targetId === "locker"
THEN
  lockerState = "clean_open"
  noteState = "complete"
  emit("La Mística prueba una secuencia absurda de golpecitos y la taquilla cede.")
```

### Nota revelada

```ts
IF noteState === "complete"
THEN
  loreFlagTestRevealed = true
  emit("La nota completa revela que la prueba evalúa cómo colaboráis.")

IF noteState === "partial"
THEN
  emit("Solo se puede leer un fragmento: '...no todos... elegidos...'")
```

---

## C. Sensor

### La Mística -> esto_vibra_raro -> sensor

```ts
IF action.cardId === "esto_vibra_raro" AND action.targetId === "sensor"
THEN
  sensorPatternDetected = true
  emit("La Mística detecta que el sensor responde a un patrón extraño.")
```

### La Mística -> y_si -> sensor

```ts
IF action.cardId === "y_si" AND action.targetId === "sensor"
THEN
  IF sensorPatternDetected === true
  THEN
    sensorState = "fooled"
    sensorTrickedThisPulse = true
    emit("La Mística engaña el sensor con una interacción absurda pero efectiva.")
  ELSE
    emit("La Mística prueba algo raro, pero el sensor no cae tan fácil.")
```

### La Manitas -> desmontar -> sensor

```ts
IF action.cardId === "desmontar" AND action.targetId === "sensor"
THEN
  sensorState = "disabled"
  emit("La Manitas abre la carcasa del sensor y lo inutiliza.")
```

---

## D. Puerta

### El Empollón -> mirar_bien -> door

```ts
IF action.cardId === "mirar_bien" AND action.targetId === "door"
THEN
  doorPrepared = true
  emit("El Empollón detecta cómo empujar la puerta sin forzar el mecanismo principal.")
```

### El guaperas -> empujar -> door

```ts
IF action.cardId === "empujar" AND action.targetId === "door"
THEN
  IF panelState IN ["understood", "tampered"]
     AND sensorState IN ["fooled", "disabled"]
     AND doorPrepared === true
  THEN
     doorState = "clean_open"
     emit("La puerta se abre limpiamente.")
  ELSE IF sensorState IN ["fooled", "disabled"]
  THEN
     doorState = "forced_open"
     emit("La puerta cede, pero el sistema detecta una apertura brusca.")
  ELSE
     doorState = "forced_open"
     alarmState = "on"
     emit("La puerta se fuerza y salta la alarma.")
```

### El guaperas -> a_lo_bestia -> door

```ts
IF action.cardId === "a_lo_bestia" AND action.targetId === "door"
THEN
  doorState = "forced_open"
  emit("El guaperas revienta la salida de emergencia.")

  IF sensorState === "active" OR panelState === "active"
  THEN
    alarmState = "on"
    emit("La alarma del gimnasio se activa.")
```

---

# 6. Condición de resolución óptima

La salida óptima sucede si, antes de abrir la puerta:

```ts
panelState IN ["understood", "tampered"]
AND sensorState IN ["fooled", "disabled"]
AND doorPrepared === true
AND doorState becomes "clean_open"
```

Consecuencias:

```ts
IF doorState === "clean_open"
THEN
  emit("Habéis salido sin destrozar la sala.")

  IF loreFlagTestRevealed === true
  THEN
    hiddenRouteFlag = true
    emit("Se desbloquea una pista oculta hacia la verdadera prueba.")
```

---

# 7. Resoluciones posibles

## Resolución rápida y mala

```ts
IF El guaperas uses "a_lo_bestia" on "door"
AND panelState === "active"
THEN
  doorState = "forced_open"
  alarmState = "on"
```

Resultado:
- avanzan
- sin pista oculta
- con alarma
- el GM puede reforzar que “han salido, pero algo no encaja”

## Resolución parcial

```ts
IF sensorState !== "active"
AND El guaperas uses "empujar" on "door"
BUT doorPrepared === false
THEN
  doorState = "forced_open"
```

Resultado:
- avanzan
- menos elegante
- posiblemente sin contenido oculto

## Resolución óptima

```ts
IF panel understood/tampered
AND sensor fooled/disabled
AND doorPrepared
AND El guaperas pushes door
THEN
  doorState = "clean_open"
  hiddenRouteFlag = true if full note was found
```

---

# 8. Pseudocódigo global del pulso

```ts
function resolveActionPulse(queue: QueuedAction[], gameState: GameState) {
  resetPulseFlags()

  for (const action of queue) {
    resolveAction(action, gameState)
  }

  resolveNarrativeConsequences(gameState)
  resolveExitOutcome(gameState)
  clearQueue()
}
```

## Resolver acción

```ts
function resolveAction(action, gameState) {
  if (action.cardId === "mirar_bien" && action.targetId === "panel") {
    gameState.panelState = "understood"
    gameState.panelHintKnown = true
    emit("El Empollón interpreta el panel.")
    return
  }

  if (action.cardId === "apañar" && action.targetId === "locker") {
    gameState.lockerPrepared = true
    emit("La Manitas prepara la taquilla.")
    return
  }

  if (action.cardId === "a_lo_bestia" && action.targetId === "locker") {
    if (gameState.lockerPrepared) {
      gameState.lockerState = "clean_open"
      gameState.noteState = "complete"
    } else {
      gameState.lockerState = "broken_open"
      gameState.noteState = "partial"
    }
    return
  }

  // resto de reglas...
}
```

---

# 9. Qué necesita programarse de verdad

Para un MVP funcional, cada acción debería devolver una estructura como esta:

```ts
type ActionResult = {
  success: boolean
  stateChanges: Array<{ key: string; from: any; to: any }>
  messages: string[]
  animations: string[]
  sfx: string[]
}
```

Ejemplo:

```ts
{
  success: true,
  stateChanges: [
    { key: "lockerState", from: "closed", to: "broken_open" },
    { key: "noteState", from: "hidden", to: "partial" }
  ],
  messages: [
    "Marcos usa A lo bestia sobre la taquilla.",
    "La taquilla se abre de golpe.",
    "La nota aparece rota."
  ],
  animations: ["shake_locker", "paper_scatter"],
  sfx: ["metal_hit", "paper_rip"]
}
```

Esto te viene muy bien para:
- UI compartida
- historial de ejecución
- replay visual del pulso
- chat del sistema

---

# 10. Mi recomendación práctica

Para el prototipo, no intentes hacer un motor genérico aún. Haz esto:

- 1 sala
- 6 o 8 reglas duras
- estados explícitos en JSON
- resolución por `if/then`
- logs visibles en pantalla

Eso te permite validar rápido si:
- la cola se entiende
- las sinergias funcionan
- la gente recuerda lo que ha pasado

---

# 11. JSON de diseño listo para pasar a código

```json
{
  "sceneId": "gym_mvp",
  "name": "Gimnasio",
  "goal": "Abrir la salida de emergencia",
  "initialState": {
    "doorState": "closed",
    "panelState": "active",
    "sensorState": "active",
    "lockerState": "closed",
    "noteState": "hidden",
    "alarmState": "off",
    "loreFlagTestRevealed": false,
    "hiddenRouteFlag": false
  },
  "pulseFlags": {
    "panelHintKnown": false,
    "lockerPrepared": false,
    "doorPrepared": false,
    "sensorPatternDetected": false,
    "sensorTrickedThisPulse": false
  },
  "targets": [
    "panel",
    "sensor",
    "door",
    "locker",
    "note",
    "electrical_box",
    "sports_gear"
  ],
  "rules": [
    {
      "id": "panel_empollon_mirar_bien",
      "when": { "cardId": "mirar_bien", "targetId": "panel" },
      "effects": [
        { "set": "panelState", "to": "understood" },
        { "set": "panelHintKnown", "to": true }
      ],
      "messages": [
        "El Empollón interpreta el protocolo 7-B: cierre por intrusión con evaluación activa."
      ]
    },
    {
      "id": "panel_empollon_consultar_apuntes",
      "when": { "cardId": "consultar_apuntes", "targetId": "panel" },
      "effects": [
        { "set": "panelState", "to": "understood" },
        { "set": "panelHintKnown", "to": true }
      ],
      "messages": [
        "Los apuntes revelan que el sistema combina bloqueo digital con redundancia física."
      ]
    },
    {
      "id": "panel_manitas_puenteo_rapido",
      "when": { "cardId": "puenteo_rapido", "targetId": "panel" },
      "effects": [
        { "set": "panelState", "to": "tampered" }
      ],
      "messages": [
        "La Manitas fuerza un bypass temporal del panel."
      ],
      "conditionalEffects": [
        {
          "if": { "panelStateWasNot": "understood" },
          "effects": [
            { "set": "alarmState", "to": "on" }
          ],
          "messages": [
            "El bypass activa una alerta secundaria por manipulación insegura."
          ]
        }
      ]
    },
    {
      "id": "locker_manitas_apanar",
      "when": { "cardId": "apañar", "targetId": "locker" },
      "effects": [
        { "set": "lockerPrepared", "to": true }
      ],
      "messages": [
        "La Manitas afloja la cerradura de la taquilla."
      ]
    },
    {
      "id": "locker_bruto_a_lo_bestia",
      "when": { "cardId": "a_lo_bestia", "targetId": "locker" },
      "conditionalEffects": [
        {
          "if": { "lockerPrepared": true },
          "effects": [
            { "set": "lockerState", "to": "clean_open" },
            { "set": "noteState", "to": "complete" }
          ],
          "messages": [
            "La taquilla se abre sin destrozar el contenido."
          ]
        },
        {
          "else": true,
          "effects": [
            { "set": "lockerState", "to": "broken_open" },
            { "set": "noteState", "to": "partial" }
          ],
          "messages": [
            "La taquilla se revienta. La nota aparece rota."
          ]
        }
      ]
    },
    {
      "id": "locker_mistica_y_si",
      "when": { "cardId": "y_si", "targetId": "locker" },
      "effects": [
        { "set": "lockerState", "to": "clean_open" },
        { "set": "noteState", "to": "complete" }
      ],
      "messages": [
        "La Mística prueba una secuencia absurda de golpecitos y la taquilla cede."
      ]
    },
    {
      "id": "note_complete_reveal",
      "whenState": { "noteState": "complete" },
      "effects": [
        { "set": "loreFlagTestRevealed", "to": true }
      ],
      "messages": [
        "La nota completa revela que la prueba evalúa cómo colaboráis."
      ]
    },
    {
      "id": "note_partial_reveal",
      "whenState": { "noteState": "partial" },
      "messages": [
        "Solo se puede leer un fragmento: '...no todos... elegidos...'"
      ]
    },
    {
      "id": "sensor_mistica_vibra_raro",
      "when": { "cardId": "esto_vibra_raro", "targetId": "sensor" },
      "effects": [
        { "set": "sensorPatternDetected", "to": true }
      ],
      "messages": [
        "La Mística detecta que el sensor responde a un patrón extraño."
      ]
    },
    {
      "id": "sensor_mistica_y_si",
      "when": { "cardId": "y_si", "targetId": "sensor" },
      "conditionalEffects": [
        {
          "if": { "sensorPatternDetected": true },
          "effects": [
            { "set": "sensorState", "to": "fooled" },
            { "set": "sensorTrickedThisPulse", "to": true }
          ],
          "messages": [
            "La Mística engaña el sensor con una interacción absurda pero efectiva."
          ]
        },
        {
          "else": true,
          "messages": [
            "La Mística prueba algo raro, pero el sensor no cae tan fácil."
          ]
        }
      ]
    },
    {
      "id": "sensor_manitas_desmontar",
      "when": { "cardId": "desmontar", "targetId": "sensor" },
      "effects": [
        { "set": "sensorState", "to": "disabled" }
      ],
      "messages": [
        "La Manitas abre la carcasa del sensor y lo inutiliza."
      ]
    },
    {
      "id": "door_empollon_mirar_bien",
      "when": { "cardId": "mirar_bien", "targetId": "door" },
      "effects": [
        { "set": "doorPrepared", "to": true }
      ],
      "messages": [
        "El Empollón detecta cómo empujar la puerta sin forzar el mecanismo principal."
      ]
    },
    {
      "id": "door_bruto_empujar",
      "when": { "cardId": "empujar", "targetId": "door" },
      "conditionalEffects": [
        {
          "if": {
            "panelStateIn": ["understood", "tampered"],
            "sensorStateIn": ["fooled", "disabled"],
            "doorPrepared": true
          },
          "effects": [
            { "set": "doorState", "to": "clean_open" }
          ],
          "messages": [
            "La puerta se abre limpiamente."
          ]
        },
        {
          "if": {
            "sensorStateIn": ["fooled", "disabled"]
          },
          "effects": [
            { "set": "doorState", "to": "forced_open" }
          ],
          "messages": [
            "La puerta cede, pero el sistema detecta una apertura brusca."
          ]
        },
        {
          "else": true,
          "effects": [
            { "set": "doorState", "to": "forced_open" },
            { "set": "alarmState", "to": "on" }
          ],
          "messages": [
            "La puerta se fuerza y salta la alarma."
          ]
        }
      ]
    },
    {
      "id": "door_bruto_a_lo_bestia",
      "when": { "cardId": "a_lo_bestia", "targetId": "door" },
      "effects": [
        { "set": "doorState", "to": "forced_open" }
      ],
      "messages": [
        "El guaperas revienta la salida de emergencia."
      ],
      "conditionalEffects": [
        {
          "if": {
            "anyOf": [
              { "sensorState": "active" },
              { "panelState": "active" }
            ]
          },
          "effects": [
            { "set": "alarmState", "to": "on" }
          ],
          "messages": [
            "La alarma del gimnasio se activa."
          ]
        }
      ]
    }
  ],
  "optimalOutcome": {
    "if": {
      "doorState": "clean_open",
      "panelStateIn": ["understood", "tampered"],
      "sensorStateIn": ["fooled", "disabled"],
      "doorPrepared": true
    },
    "messages": [
      "Habéis salido sin destrozar la sala."
    ],
    "conditionalEffects": [
      {
        "if": { "loreFlagTestRevealed": true },
        "effects": [
          { "set": "hiddenRouteFlag", "to": true }
        ],
        "messages": [
          "Se desbloquea una pista oculta hacia la verdadera prueba."
        ]
      }
    ]
  }
}
```
