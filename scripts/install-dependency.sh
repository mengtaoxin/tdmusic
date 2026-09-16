#!/usr/bin/env bash
# Install npm dependencies and Playwright browsers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "install: npm install"
(
  cd "$ROOT"
  npm install
)

echo "install: playwright browsers"
(
  cd "$ROOT"
  npx playwright install
)

echo "install: done"
