#requires -Version 5.1
param(
    [switch]$CheckOnly,
    [switch]$InstallLocal
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")

function Assert-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. Please install it and run this script again."
    }
}

Write-Output "==> Checking required tools..."
Assert-Command "docker"

try {
    docker compose version | Out-Null
}
catch {
    throw "Docker Compose was not found. Please install Docker Desktop or Docker Engine with Docker Compose."
}

Write-Output "==> Checking Docker daemon..."
try {
    docker info | Out-Null
}
catch {
    throw "Docker is installed, but the Docker daemon is not running. Please start Docker Desktop and try again."
}

if ($CheckOnly) {
    Write-Output "==> Setup check complete."
    return
}

if ($InstallLocal) {
    Write-Output "==> Installing local backend/frontend dependencies..."

    $BackendDir = Join-Path $RootDir "backend"
    if (Test-Path $BackendDir) {
        Write-Output "==> Resolving backend dependencies..."
        Push-Location $BackendDir

        if (Test-Path ".\mvnw.cmd") {
            .\mvnw.cmd --no-transfer-progress dependency:resolve
        }
        else {
            Assert-Command "mvn"
            mvn --no-transfer-progress dependency:resolve
        }

        Pop-Location
    }

    $FrontendDir = Join-Path $RootDir "frontend"
    if (Test-Path $FrontendDir) {
        Write-Output "==> Installing frontend dependencies..."
        Push-Location $FrontendDir

        Assert-Command "npm.cmd"

        if (Test-Path ".\package-lock.json") {
            npm.cmd ci
        }
        else {
            npm.cmd install
        }

        Pop-Location
    }
}
else {
    Write-Output "==> Skipping local dependency installation."
    Write-Output "    Docker Compose builds the backend/frontend images itself."
    Write-Output "    Use '.\scripts\setup.ps1 -InstallLocal' only if you also want local dev dependencies."
}

Write-Output "==> Setup complete."