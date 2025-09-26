#!/usr/bin/env bash
# Asegurarse de que el script tenga permisos de ejecución
chmod +x build.sh

# Instalar dependencias
npm install

# Reconstruir sqlite3 específicamente para el entorno
npm rebuild sqlite3

# Crear directorio para la base de datos
mkdir -p database

# Asegurarse de que el directorio tiene los permisos correctos
chmod 777 database
