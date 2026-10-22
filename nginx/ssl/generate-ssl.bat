@echo off
echo Generating self-signed SSL certificate for localhost...
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "%~dp0localhost.key" -out "%~dp0localhost.crt" -subj "/C=VN/ST=Hanoi/L=Hanoi/O=PortfolioLab/OU=IT/CN=localhost"
echo SSL Certificate generated successfully!
pause
