# Deployment - Netlify

## Objetivo

La app se despliega como SPA estatica. Vite solo se usa para generar `dist/`; en produccion no hace falta levantar `npm run dev`, `vite preview` ni ningun servidor Node.

## Netlify

Configuracion:

- Build command: `npm run build`
- Publish directory: `dist`
- Redirect SPA: `/*` -> `/index.html` con status `200`

La configuracion vive en `netlify.toml`.

## Variables

Configurar en Netlify las variables `VITE_FIREBASE_*` necesarias para Firebase:

```env
VITE_FIREBASE_DATABASE_URL=https://project-butterfly-d0242-default-rtdb.firebaseio.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=project-butterfly-d0242.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-butterfly-d0242
VITE_FIREBASE_APP_ID=
```

Opcional:

```env
VITE_PUBLIC_APP_URL=https://tu-sitio.netlify.app
```

Si `VITE_PUBLIC_APP_URL` existe, la app lo usa como base para URLs y QR. Si no existe, usa `window.location.origin + window.location.pathname`.

## URLs canonicas

Entrada principal:

```text
/?screen=access
```

GM:

```text
/?screen=gm
```

La URL de GM solo abre el panel si el navegador ya valido el codigo GM en `access`. Si no, la app vuelve a la pantalla de acceso. Codigo temporal actual: `delfin`.

Pantallas de jugador:

```text
/?screen=player&role=empollon
/?screen=player&role=manitas
/?screen=player&role=guaperas
/?screen=player&role=mistica
```

Terminales moviles:

```text
/?screen=device&role=empollon&code=XXXXXX
/?screen=device&role=manitas&code=XXXXXX
/?screen=device&role=guaperas&code=XXXXXX
/?screen=device&role=mistica&code=XXXXXX
```

## QR de jugadores

Cada `PlayerScreen` muestra bajo el chat el QR del terminal movil de su propio rol. El QR incluye el codigo de sesion del rol cuando esta disponible, para auto-login en `DeviceScreen`.

Si no hay codigo disponible, el QR abre la pantalla movil sin `code` y el jugador debe introducir el codigo manualmente.

## Validacion

Antes de publicar:

```bash
npm run build
```

En Netlify, comprobar que refrescar cualquiera de las URLs con `?screen=...` no produce 404. El redirect SPA debe devolver siempre `index.html`.
