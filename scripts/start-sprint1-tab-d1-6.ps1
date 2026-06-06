# start-sprint1-tab-d1-6.ps1
# Open 1 Windows Terminal tab for D1-6 (fusion-pixel-font integration, Tab 1)
# Usage: .\scripts\start-sprint1-tab-d1-6.ps1
$ErrorActionPreference = 'Stop'
$Wtree = 'C:\code\Hermes-Boris-game-wt-sprint1'
$PromptDir = Join-Path $Wtree 'scripts\prompts'

# Tab 5: D1-6 fusion-pixel-font integration
wt -w 0 new-tab --title "Claude-5 (D1-6 font integration)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $Wtree; Write-Host '=== D1-6: integrate fusion-pixel-font ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptDir\d1-6.md'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '1 tab opened (D1-6)' -ForegroundColor Green
