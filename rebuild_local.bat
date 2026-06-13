@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ===================================================
echo Rebuilding Local SexAppeal Environment...
echo ===================================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    goto end
)

echo.
echo [2/4] Security audit and auto-fix...
call npm audit
echo.
call npm audit fix
if errorlevel 1 (
    echo WARN: npm audit fix could not resolve all issues — review output above.
) else (
    echo npm audit fix completed.
)
echo.
call npm audit
echo.

echo [3/4] Stopping local containers...
docker-compose down
if errorlevel 1 (
    echo WARN: docker-compose down returned an error.
)

echo.
echo [4/4] Building and starting containers...
docker-compose build
if errorlevel 1 (
    echo ERROR: docker-compose build failed.
    goto end
)
docker-compose up -d
if errorlevel 1 (
    echo ERROR: docker-compose up failed.
    goto end
)

echo.
echo Local environment rebuilt and updated.

:end
pause
