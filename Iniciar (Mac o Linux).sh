#!/bin/bash
# Misión Soberanía Vital 2050 - Servidor local
cd "$(dirname "$0")"
PUERTO=8000
echo "Iniciando la Misión Soberanía Vital 2050..."
echo "(esta ventana tiene que quedar abierta mientras el grupo juega; para cerrar, Ctrl+C)"
echo

abrir_navegador () {
  sleep 1
  if command -v open >/dev/null 2>&1; then open "http://localhost:$PUERTO/index.html"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:$PUERTO/index.html"
  fi
}
abrir_navegador &

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PUERTO"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PUERTO"
else
  echo "No se encontró Python instalado en esta computadora."
  echo "Sin Python no se puede reproducir el video incrustado en la página;"
  echo "el resto del juego funciona igual abriendo index.html con doble clic."
  read -p "Presioná Enter para salir..."
fi
