#!/bin/bash
# =============================================================================
# Migrate schema + data to Supabase
# Run from LOCAL machine (Git Bash / WSL / Linux)
#
# Prerequisites:
#   - psql installed locally  (or use: docker run --rm -it postgres:16 psql)
#   - Supabase project created and DB password saved
# =============================================================================

# ── Fill these in ─────────────────────────────────────────────────────────────
SUPABASE_HOST="db.YOUR_PROJECT_REF.supabase.co"   # Settings → Database → Host
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PASSWORD="YOUR_SUPABASE_DB_PASSWORD"
# ─────────────────────────────────────────────────────────────────────────────

export PGPASSWORD="$SUPABASE_PASSWORD"
CONN="-h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB"

echo "==> [1/4] Running raw SQL schema scripts on Supabase..."
for f in docker/init-db/*.sql; do
  echo "    Applying: $f"
  psql $CONN -f "$f"
done

echo "==> [2/4] Running Prisma migration SQL on Supabase..."
psql $CONN -f "prisma/migrations/20260220152056_init/migration.sql"

echo "==> [3/4] Exporting data from local Docker PostgreSQL..."
docker exec talentsecure-postgres pg_dump \
  -U talentsecure \
  -d talentsecure_db \
  --data-only \
  --no-owner \
  --no-acl \
  -Fp \
  > /tmp/talentsecure_data_only.sql

echo "==> [4/4] Importing data into Supabase..."
psql $CONN -f /tmp/talentsecure_data_only.sql

echo ""
echo "Migration complete! Verify at: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor"
