# start-sprint1-d2-tabs.ps1
# Open 2 Windows Terminal tabs for D2-1 + D2-4 (parallel, 2h)
# Usage: .\scripts\start-sprint1-d2-tabs.ps1
#
# Race condition prevention: D2-1 + D2-4 are dispatched to
# INDEPENDENT worktrees (wt-sprint1-d2-1, wt-sprint1-d2-4) on
# INDEPENDENT branches. orchestrator will squash merge both
# into feat/sprint-week1-d2 after completion.
#
# D2-2 + D2-3 are SEQUENTIAL (Tab 1, D2-1 done first) and will
# have their own dispatch script (start-sprint1-d2-tabs-phase2.ps1)
# once D2-1 lands.

$ErrorActionPreference = 'Stop'
$WtreeBase = 'C:\code'
$PromptDirBase = Join-Path $WtreeBase 'Hermes-Boris-game\scripts\prompts'

# Tab 1: D2-1 puzzles (Tab 1, main code)
$WtreeTab1 = Join-Path $WtreeBase 'Hermes-Boris-game-wt-sprint1-d2-1'
$PromptTab1 = Join-Path $PromptDirBase 'd2-1.md'

# Tab 2: D2-4 crash recovery (Tab 2, parallel)
$WtreeTab2 = Join-Path $WtreeBase 'Hermes-Boris-game-wt-sprint1-d2-4'
$PromptTab2 = Join-Path $PromptDirBase 'd2-4.md'

# Tab 1: D2-1 puzzle system (L1 + L2)
wt -w 0 new-tab --title "Claude-1 (D2-1 puzzles)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $WtreeTab1; Write-Host '=== D2-1: puzzle system L1+L2 ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptTab1'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

# Tab 2: D2-4 crash recovery (parallel with D2-1)
wt -w 0 new-tab --title "Claude-2 (D2-4 crash recovery)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $WtreeTab2; Write-Host '=== D2-4: crash recovery + boot-guard ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptTab2'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '2 tabs opened (D2-1 + D2-4, parallel)' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '  1. Each tab: copy prompt and paste into claude' -ForegroundColor White
Write-Host '  2. Wait for both ~2h' -ForegroundColor White
Write-Host '  3. orchestrator squash merges both branches into feat/sprint-week1-d2' -ForegroundColor White
Write-Host '  4. Then dispatch D2-2 (audio) and D2-3 (save) sequentially via Tab 1' -ForegroundColor White
