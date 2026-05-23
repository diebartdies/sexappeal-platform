@echo off
echo ===================================================
echo   1. Checking Docker Containers Status
echo ===================================================
wsl bash -c "cd /mnt/d/SexAppeal-platform/ansible && ansible production -i inventory.ini -b -m command -a 'docker compose -f /opt/sexappeal-platform/docker-compose.yml ps'"
echo.
echo ===================================================
echo   2. Checking Nginx Logs (Last 20 lines)
echo ===================================================
wsl bash -c "cd /mnt/d/SexAppeal-platform/ansible && ansible production -i inventory.ini -b -m command -a 'docker compose -f /opt/sexappeal-platform/docker-compose.yml logs --tail=20 nginx'"
echo.
echo ===================================================
echo   3. Checking App Logs (Last 20 lines)
echo ===================================================
wsl bash -c "cd /mnt/d/SexAppeal-platform/ansible && ansible production -i inventory.ini -b -m command -a 'docker compose -f /opt/sexappeal-platform/docker-compose.yml logs --tail=20 app'"
echo.
pause