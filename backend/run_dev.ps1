# Dev server on loopback + high port — avoids WinError 10013 on many Windows setups.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    Write-Host "Create venv first: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}
& .\.venv\Scripts\Activate.ps1
Write-Host "API: http://127.0.0.1:8010  (docs: /docs)" -ForegroundColor Cyan
Write-Host "Ensure frontend uses same port (default in vite.config) or set VITE_API_PROXY." -ForegroundColor DarkGray
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
