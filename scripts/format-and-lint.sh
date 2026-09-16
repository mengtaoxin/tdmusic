#!/usr/bin/env bash
# Format (Prettier) then lint (oxlint + eslint).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "format-and-lint: format (npm run format)"
(
  cd "$ROOT"
  npm run format
)

echo "format-and-lint: lint (npm run lint)"
(
  cd "$ROOT"
  npm run lint
)

echo "format-and-lint: done"
