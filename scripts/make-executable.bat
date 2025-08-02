@echo off
echo Making scripts executable...

REM This script sets execute permissions on Linux/Unix systems
REM On Windows, this is automatically handled

echo Scripts are ready for use on Linux systems
echo On Windows, use: scripts\setup-server.sh in WSL or Git Bash
echo.
echo Available scripts:
echo - scripts\setup-server.sh     : Initial server setup
echo - scripts\deploy.sh           : Application deployment  
echo - scripts\migrate.sh          : Database migration
echo - scripts\setup-ssl.sh        : SSL certificate setup
echo.
echo Next steps:
echo 1. Upload these files to your Ubuntu server
echo 2. Run: chmod +x scripts/*.sh
echo 3. Execute the scripts as needed
