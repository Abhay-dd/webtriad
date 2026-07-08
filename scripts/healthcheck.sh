#!/bin/bash
# scripts/healthcheck.sh — Health Checks for Triad Realty Services
set -e

echo "▶ Starting health verification..."
MAX_ATTEMPTS=6
WAIT_SECONDS=10

# Helper function to check health endpoint
check_endpoint() {
  local url=$1
  local expected_status=$2
  local attempt=1

  while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "Checking $url (Attempt $attempt/$MAX_ATTEMPTS)..."
    STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$url" || echo "000")
    if [ "$STATUS" -eq "$expected_status" ]; then
      echo "✅ $url returned HTTP $expected_status"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep $WAIT_SECONDS
  done
  return 1
}

# 1. Verify Docker container status
echo "▶ Verifying Docker containers are running..."
if [ "$(docker inspect -f '{{.State.Running}}' triad-app)" != "true" ]; then
  echo "❌ triad-app container is not running!"
  exit 1
fi
if [ "$(docker inspect -f '{{.State.Running}}' triad-mongodb)" != "true" ]; then
  echo "❌ triad-mongodb container is not running!"
  exit 1
fi
echo "✅ All containers are running."

# 2. Verify backend api is healthy (HTTP 200)
# Inside docker, app is listening on port 8000
if ! check_endpoint "http://localhost:8000/api/settings/homepage" 200; then
  echo "❌ Backend health check failed!"
  exit 1
fi

# 3. Verify frontend serves sitemap/manifest successfully
if ! check_endpoint "http://localhost:8000/sitemap.xml" 200; then
  echo "❌ Frontend sitemap check failed!"
  exit 1
fi

# 4. Verify Nginx service is running on the host (if installed)
if [ -x "$(command -v systemctl)" ] && systemctl is-active --quiet nginx; then
  echo "✅ Nginx service is active on host."
else
  echo "⚠️ Nginx service is not active on host or systemctl is unavailable."
fi

echo "✅ All health checks passed successfully!"
exit 0
