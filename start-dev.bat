@echo off
echo Starting NetFlow WiFi Management System...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

echo Starting Backend Server...
cd backend
start "NetFlow Backend" cmd /k "npm run dev"
cd ..

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Development Server...
start "NetFlow Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo NetFlow WiFi Management System Started
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul