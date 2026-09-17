#!/usr/bin/env bash
# Format (Prettier) then lint-fix (oxlint + eslint).
# Default writes files (prettier --write, lint --fix). Pass --check for read-only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/format.sh [--check]

Default: write files (prettier --write, lint --fix).
--check: check only, do not write files.
Named flags only (--key value or --key=value); order does not matter.
EOF
  exit "${1:-1}"
}

CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)
      CHECK=1
      shift
      ;;
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

if [[ "$CHECK" -eq 1 ]]; then
  echo "format: check (prettier --check, lint without --fix)"
  (
    cd "$ROOT"
    npx prettier --check --experimental-cli src/ e2e/ scripts/lib/
    npx oxlint .
    npx eslint . --cache
  )
else
  echo "format: prettier --write (npm run format)"
  (
    cd "$ROOT"
    npm run format
  )

  echo "format: lint --fix (npm run lint)"
  (
    cd "$ROOT"
    npm run lint
  )
fi

echo "format: done"
