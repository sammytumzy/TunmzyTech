@echo off
echo Starting TumzyTech backend server with HTTPS tunneling...

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js.
    exit /b 1
)

:: Check if npm packages are installed
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Failed to install dependencies. Please check your internet connection.
        exit /b 1
    )
)

:: Start the server
echo Starting server with HTTPS tunnel...
echo Press Ctrl+C to stop the server.
npm run dev

echo Server stopped.
