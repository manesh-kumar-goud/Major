@echo off
echo Starting Stock Prediction Application...
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/updating backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Some backend dependencies may not have installed correctly
)

echo.
echo Installing/updating frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies failed to install
    pause
    exit /b 1
)

echo.
echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo Starting backend server...
cd ..\backend
start "Backend Server" cmd /k "python app.py"

echo.
echo Starting frontend development server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Application started successfully!
echo.
echo Backend server: http://localhost:5000
echo Frontend server: http://localhost:3000
echo.
echo Press any key to exit this window...
pause > nul 