# start-sprint1-tabs.ps1
# Open 2 Windows Terminal tabs for D1-5 + D1-7
# Usage: .\scripts\start-sprint1-tabs.ps1
$ErrorActionPreference = 'Stop'
$Wtree = 'C:\code\Hermes-Boris-game-wt-sprint1'
$PromptDir = Join-Path $Wtree 'scripts\prompts'

# Tab 1: D1-5 palette switch
wt -w 0 new-tab --title "Claude-1 (D1-5 palette)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $Wtree; Write-Host '=== D1-5: switch palette to tokyo_heisei ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptDir\d1-5.md'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

# Tab 2: D1-7 fix known issues
wt -w 0 new-tab --title "Claude-2 (D1-7 fix known issues)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $Wtree; Write-Host '=== D1-7: fix known issues (flex center + builder 24) ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptDir\d1-7.md'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '2 tabs opened' -ForegroundColor Green
