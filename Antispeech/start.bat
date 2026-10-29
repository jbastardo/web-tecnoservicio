@echo off
title Antispeech Voice IDE Server
cd /d "%~dp0"

echo ========================================================
echo   Iniciando Antispeech - Microfono para Antigravity IDE
echo ========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Python 3.10 o superior y vuelve a intentar.
    pause
    exit /b 1
)

echo [*] Verificando dependencias...
python -m pip install -r requirements.txt --quiet --no-warn-script-location

echo [*] Levantando servidor...
python server.py

pause
