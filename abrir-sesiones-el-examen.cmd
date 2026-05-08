@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "PORT=5173"
set "BASE_URL=http://127.0.0.1:%PORT%"
set "SESSION_URL=%BASE_URL%/?screen=access"

cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo   El Examen 2 - Sesiones locales
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo No se encontro npm. Instala Node.js o abre este proyecto en un entorno con Node.
  goto :error
)

if not exist "node_modules" (
  echo.
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo Arrancando servidor Vite en %BASE_URL% ...
start "El Examen 2 - Vite" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev -- --port %PORT%"

echo Esperando a que Vite este listo...
timeout /t 4 /nobreak >nul

echo Abriendo 3 pestanas de sesion...
start "" "%SESSION_URL%"
start "" "%SESSION_URL%"
start "" "%SESSION_URL%"

echo.
echo Listo. Introduce los codigos en las tres pestanas.
echo El servidor queda abierto en la ventana "El Examen 2 - Vite".
pause
exit /b 0

:error
echo.
echo No se pudo completar el arranque. Revisa el mensaje anterior.
pause
exit /b 1
