#!/usr/bin/env bash
# Run unit and/or e2e tests.
# Usage:
#   ./scripts/test.sh                              # unit + e2e
#   ./scripts/test.sh --src/__tests__/App.spec.ts  # single unit file
#   ./scripts/test.sh e2e/vue.spec.ts              # single e2e file
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/test.sh
  ./scripts/test.sh [--]path/to/spec.ts
EOF
  exit 1
}

# Strip a leading "--" from optional file args (e.g. --src/__tests__/App.spec.ts).
strip_dashes() {
  local value="$1"
  if [[ "$value" == --* ]]; then
    printf '%s' "${value#--}"
  else
    printf '%s' "$value"
  fi
}

run_unit_all() {
  echo "test: unit (vitest run)"
  (
    cd "$ROOT"
    npx vitest run
  )
}

run_e2e_all() {
  echo "test: e2e (npm run test:e2e)"
  (
    cd "$ROOT"
    npm run test:e2e
  )
}

run_one() {
  local target="$1"
  if [[ "$target" == e2e/* ]]; then
    echo "test: e2e (${target})"
    (
      cd "$ROOT"
      npm run test:e2e -- "$target"
    )
  else
    echo "test: unit (${target})"
    (
      cd "$ROOT"
      npx vitest run -- "$target"
    )
  fi
}

FILTER_RAW="${1:-}"

if [[ -n "${2:-}" ]]; then
  usage
fi

if [[ -z "$FILTER_RAW" ]]; then
  run_unit_all
  run_e2e_all
  echo "test: done"
  exit 0
fi

FILTER="$(strip_dashes "$FILTER_RAW")"
if [[ -z "$FILTER" ]]; then
  usage
fi

run_one "$FILTER"
echo "test: done"
