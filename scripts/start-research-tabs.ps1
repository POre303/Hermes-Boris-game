# start-research-tabs.ps1
# Open 2 Windows Terminal tabs for D1-3 (Zpix) + D1-4 (BGM/SFX) research
# Usage: .\scripts\start-research-tabs.ps1
$ErrorActionPreference = 'Stop'
$Wtree = 'C:\code\Hermes-Boris-game-wt-sprint1'
$PromptDir = Join-Path $Wtree 'scripts\prompts'

# Tab 3: D1-3 Zpix research
wt -w 0 new-tab --title "Claude-3 (D1-3 Zpix research)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $Wtree; Write-Host '=== D1-3: Zpix font research ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptDir\d1-3.md'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

# Tab 4: D1-4 BGM/SFX research
wt -w 0 new-tab --title "Claude-4 (D1-4 BGM research)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $Wtree; Write-Host '=== D1-4: CC0 BGM/SFX research ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptDir\d1-4.md'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '2 research tabs opened' -ForegroundColor Green
