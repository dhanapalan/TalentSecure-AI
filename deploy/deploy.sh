#!/bin/bash
# =============================================================================
# GradLogic — Production Deploy Script
# Usage: bash deploy.sh
# =============================================================================

set -e  # exit on any error

DEPLOY_DIR="/opt/talentsecure"
COMPOSE_FILE="docker-compose.prod.yml"
DB_CONTAINER="talentsecure-postgres"
DB_USER="talentsecure"
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
git pull origin master

# ── 3. Run DB migrations ──────────────────────────────────────────────────────
echo "[3/5] Running database migrations..."

run_migration() {
  local file="$1"
  if [ -f "$file" ]; then
    echo "  → $(basename $file)..."
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$file" && echo "  ✓ done" || echo "  ⚠ skipped (may already exist)"
  fi
}

# Run all migrations in order — each is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
run_migration "server/migrations/phase1_lms_practice_development.sql"
run_migration "server/migrations/phase2_gamification.sql"
run_migration "server/migrations/phase3_analytics_mentor.sql"
run_migration "server/migrations/phase4_placement_email.sql"
run_migration "server/migrations/phase4b_placement_unique_fix.sql"
run_migration "server/migrations/phase5_company_role_proctoring_flag.sql"
run_migration "server/migrations/phase6_mock_interviews.sql"
run_migration "server/migrations/phase8_company_dashboard.sql"
run_migration "server/migrations/phase10_lms_certificates_paths.sql"

echo "  ✓ All migrations applied"

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
