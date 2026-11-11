#!/bin/sh
set -e

# Crear directorios para datos persistentes y backups automáticos si no existen
mkdir -p /app/data /app/data/backups

# Si se ejecuta como root al inicio de Docker, ajustar ownership para el usuario nextjs
if [ "$(id -u)" = "0" ]; then
    chown -R nextjs:nodejs /app/data
    exec su-exec nextjs node server.js
else
    exec node server.js
fi
