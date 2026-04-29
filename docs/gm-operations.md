# Operaciones GM

## Inicio de partida

El panel GM tiene 2 acciones distintas:

- `Abrir lobby`: genera codigos, pone `session.status = role_select` y limpia jugadores/claims del lobby.
- `Iniciar partida`: pone `session.status = in_game` y arranca el timer.

Regla importante: `Iniciar partida` debe estar disponible cuando haya al menos 1 jugador con rol preparado en `lobby.roleClaims`. No debe exigir los 4 roles.

El arranque automatico con countdown sigue existiendo cuando los 4 roles estan reclamados, pero no sustituye la capacidad manual del GM de iniciar una prueba o partida parcial.
