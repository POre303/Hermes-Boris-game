# start-claude-tabs.ps1
# 启动 5 个 Windows Terminal 标签页，编号 Claude-1 到 Claude-5
# 用法：.\scripts\start-claude-tabs.ps1
$ErrorActionPreference = 'Stop'
$LocalPath = 'C:\code\Hermes-Boris-game'

for ($i = 1; $i -le 5; $i++) {
    $wtDir = Join-Path (Split-Path $LocalPath -Parent) "hermes-boris-game-wt-$i"
    $tabTitle = "Claude-$i"

    # 第一次跑时建 worktree
    if (-not (Test-Path $wtDir)) {
        Push-Location $LocalPath
        git worktree add -b "feat/parallel-$i" $wtDir main 2>&1 | Out-Null
        Pop-Location
    }

    # 起新 tab
    wt -w 0 new-tab --title $tabTitle --suppressApplicationTitle `
        powershell -NoExit -Command "cd $wtDir; claude --permission-mode plan"
}
Write-Host "5 个 tab 已启动" -ForegroundColor Green
