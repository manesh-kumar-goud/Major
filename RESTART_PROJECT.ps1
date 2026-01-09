# Comprehensive Project Restart Script
# Handles network errors, port conflicts, and clean restart

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PROJECT RESTART - NETWORK FIX" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Kill all processes on ports 5000 and 5173
Write-Host "[1] Freeing ports 5000 and 5173..." -ForegroundColor Yellow

# Port 5000 (Backend)
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    $pids5000 = $port5000 | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
    foreach ($pid in $pids5000) {
        if ($pid -gt 0) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Stopping process on port 5000 (PID: $pid, Name: $($proc.ProcessName))" -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Could not stop process $pid" -ForegroundColor Yellow
            }
        }
    }
}

# Port 5173 (Frontend)
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    $pids5173 = $port5173 | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
    foreach ($pid in $pids5173) {
        if ($pid -gt 0) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Stopping process on port 5173 (PID: $pid, Name: $($proc.ProcessName))" -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Could not stop process $pid" -ForegroundColor Yellow
            }
        }
    }
}

Start-Sleep -Seconds 3
Write-Host "  ✅ Ports freed`n" -ForegroundColor Green

# Step 2: Verify ports are free
Write-Host "[2] Verifying ports are free..." -ForegroundColor Yellow
$check5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$check5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($check5000) {
    Write-Host "  ⚠️  Port 5000 still in use" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Port 5000 is free" -ForegroundColor Green
}

if ($check5173) {
    Write-Host "  ⚠️  Port 5173 still in use" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Port 5173 is free`n" -ForegroundColor Green
}

# Step 3: Check backend configuration
Write-Host "[3] Checking backend configuration..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "RAPIDAPI_KEY\s*=\s*(.+)") {
        $keyLength = $Matches[1].Trim().Length
        if ($keyLength -gt 10) {
            Write-Host "  ✅ RAPIDAPI_KEY configured (length: $keyLength)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  RAPIDAPI_KEY may be invalid (length: $keyLength)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  RAPIDAPI_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  backend/.env file not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Test network connectivity
Write-Host "[4] Testing network connectivity..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName "yahoo-finance15.p.rapidapi.com" -Port 443 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "  ✅ Can reach RapidAPI servers" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Cannot reach RapidAPI servers - Check internet connection" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Network test failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Start Backend
Write-Host "[5] Starting backend server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "  ❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Using: $pythonVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Start backend in new window
Write-Host "  Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; python app.py" -WindowStyle Normal
Start-Sleep -Seconds 8

# Step 6: Check Backend Status
Write-Host "[6] Checking backend status..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  ✅ Backend is RUNNING!" -ForegroundColor Green
        Write-Host "     Status: $($data.status)" -ForegroundColor Gray
        Write-Host "     Version: $($data.version)" -ForegroundColor Gray
        $backendReady = $true
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  ⏳ Waiting for backend... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "  ⚠️  Backend may not be ready yet. Check the backend window for errors." -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Step 7: Start Frontend
Write-Host "[7] Starting frontend server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "  ❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start frontend in new window
Write-Host "  Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

# Step 8: Final Status
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "PROJECT RESTARTED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:5000/api/docs" -ForegroundColor White
Write-Host ""

Write-Host "Network Troubleshooting:" -ForegroundColor Yellow
Write-Host "   1. If you see Network Error:" -ForegroundColor White
Write-Host "      - Check backend window for errors" -ForegroundColor Gray
Write-Host "      - Verify backend is running on port 5000" -ForegroundColor Gray
Write-Host "   2. If RapidAPI errors:" -ForegroundColor White
Write-Host "      - Check RAPIDAPI_KEY in backend/.env" -ForegroundColor Gray
Write-Host "      - Verify internet connection" -ForegroundColor Gray
Write-Host "   3. If CORS errors:" -ForegroundColor White
Write-Host "      - Frontend should be on port 5173" -ForegroundColor Gray
Write-Host "      - Backend CORS is configured for localhost:5173" -ForegroundColor Gray
Write-Host ""

Write-Host "TIP: Both servers are running in separate windows." -ForegroundColor Green
Write-Host "    Close those windows to stop the servers." -ForegroundColor Gray
Write-Host ""

