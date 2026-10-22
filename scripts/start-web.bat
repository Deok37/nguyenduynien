@echo off
title Portfolio Web Server
cd /d "%~dp0\..\app"
echo ========================================================
echo KHOI DONG WEBSITE PORTFOLIO (LOCAL STANDALONE MODE)
echo ========================================================
echo Web App dang chay tai: http://localhost:3000
echo Trang quan tri CMS:    http://localhost:3000/admin
echo Dang nhap:             admin / Admin@Secure2024!
echo ========================================================
start http://localhost:3000
node server.js
pause
