@echo off
echo Starting IPDash servers...

:: Start the backend server in a new window
start "IPDash Backend" cmd /k "cd /d %~dp0server && node server.js"

:: Wait a moment for the backend to start
timeout /t 2 /nobreak > nul

:: Start the frontend server in a new window
start "IPDash Frontend" cmd /k "cd /d %~dp0 && npm start"

echo Servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 