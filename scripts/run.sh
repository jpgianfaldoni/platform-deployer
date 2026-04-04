#!/usr/bin/env bash
set -euo pipefail

# Start a local dev server for the PWA
# Usage: bash scripts/run.sh [port]

PORT="${1:-8000}"
DEPLOY_DIR="deploy"

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Error: $DEPLOY_DIR directory not found"
  exit 1
fi

echo "Serving PWA at http://localhost:$PORT"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT" -d "$DEPLOY_DIR"
