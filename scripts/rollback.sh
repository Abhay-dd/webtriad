#!/bin/bash
# scripts/rollback.sh — Rollback script to restore the previous stable commit
set -e

ROLLBACK_COMMIT=$1

if [ -z "$ROLLBACK_COMMIT" ]; then
  echo "❌ No rollback commit SHA provided!"
  exit 1
fi

echo "=========================================="
echo "⚠️ Initiating Automatic Rollback"
echo "Target Commit SHA: $ROLLBACK_COMMIT"
echo "=========================================="

PROJECT_DIR="$HOME/webtriad-main"
cd "$PROJECT_DIR"

echo "▶ Resetting codebase to $ROLLBACK_COMMIT..."
git reset --hard "$ROLLBACK_COMMIT"

echo "▶ Rebuilding target containers..."
docker compose build --no-cache

echo "▶ Restarting containers with stable commit..."
docker compose down
docker compose up -d --remove-orphans

echo "▶ Verifying rolled back state..."
if [ "$(docker inspect -f '{{.State.Running}}' triad-app)" = "true" ]; then
  echo "✅ triad-app successfully restored to stable state."
else
  echo "❌ triad-app restore failed."
fi

echo "=========================================="
echo "⚠️ Rollback Completed"
echo "=========================================="
exit 0
