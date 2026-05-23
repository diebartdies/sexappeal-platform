@echo off
echo Applying permanent locale fix to WSL...
echo (Note: You might be prompted to enter your WSL/Linux password)
wsl bash -c "sudo locale-gen en_US.UTF-8 && sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8"
echo.
echo Shutting down WSL to apply the new configuration...
wsl --shutdown
echo Done! You can now run your deploy.bat script.
pause