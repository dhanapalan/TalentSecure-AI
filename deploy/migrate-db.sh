#!/bin/bash
# =============================================================================
# Database Migration — Export from local Docker → import to VPS
# Run this on your LOCAL Windows machine (Git Bash / WSL)
# =============================================================================

VPS_IP="YOUR_VPS_IP"          # <-- replace with your VPS IP
VPS_USER="root"                # or your sudo user
APP_DIR="/opt/talentsecure"

echo "==> Exporting local PostgreSQL database..."
docker exec talentsecure-postgres pg_dump \
  -U talentsecure \
  -d talentsecure_db \
  --no-owner \
  --no-acl \
  -Fc \
  > ./talentsecure_db_backup.dump

echo "==> Backup size: $(du -sh talentsecure_db_backup.dump | cut -f1)"

echo "==> Uploading backup to VPS..."
scp talentsecure_db_backup.dump "$VPS_USER@$VPS_IP:/tmp/talentsecure_db_backup.dump"

echo "==> Importing database on VPS..."
ssh "$VPS_USER@$VPS_IP" bash << 'REMOTE'
  cd /opt/talentsecure

  # Wait for postgres container to be healthy
  echo "Waiting for postgres..."
  until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U talentsecure -d talentsecure_db; do
    sleep 2
  done

  # Restore
  docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_restore \
    -U talentsecure \
    -d talentsecure_db \
    --clean --if-exists --no-owner \
    < /tmp/talentsecure_db_backup.dump

  rm /tmp/talentsecure_db_backup.dump
  echo "Database import complete."
REMOTE

echo ""
echo "Done. Database migrated to VPS."
echo "Tip: run 'docker compose -f docker-compose.prod.yml logs api' on VPS to verify."
