@echo off
setlocal enabledelayedexpansion

echo === CRM Application Stopper ===

set "BACKEND_PORT=7070"
set "FRONTEND_PORT=7200"

call :stop_port %FRONTEND_PORT% Frontend
call :stop_port %BACKEND_PORT% Backend

echo.
echo === CRM Application Stopped ===
exit /b 0

:stop_port
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND=false"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":%PORT% " ^| findstr "LISTENING" 2^>nul') do (
    echo %LABEL% ^(port %PORT%^): stopping PID %%a
    taskkill /f /pid %%a >nul 2>&1
    set "FOUND=true"
)

if "!FOUND!"=="false" (
    echo %LABEL% ^(port %PORT%^): not running
) else (
    echo %LABEL% stopped.
)
exit /b 0
