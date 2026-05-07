@echo off
setlocal
set "PROJECT_ROOT=%~dp0..\.."

pushd "%PROJECT_ROOT%" >nul
echo Optimizando mapas del almacen A y B...
call npm.cmd run optimize:maps
set "EXIT_CODE=%ERRORLEVEL%"
popd >nul

echo.
if "%EXIT_CODE%"=="0" (
  echo Listo. Puedes cerrar esta ventana.
) else (
  echo Ha ocurrido un error. Revisa el mensaje anterior.
)
pause
exit /b %EXIT_CODE%
