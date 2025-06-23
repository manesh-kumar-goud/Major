#!/bin/bash

echo "🚀 Starting Stock Market Forecasting App..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.12+ from https://python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "Please copy .env.example to .env and configure your API key"
    echo "1. cp .env.example .env"
    echo "2. Edit .env file with your RapidAPI key"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Setup backend if venv doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "🔧 Setting up backend environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend setup complete"
    echo
fi

# Setup frontend if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ]; then
    echo "🔧 Setting up frontend environment..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend setup complete"
    echo
fi

echo "🚀 Starting application..."
echo
echo "Starting both services:"
echo "1. Backend (Flask API) - http://localhost:5000"
echo "2. Frontend (React) - http://localhost:3000"
echo
echo "Press Ctrl+C to stop both services"
echo

# Function to cleanup background processes on exit
cleanup() {
    echo
    echo "🛑 Stopping application..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Start backend in background
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "🎉 Application is starting up!"
echo
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo
echo "The app will be available at http://localhost:3000 in a few moments."
echo "Press Ctrl+C to stop both services."

# Wait for user to press Ctrl+C
wait 