#!/bin/bash
# =============================================================================
# GradLogic — Production Deploy Script
# Usage: bash deploy.sh
# =============================================================================

set -e  # exit on any error

DEPLOY_DIR="/opt/talentsecure"
COMPOSE_FILE="docker-compose.prod.yml"
DB_CONTAINER="talentsecure-postgres"
DB_USER="postgres"
DB_NAME="talentsecure"

echo ""
echo "============================================"
echo "  GradLogic Production Deploy"
echo "============================================"
echo ""

cd "$DEPLOY_DIR"

# ── 1. Remove any conflicting untracked files ─────────────────────────────────
echo "[1/5] Cleaning untracked migration files..."
rm -f server/migrations/phase1_lms_practice_development.sql
rm -f server/migrations/run_phase1.ts

# ── 2. Pull latest code ───────────────────────────────────────────────────────
echo "[2/5] Pulling latest code from GitHub..."
git pull origin main

# ── 3. Run DB migrations ──────────────────────────────────────────────────────
echo "[3/5] Running database migrations..."

if [ -f "server/migrations/phase1_lms_practice_development.sql" ]; then
  echo "  → Running Phase 1 migration (LMS, Practice, Development)..."
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    < server/migrations/phase1_lms_practice_development.sql
  echo "  ✓ Phase 1 migration done"
else
  echo "  ⚠ No new migrations found, skipping."
fi

# ── 4. Rebuild & restart containers ──────────────────────────────────────────
echo "[4/5] Rebuilding and restarting containers..."
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

# ── 5. Health check ───────────────────────────────────────────────────────────
echo "[5/5] Waiting for API health check..."
sleep 5

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/api/health || echo "000")

if [ "$STATUS" = "200" ]; then
  echo ""
  echo "✅ Deploy successful! API is healthy."
else
  echo ""
  echo "⚠ API health check returned HTTP $STATUS — check logs:"
  echo "  docker logs talentsecure-api --tail 50"
fi

echo ""
echo "============================================"
echo "  Done"
echo "============================================"
echo ""
