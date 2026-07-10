param(
    [string]$ProjectRoot = $PSScriptRoot
)

# UniteX Dev Orchestrator for Windows
Write-Host "Starting UniteX Platform..." -ForegroundColor Cyan

# Stop any existing jobs with these names
Get-Job | Where-Object { $_.Name -match "^UniteX-" } | Stop-Job -PassThru | Remove-Job

$jobs = @()

# 1. Start Client
$jobs += Start-Job -ScriptBlock { 
    param($root)
    Set-Location (Join-Path $root "client")
    npm run dev
} -ArgumentList $ProjectRoot -Name "UniteX-Client"

# 2. Start Server
$jobs += Start-Job -ScriptBlock {
    param($root)
    Set-Location (Join-Path $root "server")
    npm run dev
} -ArgumentList $ProjectRoot -Name "UniteX-Server"

# 3. Start Media Service
$jobs += Start-Job -ScriptBlock {
    param($root)
    Set-Location (Join-Path $root "media-service")
    npm run dev
} -ArgumentList $ProjectRoot -Name "UniteX-Media"

# 4. Start Blockchain
$jobs += Start-Job -ScriptBlock {
    param($root)
    Set-Location (Join-Path $root "blockchain")
    npx hardhat node
} -ArgumentList $ProjectRoot -Name "UniteX-Blockchain"

Write-Host "`nServices started in background jobs." -ForegroundColor Green
Write-Host "Use 'Get-Job -Name UniteX-*' to see status." -ForegroundColor Yellow
Write-Host "Use 'Receive-Job -Name UniteX-Client -Keep' to see logs." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring (background jobs continue)." -ForegroundColor Yellow
Write-Host "Use '.\dev.ps1 -Stop' to stop all UniteX jobs." -ForegroundColor Yellow

# Keep open to show live status
while($true) {
    $running = @(Get-Job | Where-Object { $_.Name -match "^UniteX-" -and $_.State -eq "Running" }).Count
    $failed = @(Get-Job | Where-Object { $_.Name -match "^UniteX-" -and $_.State -eq "Failed" }).Count
    if ($running -eq 0 -and $failed -gt 0) {
        Write-Host "`nSome services have failed. Check with 'Receive-Job -Name <Name>'." -ForegroundColor Red
        break
    }
    Start-Sleep 5
}
