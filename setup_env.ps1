$ErrorActionPreference = "Stop"

$venvDir = Join-Path $PSScriptRoot "venv"

if (-not (Test-Path $venvDir)) {
    Write-Host "Creating virtual environment..."
    python -m venv $venvDir
}

Write-Host "Activating virtual environment..."
& (Join-Path $venvDir "Scripts\Activate.ps1")

Write-Host "Installing project dependencies..."
pip install -r (Join-Path $PSScriptRoot "requirements.txt")

Write-Host "Environment is ready."
Write-Host "Run the app with:"
Write-Host "  python .\plate_capture_auto.py"