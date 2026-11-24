#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/tablojadoo}"
cd "$(dirname "$0")/.."
SOURCE_DIR="$PWD"

if [[ $EUID -ne 0 ]]; then
  echo "این اسکریپت باید با root اجرا شود: sudo bash scripts/vps-install.sh" >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
}
command -v docker compose >/dev/null 2>&1 || {
  echo "Docker Compose Plugin نصب نیست؛ Docker جدید را نصب کنید و دوباره اجرا کنید." >&2
  exit 1
}

mkdir -p "$APP_DIR"
rsync -a --delete --exclude .env --exclude node_modules --exclude .git "$SOURCE_DIR/" "$APP_DIR/"
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  cat >&2 <<'MSG'
فایل /opt/tablojadoo/.env ساخته شد. مقادیر واقعی MANUS_PROJECT_ID، MANUS_JWT_SECRET و MANUS_API_KEY را وارد کنید، سپس دوباره همین اسکریپت را اجرا کنید.
برای اجرای compose نیز MYSQL_PASSWORD و MYSQL_ROOT_PASSWORD را در .env قرار دهید.
MSG
  exit 2
fi

chmod 600 .env
docker compose --env-file .env -f docker-compose.production.yml up -d --build
docker compose --env-file .env -f docker-compose.production.yml ps
printf '\nنصب انجام شد. اپ روی http://127.0.0.1:%s اجراست.\n' "${APP_PORT:-3000}"
