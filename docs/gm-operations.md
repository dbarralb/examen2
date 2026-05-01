# Operaciones GM

## Inicio de partida

El panel GM tiene 2 acciones distintas:

- `Abrir lobby`: genera codigos, pone `session.status = role_select` y limpia jugadores/claims del lobby.
- `Iniciar partida`: pone `session.status = in_game` y arranca el timer.

Regla importante: `Iniciar partida` debe estar disponible cuando haya al menos 1 jugador con rol preparado en `lobby.roleClaims`. No debe exigir los 4 roles.

El arranque automatico con countdown sigue existiendo cuando los 4 roles estan reclamados, pero no sustituye la capacidad manual del GM de iniciar una prueba o partida parcial.

## Herramienta de coordenadas

El panel GM incluye una herramienta para ajustar hotspots del escenario activo por variante A/B/C/D. Los cambios se guardan en Firebase bajo `hotspotOverrides` y se aplican en la vista de jugadores, por lo que sirven para afinar posicion y tamano sin tocar codigo.

El reset de hotspot borra el override remoto de ese objeto en la variante seleccionada y vuelve a la definicion base de `src/data/scenarioContent.js`.
