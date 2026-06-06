# register-auto-verify.ps1
# Register Hermes-Boris-AutoVerify in Windows Task Scheduler
# Runs every 5h: test-all + Playwright + audit + biome
# Usage (admin PowerShell): .\scripts\register-auto-verify.ps1
$ErrorActionPreference = 'Stop'

$ScriptPath = Join-Path (Get-Location).Path "scripts\auto-verify.ps1"

if (-not (Test-Path $ScriptPath)) {
    throw "auto-verify.ps1 not found at $ScriptPath"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

$trigger = New-ScheduledTaskTrigger `
    -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Hours 5) `
    -RepetitionDuration (New-TimeSpan -Days 365)

# Remove existing if present
Unregister-ScheduledTask -TaskName "Hermes-Boris-AutoVerify" -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName "Hermes-Boris-AutoVerify" `
    -Action $action `
    -Trigger $trigger `
    -Description "Every 5h: run Hermes-Boris auto-verify (test + playwright + audit + biome)" `
    -RunLevel Highest `
    -Force

Write-Host "Hermes-Boris-AutoVerify registered (every 5h)" -ForegroundColor Green
Write-Host "  Script: $ScriptPath" -ForegroundColor Cyan
Write-Host "  Next run: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
