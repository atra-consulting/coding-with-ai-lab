@echo off
setlocal enabledelayedexpansion

echo === CRM Application Starter ===

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "CRM_DB_DIR=%ROOT_DIR%\backend\data"

:: Parse arguments
set "RESET_DB=false"
if "%~1"=="--reset-db" set "RESET_DB=true"
if "%~1"=="" goto :args_done
if not "%~1"=="--reset-db" (
    echo Usage: %~nx0 [--reset-db]
    echo   --reset-db      Delete local SQLite database ^(will be recreated with seed data^)
    exit /b 1
)
:args_done

:: --- Prerequisite checks ---

:: Check Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo This project requires Node.js 20.19+ ^(Angular 21 requirement^).
    echo Install from: https://nodejs.org/
    exit /b 1
)

:: Check Node.js version is 20.19+
for /f "tokens=1 delims=v" %%n in ('node --version') do set "NODE_VERSION=%%n"
for /f "tokens=1,2 delims=." %%a in ("%NODE_VERSION%") do (
    set "NODE_MAJOR=%%a"
    set "NODE_MINOR=%%b"
)
set "NODE_OK=true"
if %NODE_MAJOR% LSS 20 set "NODE_OK=false"
if %NODE_MAJOR%==20 if %NODE_MINOR% LSS 19 set "NODE_OK=false"
if "%NODE_OK%"=="false" (
    echo ERROR: Node.js 20.19 or later is required. Found: Node %NODE_VERSION%.
    echo Install from: https://nodejs.org/
    exit /b 1
)
echo Node.js %NODE_VERSION% detected.

:: Check npm is available
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed ^(should be bundled with Node.js^).
    echo Reinstall Node.js from: https://nodejs.org/
    exit /b 1
)

set "BACKEND_PORT=7070"
set "FRONTEND_PORT=7200"

:: Pre-flight: refuse to start if the ports are already in use. Otherwise
:: the health check below would talk to a leftover backend from a previous
:: run and the new backend would crash with EADDRINUSE.
netstat -ano | findstr /c:":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ERROR: Backend port %BACKEND_PORT% is already in use.
    echo Run end.bat to stop the leftover process, then try again.
    exit /b 1
)
netstat -ano | findstr /c:":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ERROR: Frontend port %FRONTEND_PORT% is already in use.
    echo Run end.bat to stop the leftover process, then try again.
    exit /b 1
)

:: Optionally reset database
if "%RESET_DB%"=="true" (
    if exist "%CRM_DB_DIR%" (
        echo Deleting database at %CRM_DB_DIR%...
        rmdir /s /q "%CRM_DB_DIR%"
    )
    echo Database deleted. Will be recreated on startup.
)

:: --- Backend ---

echo Starting backend...
cd /d "%ROOT_DIR%\backend"

:: Install node modules if not present or incomplete (a partial install missing
:: tsx produces MODULE_NOT_FOUND on start).
if not exist "node_modules\.bin\tsx.cmd" (
    echo Backend node modules missing or incomplete. Running npm install...
    call npm install
)

:: Ensure the native better-sqlite3 binary matches the current Node version.
:: (After a Node major upgrade, the cached .node file is compiled against the
:: old ABI and throws ERR_DLOPEN_FAILED on boot.)
node -e "require('better-sqlite3')" >nul 2>&1
if errorlevel 1 (
    echo better-sqlite3 binary mismatch with Node %NODE_VERSION%, rebuilding...
    call npm rebuild better-sqlite3
)

start "CRM-Backend" /b cmd /c "npx tsx --watch src/index.ts"
cd /d "%ROOT_DIR%"

:: Wait for backend to be ready
echo Waiting for backend to start...
set "BACKEND_READY=false"
for /l %%i in (1,1,60) do (
    if "!BACKEND_READY!"=="false" (
        curl -s -o nul -w "%%{http_code}" "http://localhost:%BACKEND_PORT%/api/health" 2>nul | findstr "200" >nul 2>&1
        if not errorlevel 1 (
            echo Backend is ready!
            set "BACKEND_READY=true"
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if "%BACKEND_READY%"=="false" (
    echo ERROR: Backend failed to start within 60 seconds
    call :cleanup
    exit /b 1
)

:: --- Frontend ---

echo Starting frontend...
cd /d "%ROOT_DIR%\frontend"

:: Install node modules if not present or incomplete
if not exist "node_modules\.bin\ng.cmd" (
    echo Frontend node modules missing or incomplete. Running npm install...
    call npm install
)

:: Check Angular CLI works
call npx ng version >nul 2>&1
if errorlevel 1 (
    echo Angular CLI seems not properly installed. Reinstalling dependencies...
    if exist "node_modules" rmdir /s /q "node_modules"
    if exist "package-lock.json" del /q "package-lock.json"
    call npm install
)

start "CRM-Frontend" /b cmd /c "npx ng serve --port %FRONTEND_PORT% --proxy-config proxy.conf.json"
cd /d "%ROOT_DIR%"

:: Wait for frontend to bind (ng serve initial compile can take 30-60s)
echo Waiting for frontend to be ready...
set "FRONTEND_READY=false"
for /l %%i in (1,1,120) do (
    if "!FRONTEND_READY!"=="false" (
        netstat -ano | findstr /c:":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
        if not errorlevel 1 (
            echo Frontend is ready!
            set "FRONTEND_READY=true"
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if "%FRONTEND_READY%"=="false" (
    echo ERROR: Frontend failed to start within 120 seconds
    call :cleanup
    exit /b 1
)

echo.
echo === CRM Application Started ===
echo Backend:   http://localhost:%BACKEND_PORT%
echo.
echo   ^^^>^^^>^^^>  http://localhost:%FRONTEND_PORT%  ^^^<^^^<^^^<
echo.
echo Press Ctrl+C to stop

:: Monitor backend and frontend. If either stops listening, clean up and exit.
:: (Ctrl+C is handled by Windows: the shared console forwards CTRL_C_EVENT to
:: the tsx/ng child processes, which terminate themselves.)
:monitor_loop
timeout /t 5 /nobreak >nul
netstat -ano | findstr /c:":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo.
    echo Backend ^(port %BACKEND_PORT%^) has stopped.
    goto :cleanup
)
netstat -ano | findstr /c:":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo.
    echo Frontend ^(port %FRONTEND_PORT%^) has stopped.
    goto :cleanup
)
goto :monitor_loop

:cleanup
echo Shutting down...
:: Kill the watchers (tsx --watch, ng serve) first. Port-only kill is not
:: enough on its own: tsx respawns the node child it supervises as soon as
:: we kill it, leaving port %BACKEND_PORT% bound. Match by command line via
:: PowerShell (Get-CimInstance) to find the watcher processes themselves.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*tsx --watch src/index.ts*' -or $_.CommandLine -like '*ng serve*%FRONTEND_PORT%*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
:: Safety net: kill anything still bound to our ports (tree-kill with /T).
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":%FRONTEND_PORT% " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /t /f /pid %%a >nul 2>&1
)
echo Frontend stopped.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":%BACKEND_PORT% " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /t /f /pid %%a >nul 2>&1
)
echo Backend stopped.
exit /b 0
