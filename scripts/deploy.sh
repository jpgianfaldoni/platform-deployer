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

# Get current commit info for the deploy message
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)

echo "Deploying $DEPLOY_DIR to $BRANCH branch..."
echo "  Source commit: $COMMIT_SHA - $COMMIT_MSG"

# Use a temp directory to avoid polluting the working tree
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Copy deploy contents to temp
cp -r "$DEPLOY_DIR"/. "$TEMP_DIR"/

# Initialize a fresh git repo in temp, commit, and force-push to gh-pages
cd "$TEMP_DIR"
git init -q
git checkout -q -b "$BRANCH"
git add -A
git commit -q -m "Deploy $COMMIT_SHA: $COMMIT_MSG"

# Push to the remote gh-pages branch
REMOTE_URL=$(cd - > /dev/null && git remote get-url "$REMOTE")
git push -f "$REMOTE_URL" "$BRANCH"

echo "Deployed successfully to $BRANCH branch."
