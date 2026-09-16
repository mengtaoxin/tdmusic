#!/usr/bin/env bash
# Production build (type-check + vite build → dist/).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "build: npm run build"
(
  cd "$ROOT"
  npm run build
)

if [[ ! -d "$ROOT/dist" ]]; then
  echo "error: missing dist after build: $ROOT/dist" >&2
  exit 1
fi

echo "build: done → $ROOT/dist"
