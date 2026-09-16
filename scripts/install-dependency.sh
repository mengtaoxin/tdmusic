#!/usr/bin/env bash
# Install npm dependencies and Playwright browsers.
set -euo pipefail

# Cursor Agent may inject PLAYWRIGHT_BROWSERS_PATH at a sandbox cache.
# Clear it so browsers install into the normal user cache.
unset PLAYWRIGHT_BROWSERS_PATH

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
  env -u PLAYWRIGHT_BROWSERS_PATH npx playwright install
)

echo "install: done"
