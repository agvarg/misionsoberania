@echo off
setlocal
cd /d "%~dp0"
title Misión Soberanía Vital 2050 - Servidor local
echo.
echo Iniciando la Mision Soberania Vital 2050...
echo (esta ventana tiene que quedar abierta mientras el grupo juega)
echo.

set PUERTO=8000

start "" http://localhost:%PUERTO%/index.html

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PUERTO%
  goto :fin
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PUERTO%
  goto :fin
)
where python3 >nul 2>nul
if %errorlevel%==0 (
  python3 -m http.server %PUERTO%
  goto :fin
)

echo.
echo No se encontro Python instalado en esta computadora.
echo Sin Python no se puede reproducir el video incrustado en la pagina;
echo el resto del juego funciona igual abriendo index.html con doble clic.
echo.
pause

:fin
