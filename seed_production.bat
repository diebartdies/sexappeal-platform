echo ===================================================
echo 🌱 Seeding Production reference data (geo only — no users)
echo ===================================================
ssh root@91.208.206.35 "docker exec sexappeal_app node seed.js"
echo ✅ Geography seed complete. Users come from registrations or backup restore only.
pause