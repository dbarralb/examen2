# Seguridad de Firebase

Este proyecto usa Firebase Realtime Database. Las reglas inseguras suelen venir de tener `.read` o `.write` en `true` para todo el mundo.

## Que se ha dejado preparado

- `database.rules.json`: reglas versionadas para Realtime Database.
- `firebase.json`: apunta el deploy de Firebase a esas reglas.
- `src/services/firebaseClient.js`: inicia sesion anonima con Firebase Auth y manda el token en cada llamada REST cuando existen las variables `VITE_FIREBASE_*`.
- `.env.example`: plantilla de configuracion local.

## Pasos que debes hacer en Firebase

1. Entra en Firebase Console.
2. Ve a Authentication > Sign-in method.
3. Activa Anonymous.
4. Ve a Project settings > General > Your apps > Web app.
5. Copia estos valores a un archivo `.env` local:

```env
VITE_FIREBASE_DATABASE_URL=https://project-butterfly-d0242-default-rtdb.firebaseio.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=project-butterfly-d0242.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-butterfly-d0242
VITE_FIREBASE_APP_ID=...
```

6. Reinicia Vite para que lea el `.env`.
7. Despliega las reglas:

```bash
firebase deploy --only database
```

Tambien puedes pegarlas manualmente desde Realtime Database > Rules usando el contenido de `database.rules.json`.

## Nota importante

Estas reglas eliminan el acceso anonimo no autenticado, que es el primer problema que Firebase marca como inseguro. Para una app publica real, el siguiente paso seria separar permisos de GM y jugadores con usuarios reales, custom claims o Cloud Functions.

Los codigos actuales son barreras de experiencia, no autorizacion fuerte:

- El codigo GM temporal (`delfin`) vive en cliente y desbloquea la ruta `?screen=gm` solo en `sessionStorage`.
- Los codigos numericos de jugador limitan el flujo de lobby/rol, pero no separan permisos reales en Firebase.

Antes de publicar una prueba abierta, mover el codigo GM a configuracion como minimo; antes de una publicacion real, sustituirlo por autorizacion de servidor.
