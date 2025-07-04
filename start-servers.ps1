# Start-Servers.ps1
Write-Host "Stopping any existing IPDash servers..." -ForegroundColor Yellow

# Kill backend server (node server.js on port 3001)
$backendPort = 3001
$backendPids = netstat -ano | Select-String ":$backendPort" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
foreach ($procId in $backendPids) {
    if ($procId -match '^\d+$') {
        try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
    }
}

# Kill frontend server (npm start/react-scripts on port 3000)
$frontendPort = 3000
$frontendPids = netstat -ano | Select-String ":$frontendPort" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
foreach ($procId in $frontendPids) {
    if ($procId -match '^\d+$') {
        try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
    }
}

Write-Host "Starting IPDash servers..." -ForegroundColor Green

# Start the backend server in a new window
Start-Process powershell.exe -ArgumentList "-NoExit -Command cd '$PSScriptRoot\server'; node server.js"

# Wait a moment for the backend to start
Start-Sleep -Seconds 2

# Start the frontend server in a new window
Start-Process powershell.exe -ArgumentList "-NoExit -Command cd '$PSScriptRoot'; npm start"

Write-Host "Servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 