Write-Host "===================================" -ForegroundColor Cyan
Write-Host " Sistema de Busqueda Badabun" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Compilando frontend..." -ForegroundColor Green
npm run build:frontend

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Iniciando servidor unificado..." -ForegroundColor Green
    Write-Host "El proyecto estara disponible en: http://localhost:3001" -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location Backend
    node index.js
} else {
    Write-Host "Error compilando el frontend" -ForegroundColor Red
    exit 1
}