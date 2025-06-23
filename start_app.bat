@echo off
echo 🚀 Starting Stock Market Forecasting App...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.12+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found
    echo Please copy .env.example to .env and configure your API key
    echo 1. copy .env.example .env
    echo 2. Edit .env file with your RapidAPI key
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Setup backend if venv doesn't exist
if not exist "backend\venv" (
    echo 🔧 Setting up backend environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
    echo ✅ Backend setup complete
    echo.
)

REM Setup frontend if node_modules doesn't exist
if not exist "frontend\node_modules" (
    echo 🔧 Setting up frontend environment...
    cd frontend
    npm install
    cd ..
    echo ✅ Frontend setup complete
    echo.
)

echo 🚀 Starting application...
echo.
echo Opening two windows:
echo 1. Backend (Flask API) - http://localhost:5000
echo 2. Frontend (React) - http://localhost:3000
echo.
echo Press Ctrl+C in either window to stop the application
echo.

REM Start backend in new window
start "Stock Market App - Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Stock Market App - Frontend" cmd /k "cd frontend && npm start"

echo 🎉 Application is starting up!
echo.
echo Check the opened windows for any errors.
echo The app will be available at http://localhost:3000 in a few moments.
echo.
pause 