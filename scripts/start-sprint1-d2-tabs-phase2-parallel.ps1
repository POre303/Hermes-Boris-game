# start-sprint1-d2-tabs-phase2-parallel.ps1
# Open 1 Windows Terminal tab for D2-3 (save system, parallel with D2-2 in Tab 1)
# Usage: .\scripts\start-sprint1-d2-tabs-phase2-parallel.ps1
#
# Phase 2 PARALLEL: D2-2 (Tab 1, audio) + D2-3 (Tab 2, save) run simultaneously.
# Both finish ~2h, then orchestrator squash merges both into feat/sprint-week1-d2.
#
# KNOWN conflict: src/shared/api.ts — D2-2 adds AudioApi, D2-3 adds SaveApi.
# orchestrator will resolve during squash merge (keep both interfaces, no field merge).

$ErrorActionPreference = 'Stop'
$WtreeTab2 = 'C:\code\Hermes-Boris-game-wt-sprint1-d2-3'
$PromptTab2 = 'C:\code\Hermes-Boris-game\scripts\prompts\d2-3.md'

# Tab 2: D2-3 save system (parallel with D2-2 in Tab 1)
wt -w 0 new-tab --title "Claude-2 (D2-3 save system)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $WtreeTab2; Write-Host '=== D2-3: save system (10 slots + autosave + screenshot) ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptTab2'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '1 tab opened (D2-3 save, parallel with D2-2 in Tab 1)' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '  1. Tab 2: copy prompt and paste into claude' -ForegroundColor White
Write-Host '  2. Both D2-2 (Tab 1) and D2-3 (Tab 2) run ~2h' -ForegroundColor White
Write-Host '  3. orchestrator squash merges both into feat/sprint-week1-d2' -ForegroundColor White
Write-Host '     KNOWN: src/shared/api.ts may conflict (AudioApi + SaveApi) — orchestrator keeps both' -ForegroundColor White
Write-Host '  4. D2 done: open PR #4 (5 commits: D2-1 + D2-4 + D2-2 + D2-3 + chore: prompts)' -ForegroundColor White
