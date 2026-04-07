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
    echo   --reset-db      Delete local H2 database ^(will be recreated with seed data^)
    exit /b 1
)
:args_done

:: --- Prerequisite checks ---

:: Check Java is installed
where java >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed.
    echo This project requires Java 21 or later.
    echo Install from: https://adoptium.net/
    exit /b 1
)

:: Check Java version is 21+
for /f "tokens=3 delims= " %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set "JAVA_VER_RAW=%%~v"
    goto :java_ver_found
)
:java_ver_found
for /f "tokens=1 delims=." %%m in ("%JAVA_VER_RAW%") do set "JAVA_MAJOR=%%m"
if %JAVA_MAJOR% LSS 21 (
    echo ERROR: Java 21 or later is required. Found: Java %JAVA_MAJOR%.
    echo Install from: https://adoptium.net/
    exit /b 1
)
echo Java %JAVA_MAJOR% detected.

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
start "CRM-Backend" /b cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev -q"
cd /d "%ROOT_DIR%"

:: Wait for backend to be ready
echo Waiting for backend to start...
set "BACKEND_READY=false"
for /l %%i in (1,1,60) do (
    if "!BACKEND_READY!"=="false" (
        curl -s -o nul -w "%%{http_code}" "http://localhost:7070/api/firmen" 2>nul | findstr /r "401 200" >nul 2>&1
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
    exit /b 1
)

:: --- Frontend ---

echo Starting frontend...
cd /d "%ROOT_DIR%\frontend"

:: Install node modules if not present
if not exist "node_modules" (
    echo Node modules not found. Running npm install...
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

start "CRM-Frontend" /b cmd /c "npx ng serve --port 7200 --proxy-config proxy.conf.json"
cd /d "%ROOT_DIR%"

echo.
echo === CRM Application Started ===
echo Backend:   http://localhost:7070
echo.
echo   ^^^>^^^>^^^>  http://localhost:7200  ^^^<^^^<^^^<
echo.
echo Press Ctrl+C to stop

:: Keep the script running
:wait_loop
timeout /t 5 /nobreak >nul
goto :wait_loop
