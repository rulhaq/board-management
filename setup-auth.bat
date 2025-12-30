@echo off
echo Setting up Firebase Authentication users...
echo.

echo Creating admin user...
call firebase auth:import admin-user.json --hash-algo=HMAC_SHA256 --hash-key=secretKey

echo.
echo ✅ Firebase Auth setup complete!
echo.
echo 📋 Demo Credentials:
echo 👤 Admin: admin@sidra.com / admin123
echo 📝 Secretary: secretary@sidra.com / sec123  
echo 🏥 Board Members: dr.khalil@sidra.com / board123
echo    (All board members use password: board123)
echo.
pause 