@echo off
echo ===================================
echo  Sistema de Busqueda Badabun
echo ===================================
echo.
echo Compilando frontend...
call npm run build:frontend
echo.
echo Iniciando servidor unificado...
echo El proyecto estara disponible en: http://localhost:3001
echo.
cd Backend
node index.js