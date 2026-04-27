@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "PORT=5173"
set "BASE_URL=http://127.0.0.1:%PORT%"

cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo   El Examen 2 - React oficial
echo ==========================================
echo.

where git >nul 2>nul
if %errorlevel% equ 0 (
  git rev-parse --is-inside-work-tree >nul 2>nul
  if %errorlevel% equ 0 (
    echo Cambiando a la rama react-oficial...
    git switch react-oficial
  )
)

if not exist "node_modules" (
  echo.
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo Arrancando servidor local en %BASE_URL% ...
start "El Examen 2 - Vite" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev -- --port %PORT%"

echo Esperando a que Vite este listo...
timeout /t 4 /nobreak >nul

echo Abriendo vista Game Master...
start "" "%BASE_URL%/?screen=gm"

echo Abriendo pestanas de jugadores (x4)...
start "" "%BASE_URL%"
start "" "%BASE_URL%"
start "" "%BASE_URL%"
start "" "%BASE_URL%"

echo.
echo Listo. Puedes cerrar esta ventana.
echo El servidor queda abierto en la ventana "El Examen 2 - Vite".
pause
exit /b 0

:error
echo.
echo No se pudo completar el arranque. Revisa el mensaje anterior.
pause
exit /b 1
