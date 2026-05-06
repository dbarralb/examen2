# Indice de documentacion - El Examen II

**Ultima actualizacion:** 2026-05-05  
**Entrada recomendada:** `docs/PROJECT_STATUS.md`

Este indice resume que documentacion existe, para que sirve y donde buscar cada tipo de respuesta. Los documentos de la raiz de `docs/` son la referencia activa. `docs/OLD/` es archivo historico: util para recuperar ideas, pero no debe tomarse como estado actual sin contrastarlo con codigo y `PROJECT_STATUS.md`.

---

## 1. Estado activo del proyecto

### `docs/PROJECT_STATUS.md`

**Uso principal:** saber en que punto esta el proyecto antes de tocar codigo o diseno.

**Organizacion:**

- Estado actual: define la rama activa, el nivel activo y el marco general.
- Que esta listo: checklist de funcionalidades ya integradas.
- Pendiente: backlog corto de deudas y trabajo proximo.
- Archivos clave: tabla de modulos donde editar cada parte.

**Buscar aqui cuando necesites:**

- Confirmar si React oficial y el nivel `almacen` siguen siendo la base.
- Ver si una funcionalidad ya se considera lista.
- Orientarte hacia los archivos principales antes de implementar.
- Revisar deuda inmediata: arte, puzzle, pulso, textos, Firebase.

---

## 2. Arquitectura tecnica

### `docs/architecture.md`

**Uso principal:** entender como se organiza la app React y el estado compartido.

**Organizacion:**

- Stack: React/Vite, Firebase, polling, routing por query params.
- Escenarios y contenido: separa `scenarioData`, `scenarioContent` y `gameRules`.
- Estado inicial: variantes A/B por rol y escenario activo.
- Firebase: mapa de rutas remotas (`session`, `gameState`, `pulseState`, `hotspotOverrides`, etc.).
- Flujo de turno: de lobby a acciones, pulso y resolucion.
- Archivos clave: responsabilidades por modulo.
- Archivado: recuerda que lo antiguo vive en `docs/OLD`.

**Buscar aqui cuando necesites:**

- Saber que ruta Firebase guarda cada dato.
- Entender como entran escenarios, variantes y hotspots.
- Revisar el flujo de acciones y pulso.
- Localizar que servicio o componente deberia cambiarse.

---

## 3. Diseno de juego activo

### `docs/game_design.md`

**Uso principal:** mantener coherencia ludica y narrativa del Nivel 1.

**Organizacion:**

- Concepto: cooperativo asimetrico point & click.
- Loop principal: observar, compartir, comparar, actuar, cargar, resolver.
- Nivel 1 - Almacen del gimnasio: objetivo, realidades A/B y elementos activos.
- Roles: funcion y cartas de Empollon, Manitas, Guaperas y Mistica.
- Regla fundamental: "No todo lo que ves es real".
- Pendiente de diseno: arte, combinaciones, pulso como visibilidad, interferencias.

**Buscar aqui cuando necesites:**

- Escribir textos de feedback o tarjetas sin romper el tono.
- Comprobar que un puzzle exige cooperacion real.
- Recordar que ve cada realidad inicial.
- Decidir si una nueva mecanica encaja con la regla central.

---

## 4. Operaciones del GM

### `docs/gm-operations.md`

**Uso principal:** documentar reglas practicas del panel GM.

**Organizacion:**

- Inicio de partida: diferencia entre abrir lobby e iniciar partida.
- Regla de partida parcial: iniciar con al menos 1 rol preparado.
- Herramienta de coordenadas: ajuste de hotspots por variante.
- Reset de hotspot: borra override remoto y vuelve a `scenarioContent`.

**Buscar aqui cuando necesites:**

- Validar comportamiento esperado del panel GM.
- Tocar botones de lobby, start/reset o partida parcial.
- Ajustar o depurar coordenadas de hotspots.
- Saber que significa persistir overrides en Firebase.

---

## 5. Proceso de prompts de arte

### `docs/art-prompt-process.md`

**Uso principal:** redactar prompts de arte para assets jugables, variantes A/B, overlays de estado, detalles de inspeccion, objetos independientes y pistas visuales.

**Lectura obligatoria asociada:** `docs/ECO Tech Props v1.md`.

**Buscar aqui cuando necesites:**

- Pedir arte para un puzzle sin romper consistencia entre estados.
- Mantener un mismo objeto como overlay en diferentes fases.
- Distinguir entre asset de estado y objeto independiente para editar despues.
- Formular prompts que expliquen funcion jugable, referencia visual, diferencia exacta y resultado esperado.

---

## 6. Seguridad y despliegue Firebase

### `docs/firebase-security.md`

**Uso principal:** recordar como estan preparadas las reglas y que falta hacer en consola.

**Organizacion:**

