# start-sprint1-d2-tabs-phase2.ps1
# Open 1 Windows Terminal tab for D2-2 (audio system, sequential after D2-1 done)
# Usage: .\scripts\start-sprint1-d2-tabs-phase2.ps1
#
# D2-2 is dispatched to a fresh worktree wt-sprint1-d2-2 from main,
# branch feat/sprint-week1-d2-2-audio. orchestrator will squash merge
# into feat/sprint-week1-d2 after completion (D2-1 + D2-4 already in).

$ErrorActionPreference = 'Stop'
$WtreeTab1 = 'C:\code\Hermes-Boris-game-wt-sprint1-d2-2'
$PromptTab1 = 'C:\code\Hermes-Boris-game\scripts\prompts\d2-2.md'

# Tab 1: D2-2 audio system (BGM crossfade + SFX + master)
wt -w 0 new-tab --title "Claude-1 (D2-2 audio)" --suppressApplicationTitle `
    powershell -NoExit -Command "cd $WtreeTab1; Write-Host '=== D2-2: audio system (BGM crossfade + SFX) ===' -ForegroundColor Cyan; Get-Content -Raw '$PromptTab1'; Write-Host '=========================================' -ForegroundColor Cyan; Write-Host 'Copy the task above and paste into claude' -ForegroundColor Yellow; claude"

Write-Host '1 tab opened (D2-2 audio)' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '  1. Tab 1: copy prompt and paste into claude' -ForegroundColor White
Write-Host '  2. Wait ~2h' -ForegroundColor White
Write-Host '  3. orchestrator squash merges D2-2 into feat/sprint-week1-d2' -ForegroundColor White
Write-Host '  4. Then dispatch D2-3 (save) via Tab 1 (Phase 3)' -ForegroundColor White
