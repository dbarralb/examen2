# Operaciones GM

## Acceso GM

El panel GM ya no debe abrirse como acceso directo libre desde la pantalla inicial.

Flujo actual:

1. Entrar por `/?screen=access`.
2. Introducir el codigo Game Master.
3. Si el codigo es valido, se guarda en `sessionStorage`.
4. La ruta `?screen=gm` queda disponible solo para esa sesion del navegador.

Codigo temporal actual: `delfin`.

Importante: este codigo protege el flujo de interfaz, no es seguridad fuerte de Firebase. Antes de una prueba publica debe moverse a configuracion/entorno o sustituirse por autorizacion real.

## Inicio de partida

El panel GM tiene 2 acciones distintas:

- `Abrir lobby`: genera codigo numerico GM interno, codigos neutrales de jugador, pone `session.status = role_select` y limpia jugadores/claims del lobby.
- `Iniciar partida`: pone `session.status = in_game` y arranca el timer.

Regla importante: `Iniciar partida` debe estar disponible cuando haya al menos 1 jugador con rol preparado en `lobby.roleClaims`. No debe exigir los 4 roles.

El arranque automatico con countdown sigue existiendo cuando los 4 roles estan reclamados, pero no sustituye la capacidad manual del GM de iniciar una prueba o partida parcial.

Los codigos de jugador son neutrales (`jugador1`-`jugador4` en Firebase) y se muestran en el panel GM asociados al nombre/rol solo cuando alguien los reclama. El GM debe repartirlos como entradas de sesion, no como roles predeterminados.

## Herramienta de coordenadas

El panel GM incluye una herramienta para ajustar hotspots del escenario activo por variante A/B/C/D. Los cambios se guardan en Firebase bajo `hotspotOverrides` y se aplican en la vista de jugadores, por lo que sirven para afinar posicion y tamano sin tocar codigo.

El reset de hotspot borra el override remoto de ese objeto en la variante seleccionada y vuelve a la definicion base de `src/data/scenarioContent.js`.

## Fusion de taquillas

Flujo canonico: los jugadores activan la fusion desde el movil al seleccionar el puerto mecanico de `taquillas` cuando hay resonancia suficiente. El GM observa el estado y puede acompasar la partida, pero no debe pulsar nada para iniciar la fusion durante una partida normal.

El boton de fusion del panel GM queda como debug para pruebas, reseteos y demostraciones controladas.
