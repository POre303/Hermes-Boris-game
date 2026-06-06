# auto-verify.ps1
# Run Hermes-Boris auto-verify: test-all + Playwright + audit
# Output: docs/auto-reports/<timestamp>.md
# On failure: feishu webhook to $env:LARK_WEBHOOK_URL
# Usage: .\scripts\auto-verify.ps1
$ErrorActionPreference = 'Stop'

$ProjectRoot = (Get-Location).Path
$report = @()
$report += "=== Hermes-Boris auto-verify ==="
$report += "timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$report += "cwd: $ProjectRoot"
$report += "branch: $(git rev-parse --abbrev-ref HEAD 2>$null)"

# 1. pnpm test-all (typecheck + test)
$report += "`n--- pnpm test-all ---"
$testResult = & pnpm test-all 2>&1
$report += $testResult
$testPass = $LASTEXITCODE -eq 0

# 2. Playwright screenshot regression
$report += "`n--- Playwright ---"
$ssResult = & pnpm exec playwright test --reporter=line 2>&1
$report += $ssResult
$ssPass = $LASTEXITCODE -eq 0

# 3. pnpm audit (dependency vulns)
$report += "`n--- pnpm audit ---"
$auditResult = & pnpm audit 2>&1
$report += $auditResult

# 4. biome format check
$report += "`n--- biome format ---"
$biomeResult = & pnpm exec biome format . 2>&1
$report += $biomeResult

# 5. 写报告
$reportFile = "docs\auto-reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
New-Item -ItemType Directory -Path (Split-Path $reportFile) -Force | Out-Null
$report | Out-File -FilePath $reportFile -Encoding UTF8

# 6. 失败时发飞书 webhook
if (-not $testPass -or -not $ssPass) {
    $msg = "Hermes-Boris auto-verify 失败 @ $(Get-Date -Format 'HH:mm')`n"
    $msg += "test=$testPass screenshot=$ssPass`n"
    $msg += "report: $reportFile"
    $body = @{
        msg_type = "text"
        content  = @{ text = $msg }
    } | ConvertTo-Json -Depth 5
    try {
        if ($env:LARK_WEBHOOK_URL) {
            Invoke-RestMethod -Uri $env:LARK_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json" | Out-Null
        } else {
            $report += "`nLARK_WEBHOOK_URL not set; skip webhook"
            $report | Out-File -FilePath $reportFile -Encoding UTF8
        }
    } catch {
        $report += "`nWebhook failed: $_"
        $report | Out-File -FilePath $reportFile -Encoding UTF8
    }
}
