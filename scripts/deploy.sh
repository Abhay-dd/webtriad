#!/bin/bash
# scripts/deploy.sh — Legacy Docker Compose deployment script (not used on Render)
set -e

# Setup logging
LOG_FILE="/tmp/deployment.log"
exec > >(tee -ia $LOG_FILE) 2>&1

echo "=========================================="
echo "🚀 Deployment Started"
echo "Timestamp: $(date -u)"
echo "Current Branch: main"
echo "Commit SHA: ${COMMIT_SHA:-Unknown}"
echo "=========================================="
START_TIME=$(date +%s)

# Path configuration
PROJECT_DIR="$HOME/webtriad-main"
cd "$PROJECT_DIR"

# Step 1: Save current commit for rollback fallback
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo "Previous Commit SHA: $PREVIOUS_COMMIT"

# Step 2: Fetch and hard reset to latest origin/main
echo "▶ Pulling latest code..."
git fetch --all
git reset --hard origin/main

# Step 3: Write server environment variables to .env file
echo "▶ Configuring environment variables..."
cat <<EOF > .env
JWT_SECRET=${JWT_SECRET}
MONGO_URL=${MONGO_URI}
MONGO_URI=${MONGO_URI}
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
DEVELOPER_PASSWORD=${DEVELOPER_PASSWORD:-Dev@Triad2026!}
OWNER_PASSWORD=${OWNER_PASSWORD:-Own@Triad2026!}
STAFF_PASSWORD=${STAFF_PASSWORD:-Staff@Triad2026!}
SITE_URL=https://www.triadrealty.ae
EOF

# Step 4: Build new containers using docker compose
echo "▶ Building Docker containers (no cache)..."
docker compose build --no-cache

# Step 5: Stop running services and boot new containers
echo "▶ Restarting Docker containers..."
docker compose down
docker compose up -d --remove-orphans

# Step 6: Prune unused Docker images to save space
echo "▶ Pruning unused docker images..."
docker image prune -af

# Step 7: Run health checks
echo "▶ Executing health checks..."
if ! bash scripts/healthcheck.sh; then
  echo "❌ Health check failed! Initiating rollback..."
  bash scripts/rollback.sh "$PREVIOUS_COMMIT"
  exit 1
fi

# Step 8: Validate and reload Nginx
echo "▶ Validating and reloading Nginx..."
if [ -x "$(command -v nginx)" ]; then
  if sudo nginx -t; then
    echo "Nginx configuration valid. Reloading..."
    sudo systemctl reload nginx
  else
    echo "⚠️ Nginx configuration validation failed! Skipping Nginx reload to prevent downtime."
  fi
else
  echo "Nginx is not installed directly on host (or served inside Docker). Skipping host Nginx reload."
fi

# Step 9: Report final metrics
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=========================================="
echo "✅ Deployment Completed Successfully"
echo "Duration: ${DURATION} seconds"
echo "=========================================="
