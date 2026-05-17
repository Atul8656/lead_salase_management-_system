$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting SALENLO (Lead Sales Management System) 🚀" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check for backend folder
if (-not (Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check for frontend folder
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

$baseDir = (Get-Item .).FullName

Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backendCmd = "`$Host.UI.RawUI.WindowTitle = 'SALENLO Backend'; python -m uvicorn main:app --reload --port 8000"
Start-Process powershell -WorkingDirectory "$baseDir\backend" -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
$frontendCmd = "`$Host.UI.RawUI.WindowTitle = 'SALENLO Frontend'; npm run dev"
Start-Process powershell -WorkingDirectory "$baseDir\frontend" -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "✅ Both servers are starting in new windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
