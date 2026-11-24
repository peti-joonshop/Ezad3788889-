#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${N8N_DIR:-/opt/n8n}"
DOMAIN="${N8N_DOMAIN:-n8n.example.com}"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "با root اجرا کنید: sudo N8N_DOMAIN=n8n.yourdomain.ir bash scripts/install-n8n.sh" >&2
  exit 1
fi
command -v docker >/dev/null 2>&1 || { curl -fsSL https://get.docker.com | sh; systemctl enable --now docker; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose Plugin نصب نیست" >&2; exit 1; }

mkdir -p "$APP_DIR"
install -m 644 "$SOURCE_DIR/docker-compose.n8n.yml" "$APP_DIR/docker-compose.n8n.yml"
if [[ ! -f "$APP_DIR/.env.n8n" ]]; then
  umask 077
  cat > "$APP_DIR/.env.n8n" <<EOF
N8N_HOST=$DOMAIN
N8N_PORT=5678
GENERIC_TIMEZONE=Asia/Tehran
N8N_DB_NAME=n8n
N8N_DB_USER=n8n
N8N_DB_PASSWORD=$(openssl rand -hex 32)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
  echo "فایل $APP_DIR/.env.n8n ساخته شد و secretهای تصادفی دارد. دامنه را بررسی کنید." >&2
fi
chmod 600 "$APP_DIR/.env.n8n"
cd "$APP_DIR"
docker compose --env-file .env.n8n -f docker-compose.n8n.yml up -d

echo "n8n روی http://127.0.0.1:5678 اجرا شد. برای public access، deploy/nginx-n8n.conf را با دامنه $DOMAIN فعال و سپس certbot اجرا کنید."
