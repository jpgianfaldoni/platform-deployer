#!/usr/bin/env bash
set -euo pipefail

# Run Playwright E2E tests (installs browsers if needed)
# Usage: bash scripts/test.sh [test-file-or-playwright-args...]
#
# Examples:
#   bash scripts/test.sh                              # run all tests
#   bash scripts/test.sh tests/e2e/basic.spec.js      # run a single test file
#   bash scripts/test.sh --headed                      # run with browser visible

# Ensure Playwright browsers are installed
npx playwright install --with-deps chromium 2>/dev/null || true

if [ $# -eq 0 ]; then
  npx playwright test
else
  npx playwright test "$@"
fi
