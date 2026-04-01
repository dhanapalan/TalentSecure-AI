#!/bin/bash
# =============================================================================
# TalentSecure AI — VPS Setup Script
# OS: Ubuntu 22.04 LTS
# Run as: sudo bash setup-vps.sh
#
# Pre-requisites (do BEFORE running this):
#   1. Supabase project created  → supabase.com
#   2. Upstash Redis created     → upstash.com
#   3. DNS A records pointing to this VPS IP:
#      atherasys.com, www, admin, campus, exam, api
# =============================================================================

set -e

DOMAIN="gradlogic.atherasys.com"
APP_DIR="/opt/talentsecure"
REPO_URL="https://github.com/dhanapalan/TalentSecure-AI.git"

echo "======================================================"
echo "  TalentSecure AI — VPS Deployment"
echo "======================================================"

# ── 1. System packages ────────────────────────────────────────────────────────
echo ""
echo "==> [1/6] Installing system packages..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx

# ── 2. Docker ─────────────────────────────────────────────────────────────────
echo ""
echo "==> [2/6] Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker && systemctl start docker

# ── 3. Clone repo ─────────────────────────────────────────────────────────────
echo ""
echo "==> [3/6] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 4. Environment setup ──────────────────────────────────────────────────────
echo ""
echo "==> [4/6] Setting up .env..."
if [ ! -f .env ]; then
  cp .env.prod.example .env
  echo ""
  echo "  ┌──────────────────────────────────────────────────────────┐"
  echo "  │  STOP: Edit .env before continuing                       │"
  echo "  │                                                           │"
  echo "  │  nano $APP_DIR/.env                                       │"
  echo "  │                                                           │"
  echo "  │  Required values:                                         │"
  echo "  │  • PG_HOST / DATABASE_URL   (from Supabase dashboard)    │"
  echo "  │  • REDIS_URL                (from Upstash dashboard)     │"
  echo "  │  • JWT_SECRET               (openssl rand -base64 64)    │"
  echo "  │  • REFRESH_TOKEN_SECRET     (openssl rand -base64 64)    │"
  echo "  │  • S3_* keys                (from Supabase Storage)      │"
  echo "  │  • OPENAI_API_KEY                                         │"
  echo "  │  • SMTP_* credentials                                     │"
  echo "  └──────────────────────────────────────────────────────────┘"
  echo ""
  read -p "  Press ENTER after saving .env to continue..."
fi
chmod 600 .env

# ── 5. Nginx + SSL ────────────────────────────────────────────────────────────
echo ""
echo "==> [5/6] Configuring Nginx + SSL..."
cp deploy/nginx-atherasys.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default

# Temporarily serve HTTP so Certbot can validate
sed -i 's/return 301 https/# return 301 https/' /etc/nginx/sites-available/$DOMAIN
nginx -t && systemctl reload nginx

certbot --nginx \
  -d "$DOMAIN" \
  -d "admin.$DOMAIN" \
  -d "campus.$DOMAIN" \
  -d "exam.$DOMAIN" \
  -d "api.$DOMAIN" \
  --non-interactive --agree-tos -m "admin@atherasys.com"

# Re-enable redirect
sed -i 's/# return 301 https/return 301 https/' /etc/nginx/sites-available/$DOMAIN
nginx -t && systemctl reload nginx

# ── 6. Start Docker services ──────────────────────────────────────────────────
echo ""
echo "==> [6/6] Building and starting Docker services..."
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "======================================================"
echo "  Deployment complete!"
echo ""
echo "  https://$DOMAIN              → Public site"
echo "  https://admin.$DOMAIN        → Super admin portal"
echo "  https://campus.$DOMAIN       → Campus portal"
echo "  https://exam.$DOMAIN         → Student exam portal"
echo "  https://api.$DOMAIN/api/health → API health check"
echo ""
echo "  Logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "======================================================"
