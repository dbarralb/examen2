# ResonanceBalance — Guía de referencia del sistema de resonancia

Documento generado tras la sesión de análisis y rebalanceo (2026-05-08).
Cubre todos los archivos relevantes, las mecánicas internas y las conclusiones de diseño.

---

## Archivos clave

### Modificados en esta sesión

| Archivo | Qué contiene | Cambio realizado |
|---------|-------------|-----------------|
| `src/data/GameBalance.js` | Constante de referencia del coste de fusión | `FUSION.lockerFusionResonanceCost: 6 → 8` |
| `src/data/scenarioContent.js` | Constante de runtime usada en todo el código | `RESONANCE_COSTS.LOCKER_FUSION: 6 → 8` |
| `src/screens/PlayerScreen.jsx` | Lógica de spawns, recolección y feedback visual | Añadido `clientResonanceGrantRef`; extendido `useEffect` de resonanceValue; feedback `+1` en orbes; guard anti-doble en balones |

### Solo consultados

| Archivo | Qué contiene relevante |
|---------|----------------------|
| `src/services/gameRules.js` | `canFuseLocker()` — comprueba `sharedResonance.value >= RESONANCE_COSTS.LOCKER_FUSION` |
| `src/components/FusionMinigame.jsx` | Gasta `RESONANCE_COSTS.LOCKER_FUSION` de `sharedResonance` al completar la fusión |
| `src/components/ActionQueueOverlay.jsx` | Renderiza el contador `Resonancia N` con animación `+amount` cuando `resonanceRewardFeedback` no es null |
| `src/components/SceneMap.jsx` | Renderiza la animación en la carta del hotspot cuando `resonanceRewardFeedback.targetId === target.id` |

---

## Arquitectura del pool de resonancia

La resonancia es un **pool compartido global** (`gameState.sharedResonance`) con tres campos:

```
sharedResonance: {
  value:       number,   // resonancia disponible actualmente
  spent:       number,   // resonancia ya gastada (histórico)
  discoveries: { [discoveryId]: true }  // evita conceder el mismo bonus dos veces
}
```

Hay stubs de compatibilidad (`resonanceByVariant`, `resonance`) que migran al pool compartido si el estado viene de una versión antigua. No escribir a esos campos en código nuevo.

### Funciones internas en `scenarioContent.js`

| Función | Comportamiento |
|---------|---------------|
| `ensureSharedResonance(gameState)` | Inicializa o migra el pool; siempre llamar antes de leer/escribir |
| `addSharedResonanceOnce(gameState, discoveryId, amount)` | Suma `amount` una sola vez; ignora si `discoveryId` ya está en `discoveries` |
| `addSharedResonance(gameState, amount)` | Suma sin guard de unicidad |
| `consumeSharedResonance(gameState, amount)` | Resta si hay saldo suficiente; devuelve `false` si no |
| `addVariantResonanceOnce(gameState, _variant, discoveryId, amount)` | **Stub** — redirige a `addSharedResonanceOnce`; `_variant` se ignora |

> **Importante:** las claves de discovery incluyen la variante en su nombre (ej. `contradiction_balls_count_A`). Aunque el pool es compartido, dos jugadores en variantes distintas pueden activar el mismo tipo de contradicción y cada uno aporta resonancia independiente.

---

## Fuentes de resonancia y sus cantidades

### Ganancias por discoveries (una vez por clave, vía pulso)

| Target | discoveryId | Cantidad | Trigger |
|--------|------------|---------|---------|
| `balones` | `contradiction_balls_count_${variant}` | **+3** | Inspección (acción en pulso) |
| `taquillas` | `contradiction_locker_mechanism_${variant}` | **+3** | Slot 0 desbloqueado en inspección |
| `llave_taquilla` | `inspection_llave_taquilla_${variant}` | **+2** | Slot 0 desbloqueado en inspección |
| `horquilla` | `inspection_horquilla_${variant}` | **+2** | Slot 0 desbloqueado en inspección |
| `caja` | `contradiction_box_duplicate_${variant}` | **+2** | Inspección (acción en pulso) |

