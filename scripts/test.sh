#!/usr/bin/env bash
# Run unit and/or e2e tests.
# Usage:
#   ./scripts/test.sh                              # unit + e2e (chromium)
#   ./scripts/test.sh --platform chrome,firefox    # e2e platforms (comma-separated)
#   ./scripts/test.sh --file src/__tests__/App.spec.ts
#   ./scripts/test.sh --file e2e/vue.spec.ts --platform webkit
set -euo pipefail

# Cursor Agent may inject PLAYWRIGHT_BROWSERS_PATH at a sandbox cache.
# Clear it so e2e uses the normal user browser cache.
unset PLAYWRIGHT_BROWSERS_PATH

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/test.sh [--platform chrome|chromium|firefox|webkit|safari[,...]] [--file path/to/spec.ts]

E2E defaults to chromium only. Pass --platform with a comma-separated list to run more browsers.
Pass --file to run a single spec (paths under e2e/ use Playwright; otherwise Vitest).
EOF
  exit 1
}

# Require a non-empty value for --key / --key= forms. Reject another flag as the value.
require_value() {
  local flag="$1"
  local value="${2:-}"
  if [[ -z "$value" || "$value" == --* ]]; then
    echo "error: ${flag} requires a value" >&2
    usage
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
  echo "test: e2e (npm run test:e2e)${TDMUSIC_E2E_PLATFORMS:+ [${TDMUSIC_E2E_PLATFORMS}]}"
  (
    cd "$ROOT"
    env -u PLAYWRIGHT_BROWSERS_PATH npm run test:e2e
  )
}

run_one() {
  local target="$1"
  if [[ "$target" == e2e/* ]]; then
    echo "test: e2e (${target})${TDMUSIC_E2E_PLATFORMS:+ [${TDMUSIC_E2E_PLATFORMS}]}"
    (
      cd "$ROOT"
      env -u PLAYWRIGHT_BROWSERS_PATH npm run test:e2e -- "$target"
    )
  else
    echo "test: unit (${target})"
    (
      cd "$ROOT"
      npx vitest run -- "$target"
    )
  fi
}

PLATFORM_RAW=""
FILE_RAW=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)
      require_value "$1" "${2:-}"
      PLATFORM_RAW="$2"
      shift 2
      ;;
    --platform=*)
      PLATFORM_RAW="${1#--platform=}"
      require_value "--platform" "$PLATFORM_RAW"
      shift
      ;;
    --file)
      require_value "$1" "${2:-}"
      FILE_RAW="$2"
      shift 2
      ;;
    --file=*)
      FILE_RAW="${1#--file=}"
      require_value "--file" "$FILE_RAW"
      shift
      ;;
    -h | --help)
      usage
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [[ -n "$PLATFORM_RAW" ]]; then
  export TDMUSIC_E2E_PLATFORMS="$PLATFORM_RAW"
fi

if [[ -z "$FILE_RAW" ]]; then
  run_unit_all
  run_e2e_all
  echo "test: done"
  exit 0
fi

run_one "$FILE_RAW"
echo "test: done"
