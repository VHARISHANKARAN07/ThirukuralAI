@echo off
title Thirukural Voice AI Backend (Whisper & Venpa Meter)
echo ========================================================
echo   Starting Thirukural Voice AI Backend (Port 8000)
echo ========================================================
cd backend
py run_backend.py
if %ERRORLEVEL% NEQ 0 (
    python run_backend.py
)
pause
