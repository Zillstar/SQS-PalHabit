#requires -Version 5.1
param(
    [switch]$Quality,
    [switch]$Detached,
    [switch]$NoBuild,
    [switch]$Reset
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")

Write-Output "==> Preparing project..."
& (Join-Path $ScriptDir "setup.ps1") -CheckOnly

Set-Location $RootDir

if ($Reset) {
    Write-Output "==> Resetting Docker Compose stack and volumes..."
    docker compose down -v --remove-orphans
}

$ComposeArgs = @("compose")

if ($Quality) {
    $ComposeArgs += @("--profile", "quality")
}

$ComposeArgs += "up"

if ($Detached) {
    $ComposeArgs += "-d"
}

if (-not $NoBuild) {
    $ComposeArgs += "--build"
}

$FrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
$BackendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "8181" }
$QualityPort = if ($env:QUALITY_HUB_PORT) { $env:QUALITY_HUB_PORT } else { "8088" }

Write-Output ""
Write-Output "==> Starting PokeHabit..."
Write-Output "    Frontend: http://localhost:$FrontendPort"
Write-Output "    Backend:  http://localhost:$BackendPort"

if ($Quality) {
    Write-Output "    Quality:  http://localhost:$QualityPort"
}

Write-Output ""
Write-Output "==> Running: docker $($ComposeArgs -join ' ')"
& docker @ComposeArgs