#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/opt/tablojadoo}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tablojadoo}"
cd "$APP_DIR"
set -a
source .env
set +a
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/tablojadoo-$STAMP.sql.gz"
docker compose --env-file .env -f docker-compose.production.yml exec -T db sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" --single-transaction --routines --triggers' | gzip -9 > "$FILE"
find "$BACKUP_DIR" -type f -name 'tablojadoo-*.sql.gz' -mtime +14 -delete
chmod 600 "$FILE"
echo "$FILE"
