@echo off
echo ========================================
echo Cleaning up port 8001
echo ========================================

echo.
echo Finding processes on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    echo Found PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Checking if port is free...
netstat -ano | findstr :8001

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [WARNING] Port 8001 still in use. Try restarting your computer.
) else (
    echo.
    echo [SUCCESS] Port 8001 is now free!
)

echo.
echo ========================================
pause
