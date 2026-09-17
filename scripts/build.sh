#!/usr/bin/env bash
# Production build (type-check + vite build → dist/).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/build.sh

Production build (type-check + vite build → dist/).
Named flags only; this script accepts --help only.
EOF
  exit "${1:-1}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage 0
      ;;
    --*)
      tdmusic_unknown_arg "$1"
      ;;
    *)
      tdmusic_unexpected_positional "$1"
      ;;
  esac
done

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
