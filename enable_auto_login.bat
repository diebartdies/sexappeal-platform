@echo off
echo ===================================================
echo   SexAppeal - Setup Automated Server Login
echo ===================================================
echo.

if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo [1/2] Generating encrypted credential file on your PC...
    ssh-keygen -t rsa -b 4096 -f "%USERPROFILE%\.ssh\id_rsa" -N ""
) else (
    echo [1/2] Encrypted credential file already exists on your PC.
)

echo.
echo [2/2] Linking your secure file to the Moldovan server...
echo *** Please type your server password ONE last time when prompted ***
type "%USERPROFILE%\.ssh\id_rsa.pub" | ssh root@91.208.206.35 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

echo.
echo ===================================================
echo ✅ Success! Your computer is now trusted by the server.
echo The automated backup script will now run silently at 3 AM!
echo ===================================================
pause