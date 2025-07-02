#!/bin/bash

echo "Starting Stock Prediction Application..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed or not in PATH"
    exit 1
fi

# Use python3 if available, otherwise use python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "Using Python: $($PYTHON_CMD --version)"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    exit 1
fi

echo "Using Node.js: $(node --version)"
echo

echo "Installing/updating backend dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "WARNING: Some backend dependencies may not have installed correctly"
fi

echo
echo "Installing/updating frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend dependencies failed to install"
    exit 1
fi

echo
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed"
    exit 1
fi

echo
echo "Starting backend server..."
cd ../backend
$PYTHON_CMD app.py &
BACKEND_PID=$!

echo "Backend server started (PID: $BACKEND_PID)"
sleep 2

echo
echo "Starting frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Frontend server started (PID: $FRONTEND_PID)"
echo
echo "✅ Application started successfully!"
echo
echo "Backend server: http://localhost:5000"
echo "Frontend server: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt signal
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 