- Que se ha dejado preparado: `database.rules.json`, `firebase.json`, Auth anonimo.
- Pasos en Firebase: activar Auth anonimo y desplegar reglas.
- Nota importante: limites de seguridad de codigos de partida frente a autorizacion real.

**Buscar aqui cuando necesites:**

- Revisar por que Firebase necesita Auth anonimo.
- Desplegar o comprobar reglas.
- Separar seguridad real de la experiencia jugable con codigos.

---

## 7. Archivo historico

### `docs/OLD/`

**Uso principal:** recuperar contexto, ideas descartadas, prompts, prototipos y decisiones antiguas.

**Importante:** estos documentos pueden contradecir el estado actual. Si hay conflicto, manda este orden:

1. Codigo actual.
2. `docs/PROJECT_STATUS.md`.
3. Docs activos de raiz (`architecture`, `game_design`, `gm-operations`, `firebase-security`).
4. `docs/OLD/`.

### `docs/OLD/PROJECT_STATUS_legacy.md`

Historial amplio del prototipo: sandbox React, lobby visual, migracion React, fases antiguas, riesgos y deudas resueltas. Util para entender por que existen ciertos componentes o decisiones, no para planificar el estado actual.

### `docs/OLD/gdd_el_examen_2_mvp.md`

GDD legacy de gran alcance. Contiene vision MVP, roles, acciones, inventario, UI, panel GM, lobby, reglas sistemicas, capas del mapa y requisitos. Muchas ideas siguen siendo aprovechables, pero la sala descrita no es necesariamente el nivel activo actual.

### `docs/OLD/sistema_narrativo_Examen2_protocolo_eco.md`

Documento narrativo macro: estructura global, roles, progresion emocional, varias salas, ecos, Codex y finales. Sirve para tono, arco y posibles futuros niveles.

### `docs/OLD/gimnasio_logica_programable_mvp.md`

Reglas programables del gimnasio MVP antiguo: estados, acciones, resolucion por pulso, flags y pseudocodigo. Util como referencia de logica, no como implementacion activa.

### `docs/OLD/GYM_SCENE_ART_DIRECTION.md`

Direccion visual antigua del gimnasio: composicion, objetos interactivos, zonas reservadas para UI, hotspots y prioridades visuales. Puede inspirar arte, pero el Nivel 1 activo ahora es `almacen`.

### `docs/OLD/GYM_NARRATIVE_AND_CHARACTER_PROMPTS.md`

Prompts y narrativa visual del gimnasio y personajes. Util para mantener estilo de personajes, Instituto Newton y clima visual.

### `docs/OLD/html-legacy/`

Versiones HTML antiguas de pantallas de jugador, GM, roles y espera. Solo archivo de referencia.

### `docs/OLD/assets-legacy/`

Prototipos y assets archivados, incluyendo minijuegos antiguos y material del rol Bruto. Solo recuperar si se decide reincorporar algo.

### `docs/OLD/design-systems/`

Sistemas de diseno archivados. El sistema activo es `El Examen 2 Design System/`, fuera de `docs/OLD`.

---

## 8. Mapa rapido de busqueda

| Pregunta | Documento |
|---|---|
| Que esta listo y que falta? | `docs/PROJECT_STATUS.md` |
| Que archivo edito para escenarios, reglas o Firebase? | `docs/architecture.md` |
| Como funciona el flujo jugador -> accion -> pulso? | `docs/architecture.md` |
| Cual es el concepto jugable del almacen? | `docs/game_design.md` |
| Que roles y cartas existen? | `docs/game_design.md` |
| Como debe comportarse el GM? | `docs/gm-operations.md` |
| Donde se guardan los ajustes de hotspots? | `docs/architecture.md` y `docs/gm-operations.md` |
| Como preparo prompts de arte para puzzles/overlays? | `docs/art-prompt-process.md` + `docs/ECO Tech Props v1.md` |
| Como revisar seguridad de Firebase? | `docs/firebase-security.md` |
| Donde busco ideas antiguas de narrativa o reglas? | `docs/OLD/` |
| Donde busco prototipos HTML/minijuegos viejos? | `docs/OLD/html-legacy/` y `docs/OLD/assets-legacy/` |

---

## 9. Matriz de cambios y actualizaciones asociadas

Esta tabla funciona como checklist de mantenimiento. Cuando un cambio de codigo toca una de estas areas, hay que revisar tambien los documentos o archivos asociados antes de darlo por cerrado.

