@echo off
setlocal enabledelayedexpansion

echo === CRM Application Cleaner ===

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "BACKEND_PORT=7070"
set "FRONTEND_PORT=7200"

:: Pre-flight: refuse to run if the app is still up. Deleting node_modules
:: while tsx --watch or ng serve is running can leave the watchers in a
:: half-dead state that still holds the ports.
netstat -ano | findstr /c:":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ERROR: Backend port %BACKEND_PORT% is still in use.
    echo Run end.bat to stop the application, then run clean.bat again.
    exit /b 1
)
netstat -ano | findstr /c:":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ERROR: Frontend port %FRONTEND_PORT% is still in use.
    echo Run end.bat to stop the application, then run clean.bat again.
    exit /b 1
)

echo Cleaning backend...
call :nuke_dir  "%ROOT_DIR%\backend\data"
call :nuke_dir  "%ROOT_DIR%\backend\node_modules"
call :nuke_dir  "%ROOT_DIR%\backend\test-results"
call :nuke_file "%ROOT_DIR%\backend\package-lock.json"

echo Cleaning frontend...
call :nuke_dir  "%ROOT_DIR%\frontend\node_modules"
call :nuke_dir  "%ROOT_DIR%\frontend\dist"
call :nuke_dir  "%ROOT_DIR%\frontend\.angular"
call :nuke_file "%ROOT_DIR%\frontend\package-lock.json"

echo.
echo === Clean complete ===
echo Next: start.bat   ^(will run npm install and recreate the database^)
exit /b 0

:nuke_dir
if exist %1 (
    echo   Deleting %~1
    rmdir /s /q %1
)
exit /b 0

:nuke_file
if exist %1 (
    echo   Deleting %~1
    del /q %1
)
exit /b 0
