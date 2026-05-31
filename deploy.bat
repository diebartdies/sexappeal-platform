@echo off
echo ===================================================
echo   SexAppeal Platform - Automated Deployment
echo ===================================================
echo.
echo Target IP: 91.208.206.35
echo GitHub: https://github.com/diebartdies/sexappeal-platform.git
echo.

:: Ask for the SSH password for the remote user defined in inventory.ini
set /p SSH_PASS="Enter SSH password for the remote user on 91.208.206.35: "
echo.

echo Detecting Linux distribution and installing OpenSSH client and sshpass...
:: Use -u root to run the apt-get commands without needing a sudo password
:: We force WSL to use Google DNS (8.8.8.8) to fix "Temporary failure resolving" errors
wsl -u root bash -c "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; rm -f /etc/resolv.conf 2>/dev/null; echo 'nameserver 8.8.8.8' > /etc/resolv.conf 2>/dev/null; if command -v apt-get >/dev/null 2>&1; then apt-get update; DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-client sshpass; elif command -v apk >/dev/null 2>&1; then apk update; apk add openssh sshpass; elif command -v dnf >/dev/null 2>&1; then dnf install -y openssh-clients sshpass; elif command -v yum >/dev/null 2>&1; then yum install -y openssh-clients sshpass; elif command -v zypper >/dev/null 2>&1; then zypper in -y openssh sshpass; elif command -v pacman >/dev/null 2>&1; then pacman -Sy --noconfirm openssh sshpass; else echo 'Error: Package manager not found.'; fi"
echo.

echo Verifying sshpass installation...
wsl bash -c "if ! command -v sshpass >/dev/null 2>&1; then echo 'ERROR: sshpass failed to install. Please check your WSL internet connection.'; exit 1; fi"
if %errorlevel% neq 0 (
    pause
    exit /b %errorlevel%
)

echo Launching Ansible via WSL...
echo.

:: Enter the ansible folder natively so WSL automatically starts in the correct directory
cd ansible

:: This command launches WSL, installs required Ansible collections, and runs the playbook directly
wsl bash -c "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin; export LC_ALL=C.UTF-8; export ANSIBLE_HOST_KEY_CHECKING=False; ansible-galaxy collection install community.general community.docker && ansible-playbook -i inventory.ini deploy.yml -e 'ansible_password=\"%SSH_PASS%\" ansible_become_password=\"%SSH_PASS%\"'"

cd ..

echo.
echo ===================================================
echo   Deployment finished. Check logs above for status.
echo ===================================================
pause
