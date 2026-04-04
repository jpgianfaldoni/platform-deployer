#!/usr/bin/env bash
set -euo pipefail

# Deploy the ./deploy directory to the gh-pages branch
# Usage: bash scripts/deploy.sh

DEPLOY_DIR="deploy"
BRANCH="gh-pages"
REMOTE="origin"

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Error: $DEPLOY_DIR directory not found"
  exit 1
fi

# Run tests before deploying
echo "Running tests before deploy..."
bash scripts/test.sh
echo "All tests passed."
echo ""

# Get current commit info for the deploy message
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
REMOTE_URL=$(git remote get-url "$REMOTE")

echo "Deploying $DEPLOY_DIR to $BRANCH branch..."
echo "  Source commit: $COMMIT_SHA - $COMMIT_MSG"

# Copy deploy/ to a temp git repo and push as gh-pages
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

cp -r "$DEPLOY_DIR"/. "$TEMP_DIR"/
cd "$TEMP_DIR"
git init -q
git checkout -q -b "$BRANCH"
git add -A
git commit -q -m "Deploy $COMMIT_SHA: $COMMIT_MSG"
git push -f "$REMOTE_URL" "$BRANCH"

echo "Deployed successfully to $BRANCH branch."
