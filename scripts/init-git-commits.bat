@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo KHOI TAO GIT REPOSITORY VA TAO 03 COMMITS THEO DUNG DE BAI
echo Mon: Trien khai va Quan tri He thong Phan mem - De tai 13
echo ========================================================

cd /d "%~dp0\.."

if not exist ".git" (
    echo [*] Khoi tao Git repository...
    git init
    git branch -M main
)

echo [*] Cau hinh thong tin tac gia Git...
git config user.name "Nguyen Duy Nien"
git config user.email "ducshin.dev@gmail.com"

echo.
echo ========================================================
echo GIAI DOAN 1: TAO COMMIT 1 (Web, DB, phpMyAdmin, Nginx)
echo ========================================================
git add .gitignore .env.example database/ app/ nginx/ scripts/
git commit -m "feat(init): trien khai website portfolio, mysql, phpmyadmin va nginx reverse proxy https"

echo.
echo ========================================================
echo GIAI DOAN 2: TAO COMMIT 2 (Prometheus, Grafana, Exporters)
echo ========================================================
git add prometheus/ grafana/
git commit -m "feat(monitoring): tich hop he thong giam sat prometheus va grafana dashboard"

echo.
echo ========================================================
echo GIAI DOAN 3: TAO COMMIT 3 (Loki, Promtail, Hardening, Docs)
echo ========================================================
git add loki/ promtail/ docker-compose.yml docs/ README.md
git commit -m "feat(logging-hardening): tich hop he thong log loki promtail, logql queries va hardening bao mat he thong"

echo.
echo ========================================================
echo [THANH CONG] Da tao xong 03 commits. Kiem tra lich su git:
echo ========================================================
git log --oneline --graph -n 3

echo.
echo De day len GitHub cua ban (ten theo MSSV):
echo   git remote add origin https://github.com/<MSSV>/portfolio-system.git
echo   git push -u origin main
echo ========================================================
pause
