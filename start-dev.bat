@echo off
echo Starting TumzyTech Development Environment...
echo.

echo [1/3] Starting Backend Server...
<<<<<<< HEAD
start "Backend" cmd /k "cd /d %~dp0;; echo Backend Server Starting...;; npm start"
=======
start "Backend" cmd /k "cd /d %~dp0 && echo Backend Server Starting... && npm start"
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend React App...
<<<<<<< HEAD
start "Frontend" cmd /k "cd /d %~dp0app\frontend;; echo Frontend React App Starting...;; npm start"
=======
start "Frontend" cmd /k "cd /d %~dp0app\frontend && echo Frontend React App Starting... && npm start"
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799

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
