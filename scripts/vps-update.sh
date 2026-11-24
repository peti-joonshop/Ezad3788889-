#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/opt/tablojadoo}"
cd "$APP_DIR"
[[ -f .env ]] || { echo ".env پیدا نشد" >&2; exit 1; }
docker compose --env-file .env -f docker-compose.production.yml up -d --build
docker compose --env-file .env -f docker-compose.production.yml ps
curl --fail --silent --show-error http://127.0.0.1:${APP_PORT:-3000}/api/health
printf '\nUpdate موفق بود.\n'
