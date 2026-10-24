#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "========================================================"
echo "KHOI TAO GIT REPOSITORY VA TAO 03 COMMITS THEO DUNG DE BAI"
echo "Mon: Trien khai va Quan tri He thong Phan mem - De tai 13"
echo "========================================================"

if [ ! -d ".git" ]; then
    echo "[*] Khoi tao Git repository..."
    git init
    git branch -M main
fi

git config user.name "Nguyen Duy Nien"
git config user.email "ducshin.dev@gmail.com"

echo ""
echo "=== GIAI DOAN 1: TAO COMMIT 1 (Web, DB, phpMyAdmin, Nginx) ==="
git add .gitignore .env.example database/ app/ nginx/ scripts/
git commit -m "feat(init): trien khai website portfolio, mysql, phpmyadmin va nginx reverse proxy https" || true

echo ""
echo "=== GIAI DOAN 2: TAO COMMIT 2 (Prometheus, Grafana, Exporters) ==="
git add prometheus/ grafana/
git commit -m "feat(monitoring): tich hop he thong giam sat prometheus va grafana dashboard" || true

echo ""
echo "=== GIAI DOAN 3: TAO COMMIT 3 (Loki, Promtail, Hardening, Docs) ==="
git add loki/ promtail/ docker-compose.yml docs/ README.md
git commit -m "feat(logging-hardening): tich hop he thong log loki promtail, logql queries va hardening bao mat he thong" || true

echo ""
echo "========================================================"
echo "[THANH CONG] Da tao xong 03 commits. Kiem tra lich su git:"
echo "========================================================"
git log --oneline --graph -n 3