Con 2 jugadores en **variantes distintas** (A y B), cada fila puede aportarse dos veces (una por variante).
Con 2 jugadores en la **misma variante**, cada fila solo puede aportarse una vez.

### Ganancia por apertura directa de hotspot (client-side, sin pulso)

| Acción | Cantidad | Código |
|--------|---------|--------|
| Abrir hotspot `balones` en el mapa | **+3** | `grantBalonesOpenResonance()` en `PlayerScreen.jsx` |

Esta ganancia usa `RESONANCE_BALLS_DISCOVERY_ID = "hotspot_open_balones"` como guard en `sharedResonance.discoveries`.

### Ganancia por orbes ambientales

| Parámetro | Valor | Dónde se configura |
|-----------|-------|--------------------|
| Resonancia por orbe | **+1** | Hardcoded en `collectAmbientResonance()` |
| Tiempo entre spawns (resonancia > 0) | 25–40 s | `RESONANCE.spawnMinMs / spawnMaxMs` en `GameBalance.js` |
| Tiempo entre spawns (resonancia = 0) | 12.5–20 s | Mismo, dividido por 2 cuando `resonanceValue === 0` |
| Tiempo visible del orbe | 8 s | `RESONANCE.spawnVisibleMs` en `GameBalance.js` |
| Hover para recoger | 500 ms | `RESONANCE.collectHoverMs` en `GameBalance.js` |

Los orbes son **locales por pantalla** (`window.setTimeout` en cada `PlayerScreen`). Con 2 jugadores, cada uno genera y recoge sus propios orbes en paralelo.

---

## Coste de apertura de la taquilla

| Constante | Archivo | Valor actual |
|-----------|---------|-------------|
| `RESONANCE_COSTS.LOCKER_FUSION` | `src/data/scenarioContent.js:21` | **8** |
| `FUSION.lockerFusionResonanceCost` | `src/data/GameBalance.js:61` | **8** (referencia, no importada en runtime) |

> Para cambiar el coste, actualizar **ambos** archivos. El runtime usa `scenarioContent.js`; `GameBalance.js` es la referencia de diseño.

---

## Análisis de tiempos — 2 jugadores misma variante

### Ruta 1: Solo orbes desde cero

| | Mejor caso (25 s/orbe × 2 jugadores) | Medio (32.5 s) | Peor caso (40 s) |
|---|---|---|---|
| 8 orbes, 2 jugadores | ~50 s por par → **~200 s total** | **~260 s** | **~320 s** |
| Con bono resonancia=0 (primeros orbes) | Los 2 primeros pares en 12.5–20 s c/u | — | — |
| **Estimado real** | **~3–4 min** | — | — |

### Ruta 2: Balones (client) + orbes

| Fase | Resonancia obtenida | Tiempo |
|------|-------------------|--------|
| Abrir hotspot balones | +3 | Inmediato |
| Inspección balones (pulso) | +3 (si no se ha abierto el hotspot primero, o 0 si ya se usó el mismo discoveryId) | 40 s–2 min |
| Orbes hasta 8 (desde 3) | +5 orbes = 5 pulsos de spawn | ~3–4 min (1 jugador) / ~1.5–2 min (2 jugadores) |

### Ruta 3: Discoveries por pulso (óptima)

Con ambas variantes (A y B), las discoveries acumulables son:

| Discovery | Variante A | Variante B | Total |
|-----------|-----------|-----------|-------|
| Balones hotspot | +3 | +3 | +6 |
| Balones pulso | +3 | +3 | +6 |
| Taquillas | +3 | +3 | +6 |
| Llave taquilla | +2 | +2 | +4 |
| Horquilla | +2 | +2 | +4 |
| Caja | +2 | +2 | +4 |
| **Máximo posible sin orbes** | | | **+30** |

