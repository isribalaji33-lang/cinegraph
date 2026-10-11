@echo off
title CineGraph Launcher
echo ========================================================
echo               STARTING CINEGRAPH
echo ========================================================
echo.
echo Make sure Neo4j is running!
echo.

:: 1. Start FastAPI Backend in its own window
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CineGraph Backend (Port 8000)" cmd /k "cd /d "%~dp0" && venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 3. Start React Frontend in its own window
echo [2/3] Starting React Frontend on http://localhost:3000 ...
start "CineGraph Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: 4. Wait 3 seconds and launch browser
timeout /t 3 /nobreak >nul
echo [3/3] Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo   CineGraph is now running!
echo   - App:      http://localhost:3000
echo   - API Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.
echo Keep the two black command windows open while using the app.
echo To stop CineGraph, simply close both windows.
echo.
pause