| Tipo de cambio pedido | Revisar / actualizar normalmente | Motivo | Ejemplo reciente |
|---|---|---|---|
| Texto visible, feedback, tooltips, labels, consola, cartas, botones o UX writing | Codigo fuente correspondiente + `node scripts/export-texts.mjs` + `docs/textos_juego.csv` | El CSV es el inventario editable de copy. Si cambia texto visible y no se regenera, la hoja queda desfasada. | Cambio de "Cargar software", "Arrastra una accion a este puerto", descripciones del hallazgo de taquillas. |
| Acciones, familias de accion, nombres de cartas o significado de `Accion_Inspeccion` / `Accion_Interaccion` | `src/data/actionTypes.js`, `src/data/gameData.js`, `src/presentation/actionQueuePresentation.js`, `docs/game_design.md`, `docs/textos_juego.csv` | Las acciones afectan a mecanica, presentacion, chips de cola y copy editable. | Cambio de familias visibles de Fuerza/Inteligencia/Magia/Ingenieria a Revelacion/Alteracion. |
| Flujo de pulso, resonancia, fusion, resolucion de puzzle o estados de objetos | `src/services/pulseService.js`, `src/services/gameRules.js`, `src/data/scenarioContent.js`, `docs/architecture.md`, `docs/game_design.md`, `docs/PROJECT_STATUS.md` | Toca comportamiento sistemico y reglas narrativas; debe quedar explicado para futuras decisiones. | Fusion de taquilla tras resonancia y apertura posterior con accion de interaccion. |
| Escenario, hotspots, variantes A/B, items, hallazgos o contenido del almacen | `src/data/scenarioData.js`, `src/data/scenarioContent.js`, `docs/game_design.md`, `docs/PROJECT_STATUS.md`, `docs/textos_juego.csv` si hay copy | Cambia lo que existe en la sala y lo que arte/diseno deben entender. | Hallazgo adyacente de inspeccion en taquillas con texto A/B y placeholder de asset. |
| Herramientas del GM, mapa de coordenadas, overrides o monitores | `src/screens/GMScreen.jsx`, `src/components/SceneMap.jsx`, `docs/gm-operations.md`, `docs/architecture.md`, `docs/PROJECT_STATUS.md` | El GM necesita reglas operativas claras y el estado remoto debe seguir siendo trazable. | Editor GM de `discoveryCardX/discoveryCardY` para la ventana adyacente. |
| UI de jugador, drop zones, inventario, minijuego o affordances de interaccion | Componentes/CSS afectados, `docs/textos_juego.csv`, `docs/game_design.md` si cambia el significado jugable | La UI no es solo visual: comunica reglas de accion y narrativa de interferencia. | Rediseño de la zona de drop como "Cargar software" con comportamiento de hackeo. |
| Estado remoto, Firebase, seed inicial o rutas compartidas | `src/services/remoteState.js`, `src/services/firebaseClient.js`, `docs/architecture.md`, `docs/firebase-security.md` si toca permisos, `docs/PROJECT_STATUS.md` | Evita que la documentacion diga una ruta o garantia distinta a la real. | Cambios en `queuedActions`, `hotspotOverrides`, `gameState` o reglas de seguridad. |
| Nuevo documento, CSV, script de soporte o cambio de responsabilidad documental | `docs/INDEX.md`, `docs/PROJECT_STATUS.md` | El indice debe saber que existe y `PROJECT_STATUS` debe apuntar al archivo correcto. | Alta de `docs/textos_juego.csv` y `scripts/export-texts.mjs`. |
| Arte, prompts de assets, tabla de assets, nombres para desarrollo o variantes visuales | `docs/art-prompt-process.md`, `docs/ECO Tech Props v1.md`, tabla externa de assets/Notion si aplica, `docs/PROJECT_STATUS.md`, `docs/game_design.md` si afecta al puzzle, `src/data/scenarioContent.js` si cambia asset id | Arte necesita continuidad visual, lista sin duplicados, prompts funcionales y nombres estables. | Consolidacion de assets del almacen, candado/mecanismo A/B y overlays por estado. |

Regla practica: si el cambio altera lo que un jugador ve o lee, regenerar `docs/textos_juego.csv`. Si altera lo que el sistema hace, revisar `architecture` y `PROJECT_STATUS`. Si altera por que el puzzle tiene sentido, revisar `game_design`. Si altera como opera el GM, revisar `gm-operations`.

---

## 10. Rutina recomendada antes de cambios

1. Leer `docs/PROJECT_STATUS.md` para confirmar estado y pendientes.
2. Leer el doc especifico del area: arquitectura, diseno, GM o Firebase.
3. Contrastar con el codigo actual si el cambio toca comportamiento.
4. Consultar `docs/OLD/` solo para contexto historico o inspiracion.
5. Consultar la matriz de cambios de este indice para saber que docs o archivos secundarios deben actualizarse.
6. Si cambia copy visible, ejecutar `node scripts/export-texts.mjs`.
7. Si se preparan prompts de arte, leer `docs/art-prompt-process.md` y `docs/ECO Tech Props v1.md`.
8. Actualizar este indice si se anade, mueve o cambia el rol de un documento.
