#!/bin/bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Generating self-signed SSL certificate for localhost..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/localhost.key" \
  -out "$DIR/localhost.crt" \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=PortfolioLab/OU=IT/CN=localhost"
chmod 600 "$DIR/localhost.key"
chmod 644 "$DIR/localhost.crt"
echo "SSL Certificate generated successfully!"