Con una sola variante, el máximo sin orbes es la mitad de cada fila (excepto "balones hotspot" que es por jugador, no por variante, y puede ser reclamada por el primer jugador que abra el hotspot).

### Veredicto de diseño con coste = 8

| Escenario | Tiempo estimado |
|-----------|----------------|
| 2 jugadores, misma variante, solo orbes | 3–4 min |
| 2 jugadores, misma variante, balones + orbes | ~2 min |
| 2 jugadores, misma variante, balones + taquillas (1–2 pulsos) | 1–4 min |
| 2 jugadores, variantes distintas, discoveries bien coordinadas | Puede alcanzar 8 sin orbes en 2–3 pulsos |

El coste de 8 hace que los orbes solos sean un camino lento (~3–4 min) y que los jugadores necesiten combinar al menos dos discoveries o usar los orbes como complemento.

---

## Sistema de feedback visual

### Cómo funciona `resonanceRewardFeedback`

```js
// Estructura del objeto
{ id: Date.now(), targetId: string | null, amount: number }
```

- `ActionQueueOverlay` muestra `+amount` junto al contador de resonancia (siempre, con cualquier objeto).
- `SceneMap` muestra la animación `scene-object-resonance-reward` en la carta del hotspot **solo** cuando `resonanceRewardFeedback.targetId === target.id`.

### Qué activa el feedback en cada vía

| Vía | Quién activa | targetId | Animación en carta |
|-----|-------------|---------|-------------------|
| Abrir hotspot balones | `grantBalonesOpenResonance()` | `"balones"` | Sí, en la carta de balones |
| Recoger orbe | `collectAmbientResonance()` | `null` | No (solo contador) |
| Discoveries de pulso | `useEffect` en `resonanceValue` | `null` | No (solo contador) |

### Guard anti-doble (`clientResonanceGrantRef`)

`clientResonanceGrantRef` (ref de PlayerScreen) acumula la resonancia que el cliente ya ha escrito directamente a Firebase (balones y orbes). Cuando el `useEffect` detecta que `resonanceValue` sube (por propagación de Firebase), resta la porción client-side y solo muestra el feedback si queda un excedente de pulso. Esto evita que el mismo incremento dispare la animación dos veces.

```
totalGained   = resonanceValue - previousValue
clientPortion = min(clientResonanceGrantRef.current, totalGained)
clientResonanceGrantRef.current -= clientPortion
pulseGained   = totalGained - clientPortion
if (pulseGained > 0) → mostrar resonanceRewardFeedback
```

---

## Lista de constantes de resonancia en `GameBalance.js`

| Constante | Sección | Valor | Notas |
|-----------|---------|-------|-------|
| `FUSION.lockerFusionResonanceCost` | FUSION | **8** | Referencia de diseño; el runtime usa `scenarioContent.js` |
| `RESONANCE.spawnVisibleMs` | RESONANCE | 8 000 ms | Ventana para recoger el orbe |
| `RESONANCE.spawnMinMs` | RESONANCE | 25 000 ms | Mínimo entre spawns (se divide por 2 si resonancia=0) |
| `RESONANCE.spawnMaxMs` | RESONANCE | 40 000 ms | Máximo entre spawns (se divide por 2 si resonancia=0) |
| `RESONANCE.collectHoverMs` | RESONANCE | 500 ms | Hover para recoger |
| `RESONANCE.collectFeedbackMs` | RESONANCE | 1 500 ms | Feedback tras recoger |
| `RESONANCE.tooltipActiveMs` | RESONANCE | 7 000 ms | Duración del tooltip de ganancia |
| `RESONANCE.rewardFeedbackMs` | RESONANCE | 2 000 ms | Duración del reward animado (nota: el código usa 3 400 ms hardcoded) |

> La discrepancia en `rewardFeedbackMs` (2 000 ms en GameBalance vs 3 400 ms en el código) es un debt técnico pendiente. El valor real en producción es 3 400 ms.
