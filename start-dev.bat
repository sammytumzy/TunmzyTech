@echo off
echo Starting TumzyTech Development Environment...
echo.

echo [1/3] Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0;; echo Backend Server Starting...;; npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend React App...
start "Frontend" cmd /k "cd /d %~dp0app\frontend;; echo Frontend React App Starting...;; npm start"

echo [3/3] Opening Browser...
timeout /t 10 /nobreak >nul
start http://localhost:3000

echo.
echo ================================
echo TumzyTech Development Environment
echo ================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo API:      http://localhost:5000/api/
echo ================================
echo.
echo Press any key to close this window...
pause >nul
