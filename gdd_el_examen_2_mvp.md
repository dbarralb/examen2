# GDD — El Examen 2 (MVP)

## 1. Visión general

**Título del proyecto:** El Examen 2  
**Formato:** Aventura gráfica cooperativa + escape room digital con GM en vivo  
**Plataforma:** Web  
**Jugadores:** 4 jugadores + 1 GM  

### Premisa
Cuatro alumnos de instituto han robado un examen de ciencias un sábado por la mañana. Justo después, el sistema de seguridad del instituto se activa y los encierra dentro. Lo que parece un castigo por haber entrado donde no debían termina revelándose como una prueba secreta organizada por un grupo de escapistas profesionales. El examen era un cebo para encontrar a los elegidos.

### Fantasía de jugador
- Sentirse dentro de una aventura gráfica cooperativa en tiempo real.
- Resolver enigmas en grupo sin que nadie se pierda lo que ha ocurrido.
- Vivir una experiencia parecida a un escape room físico, pero digital y guiada por un GM.
- Tomar decisiones que afectan a cómo se descubre la historia, no solo a si se avanza o no.

### Pilares del proyecto
1. **Cooperación visible:** todo el mundo debe saber qué hacen sus compañeros.
2. **Narrativa con consecuencias:** la forma de resolver importa, sobre todo a nivel narrativo.
3. **Acciones en cola:** los jugadores encolan intenciones y el sistema las ejecuta en momentos concretos.
4. **GM en vivo:** acompaña, da inmersión y regula el ritmo sin resolver los puzles.
5. **Aventura gráfica primero:** la base es exploración, observación, deducción y conversación.

---

## 2. Objetivo del MVP

Construir un prototipo funcional de una sesión jugable con:
- acceso por navegador,
- entrada a partida mediante código,
- lobby para 4 jugadores,
- selección de rol,
- transición de inicio,
- una interfaz individual por rol,
- chat de texto entre jugadores y GM,
- escenario visible,
- pull de acciones visible,
- sistema básico de cola de acciones.

El MVP no necesita todavía todo el contenido narrativo final ni todas las cartas cerradas, pero sí debe validar el bucle principal de experiencia.

---

## 3. Flujo de usuario

### 3.1 Flujo del jugador
1. El jugador entra en una dirección web.
2. Introduce el código de partida.
3. El sistema valida ese código contra la sesión activa creada por el GM.
4. Si la validación es correcta, entra al lobby.
5. En el lobby ve a los demás jugadores conectados.
6. Elige uno de los 4 roles disponibles.
7. Espera a que el resto elija.
8. Cuando todos han elegido, comienza una cuenta atrás.
9. Se reproduce una cinemática inicial usando un PNG placeholder + pantalla de carga durante 5 segundos.
10. Entra en la interfaz de juego correspondiente a su rol.
11. Durante la partida:
   - ve el escenario,
   - ve su pull de acciones,
   - usa el chat,
   - encola acciones.

### 3.2 Flujo del GM
1. El GM accede a su propia web/interfaz.
2. Introduce o genera un código de partida de 6 dígitos.
3. Abre la sesión.
4. Espera a que entren los 4 jugadores.
5. Ve quién está conectado y qué rol ha escogido cada uno.
6. Cuando la partida arranca, puede enviar mensajes al chat.
7. Durante la partida acompaña, ambienta y guía sin resolver directamente los puzles.

---

## 4. Estructura de sesión

### 4.1 Requisitos de sala
- 1 partida activa vinculada a un código de 6 dígitos.
- 4 plazas de jugador.
- 1 plaza de GM.
- Cada rol solo puede ser elegido por un jugador.

### 4.2 Estados de sesión
- **Creada**
- **Esperando jugadores**
- **Lobby completo**
- **Selección de roles**
- **Cuenta atrás**
- **Cinemática / carga**
- **En partida**
- **Finalizada**

---

## 5. Roles

Los cuatro roles están diseñados para forzar cooperación y repartir funciones mentales distintas. Los jugadores ven el mismo escenario general, pero cada rol tendrá una variante de interfaz y, más adelante, un pull de acciones propio.

### 5.1 Empollón
**Función principal:** interpretar sistemas y reducir incertidumbre.  
**Identidad:** alumno que entiende lo que otros ven pero no saben leer. Recurre a apuntes, manuales e instrucciones.  
**Valor en partida:** convierte información confusa en información útil.  
**Principio clave:** no bloquea el avance, pero mejora la calidad de la resolución.

### 5.2 Manitas
**Función principal:** manipular sistemas físicos y preparar objetos.  
**Identidad:** alumno que trastea, desmonta, arregla y puentea.  
**Valor en partida:** habilita interacciones seguras y accesos técnicos.

### 5.3 Bruto
**Función principal:** ejecutar cambios físicos de forma directa.  
**Identidad:** alumno impulsivo que fuerza, empuja o rompe.  
**Valor en partida:** asegura progreso aunque con riesgo de consecuencias.

### 5.4 Mística
**Función principal:** reinterpretar objetos desde una lógica absurda pero útil.  
**Identidad:** alumna con aura medio ritualista, medio cómica, que encuentra usos inesperados en las cosas. Tono ligeramente Cthulhu humorístico.  
**Valor en partida:** abre caminos alternativos y soluciones no evidentes.

---

## 6. Sistema de acciones

### 6.1 Concepto
Los jugadores no ejecutan directamente acciones instantáneas. En su lugar, arrastran una acción desde su pull al escenario. Esa acción se **encola** y queda visible para todo el equipo. La acción se resolverá cuando ocurra la siguiente “anomalía científica” o pulso de ejecución del sistema.

### 6.2 Objetivos del sistema
- Evitar que un jugador resuelva algo sin que los demás se enteren.
- Hacer visible la intención antes de que ocurra.
- Dar tiempo para que otros jugadores reaccionen y complementen la acción.
- Introducir un punto justo de táctica sin romper el ritmo de exploración.

### 6.3 Lo que debe ver el equipo
Cada acción encolada debe mostrar como mínimo:
- jugador que la ha lanzado,
- acción elegida,
- objetivo/objeto afectado,
- orden en la cola.

### 6.4 Ejecución
Cuando llega el pulso de ejecución:
- se produce un feedback visual/sonoro global,
- las acciones se resuelven en orden,
- todo el equipo ve claramente qué ha pasado y qué ha cambiado.

---

## 7. Filosofía de resolución

### 7.1 Siempre progresable
Los puzles no deben bloquearse por una única solución correcta. Si un jugador usa la fuerza, debe poder producirse avance.

### 7.2 Calidad de resolución
La diferencia entre resolver “bien” o “mal” no debe ser bloquear el juego, sino afectar a:
- claridad de la información conseguida,
- cantidad de historia descubierta,
- acceso a habitaciones o eventos ocultos,
- tono y consecuencias de la escena.

### 7.3 Pérdidas prioritarias
La pérdida preferente para este proyecto es la **pérdida narrativa**:
- notas rotas,
- mensajes incompletos,
- contexto oculto,
- rutas opcionales no descubiertas.

Esto da valor al GM, a las habitaciones ocultas y a la rejugabilidad.

---

## 8. UI general del jugador

### 8.1 Distribución base
La interfaz de jugador se divide en tres zonas principales:

1. **Zona principal:** escenario  
   Área más grande de la pantalla. Muestra la sala actual y sus objetos interactivos.

2. **Zona inferior izquierda:** pull de cartas de acción  
   Muestra las acciones disponibles del rol actual.

3. **Zona inferior derecha:** dispositivo del jugador  
   Cada rol tendrá su propio cachivache/herramienta y una versión distinta de esta zona. En el MVP puede ser un placeholder funcional distinto por rol.

### 8.2 Elementos compartidos
- chat de texto,
- cola de acciones visible,
- feedback de ejecución,
- identificación visual del rol propio.

### 8.3 Requisito técnico importante
Aunque el jugador perciba una UI equivalente en estructura, a efectos técnicos **cada rol tendrá una pantalla HTML distinta** para facilitar diferencias funcionales y de desarrollo.

---

## 9. Chat

### 9.1 Participantes
- Los 4 jugadores pueden enviar mensajes.
- El GM también puede enviar mensajes.

### 9.2 Función
- comunicación estratégica,
- inmersión,
- guía diegética o semidiegética del GM,
- refuerzo narrativo.

### 9.3 MVP
El chat del MVP será exclusivamente de texto.

---

## 10. Cinemática inicial

### Objetivo
Introducir el comienzo de la sesión de forma controlada antes de entregar la UI interactiva.

### MVP
- Se muestra una imagen PNG placeholder.
- Se acompaña de una pantalla de carga.
- Duración total: 5 segundos.
- Al terminar, se entra automáticamente al juego.

---

## 11. Escenario MVP: Gimnasio

### 11.1 Propósito
El gimnasio será la primera sala o sala de referencia para validar el sistema de juego.

### 11.2 Objetivo del puzle
Abrir la salida de emergencia sin activar la respuesta más agresiva del sistema.

### 11.3 Elementos de la sala
- puerta de emergencia,
- panel digital,
- cerradura física antigua,
- sensor ambiental,
- taquillas,
- cuadro eléctrico,
- material deportivo,
- pantalla del sistema.

### 11.4 Enfoque del diseño
- El Empollón interpreta mensajes, protocolos y manuales.
- El Manitas manipula componentes físicos y sistemas.
- El guaperas puede forzar el avance.
- La Mística encuentra usos extraños y alternativos en objetos comunes.

### 11.5 Resultados posibles
- **Resolución óptima:** salida limpia + información narrativa adicional.
- **Resolución parcial:** se avanza pero con pérdida narrativa.
- **Resolución caótica:** se avanza con consecuencias negativas o cómicas.

---

## 12. Papel del GM

### Función principal
Guiar responsablemente, dar inmersión y hacer que la experiencia se parezca a un escape room físico acompañado.

### Lo que sí hace
- modular ritmo,
- reforzar tensión y humor,
- recordar elementos del entorno,
- intervenir con mensajes narrativos,
- acompañar sin quitar protagonismo al sistema.

### Lo que no hace
- resolver puzles por los jugadores,
- dictar la solución correcta,
- sustituir la claridad de la UI.

### Principio clave
La interfaz y la mecánica deben explicar lo que ocurre. El GM lo refuerza, no lo sustituye.

---

## 13. Requisitos funcionales MVP

### Jugadores
- Acceso a la web de jugador.
- Introducción de código de partida.
- Validación de sesión activa.
- Entrada al lobby.
- Visualización de jugadores conectados.
- Selección de rol único.
- Espera hasta completar grupo.
- Cuenta atrás automática.
- Pantalla cinemática/carga de 5 segundos.
- Entrada al juego.
- Visualización de escenario.
- Visualización del pull de acciones.
- Envío y recepción de mensajes en chat.

### GM
- Acceso a la web de GM.
- Definición o activación de código de 6 dígitos.
- Visualización de jugadores conectados.
- Visualización de roles seleccionados.
- Envío de mensajes al chat.

### Sistema
- Gestión de sesión de partida.
- Sincronización de lobby.
- Sincronización de selección de roles.
- Inicio automático al completarse el grupo.
- Gestión de variantes de interfaz por rol.
- Cola compartida de acciones.
- Feedback visible de acciones encoladas.

---

## 14. Alcance del MVP

### Dentro de alcance
- 1 partida de 4 jugadores + 1 GM.
- lobby funcional,
- selección de rol,
- transición de inicio,
- chat,
- escenario base visible,
- pull de acciones visible,
- cola de acciones simple,
- 1 sala prototipo.

### Fuera de alcance por ahora
- sistema completo de cartas balanceadas,
- múltiples salas,
- sistema final de habitaciones ocultas,
- dispositivos completos por rol,
- cinemáticas reales,
- arte final,
- sistema avanzado de puntuación o evaluación,
- persistencia compleja entre sesiones.

---

## 15. Preguntas abiertas para siguiente iteración

1. Qué hace exactamente cada carta por rol.
2. Cómo se representa visualmente la cola de acciones.
3. Qué frecuencia tiene la anomalía de ejecución.
4. Qué información exacta puede consultar el Empollón en apuntes/manuales.
5. Qué forma toma el dispositivo individual de cada rol.
6. Qué estados técnicos necesita cada objeto interactivo.
7. Qué herramientas de control tendrá el GM además del chat.
8. Cómo se estructura la primera sala en términos de objetos, estados y resultados.

---

## 16. Objetivo inmediato de producción

Construir un prototipo navegable que permita validar tres cosas:

1. si el flujo de entrada a partida funciona bien,  
2. si la cooperación se entiende desde la UI,  
3. si el sistema de cola de acciones evita que los jugadores se pierdan lo que hacen sus compañeros.
