echo ===================================================
echo 🌱 Seeding Production Database with Treasures
echo ===================================================
ssh root@91.208.206.35 "docker exec sexappeal_app node seed.js"
echo ✅ Seeding complete! Refresh your production website.
pause