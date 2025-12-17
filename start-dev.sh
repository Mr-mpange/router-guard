#!/bin/bash

echo "Starting NetFlow WiFi Management System..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js is installed: $(node --version)"
echo

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the project root directory"
    exit 1
fi

# Start backend in background
echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend in background
echo "Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo "NetFlow WiFi Management System Started"
echo "========================================"
echo
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"
echo

# Wait for user to stop
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait