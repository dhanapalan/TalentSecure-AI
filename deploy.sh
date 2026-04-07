#!/bin/bash
# GradLogic — One-command deploy script
# Usage: ./deploy.sh [api|all]
set -e

TARGET=${1:-api}
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Pulling latest code..."
git pull origin main

if [ "$TARGET" = "all" ] || [ "$TARGET" = "db" ]; then
  echo "==> Running DB migrations..."
  for f in docker/init-db/*.sql; do
    echo "  Applying $f..."
    docker exec -i talentsecure-postgres psql -U talentsecure -d talentsecure < "$f" 2>/dev/null || true
  done
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "api" ]; then
  echo "==> Building API..."
  $COMPOSE build api
  echo "==> Restarting API..."
  $COMPOSE up -d api
  echo "==> Waiting for API to start..."
  sleep 5
  echo "==> Health check..."
  curl -sf https://api.gradlogic.atherasys.com/api/health | jq '.status' || echo "Health check failed"
fi

echo "==> Done!"
