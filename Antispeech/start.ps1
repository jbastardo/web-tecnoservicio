# PowerShell Startup script for Antispeech
$Host.UI.RawUI.WindowTitle = "Antispeech Voice IDE Server"
Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Antispeech - Microfono para Antigravity IDE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Verificando dependencias..." -ForegroundColor Gray
python -m pip install -r requirements.txt --quiet --no-warn-script-location

Write-Host "[*] Levantando servidor..." -ForegroundColor Green
python server.py
