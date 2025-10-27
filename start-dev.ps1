# Script para iniciar el servidor de desarrollo en puerto específico
# Evita conflictos de puertos y procesos

Write-Host "🔄 Terminando procesos de Node.js existentes..." -ForegroundColor Yellow

# Terminar todos los procesos de Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "⏳ Esperando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "🚀 Iniciando servidor en puerto 3001..." -ForegroundColor Green

# Iniciar el servidor en puerto 3001
npx next dev --port 3001

