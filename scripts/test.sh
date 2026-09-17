#!/usr/bin/env bash
# Run unit and/or e2e tests.
# Usage:
#   ./scripts/test.sh                              # unit + e2e (chromium)
#   ./scripts/test.sh --layer unit
#   ./scripts/test.sh --platform chrome,firefox    # e2e platforms (comma-separated)
#   ./scripts/test.sh --file src/__tests__/App.spec.ts
#   ./scripts/test.sh --file e2e/vue.spec.ts --platform webkit
set -euo pipefail

# Cursor Agent may inject PLAYWRIGHT_BROWSERS_PATH at a sandbox cache.
# Clear it so e2e uses the normal user browser cache.
unset PLAYWRIGHT_BROWSERS_PATH

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/test.sh [--layer unit|e2e|all] [--file path/to/spec.ts] [--platform chrome|chromium|firefox|webkit|safari[,...]]

Named flags only (--key value or --key=value); order does not matter.
Default (no --file): --layer all (unit, then e2e on chromium).
--file runs one spec (paths under e2e/ use Playwright; otherwise Vitest).
--layer all cannot be combined with --file.
--platform is e2e only.
EOF
  exit "${1:-1}"
}

run_unit_all() {
  echo "test: unit (vitest run)"
  (
    cd "$ROOT"
    npx vitest run
  )
}

run_e2e_all() {
  echo "test: e2e (playwright test)${TDMUSIC_E2E_PLATFORMS:+ [${TDMUSIC_E2E_PLATFORMS}]}"
  (
    cd "$ROOT"
    env -u PLAYWRIGHT_BROWSERS_PATH npx playwright test
  )
}

run_one() {
  local target="$1"
  local kind="$2"
  if [[ "$kind" == e2e ]]; then
    echo "test: e2e (${target})${TDMUSIC_E2E_PLATFORMS:+ [${TDMUSIC_E2E_PLATFORMS}]}"
    (
      cd "$ROOT"
      env -u PLAYWRIGHT_BROWSERS_PATH npx playwright test -- "$target"
    )
  else
    echo "test: unit (${target})"
    (
      cd "$ROOT"
      npx vitest run "$target"
    )
  fi
}

LAYER_RAW=""
FILE_RAW=""
PLATFORM_RAW=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --layer)
      tdmusic_require_value "$1" "${2:-}"
      LAYER_RAW="$2"
      shift 2
      ;;
    --layer=*)
      LAYER_RAW="${1#--layer=}"
      tdmusic_require_value "--layer" "$LAYER_RAW"
      shift
      ;;
    --platform)
      tdmusic_require_value "$1" "${2:-}"
      PLATFORM_RAW="$2"
      shift 2
      ;;
    --platform=*)
      PLATFORM_RAW="${1#--platform=}"
      tdmusic_require_value "--platform" "$PLATFORM_RAW"
      shift
      ;;
    --file)
      tdmusic_require_value "$1" "${2:-}"
      FILE_RAW="$2"
      shift 2
      ;;
    --file=*)
      FILE_RAW="${1#--file=}"
      tdmusic_require_value "--file" "$FILE_RAW"
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

if [[ -n "$LAYER_RAW" ]]; then
  case "$LAYER_RAW" in
    unit | e2e | all) ;;
    *)
      echo "error: unknown layer: ${LAYER_RAW} (expected unit, e2e, or all)" >&2
      usage 1
      ;;
  esac
fi

if [[ -n "$PLATFORM_RAW" ]]; then
  tdmusic_node_cli resolve-platforms "$PLATFORM_RAW" >/dev/null
  export TDMUSIC_E2E_PLATFORMS="$PLATFORM_RAW"
fi

FILE_KIND=""
if [[ -n "$FILE_RAW" ]]; then
  FILE_KIND="$(tdmusic_node_cli classify-file "$ROOT" "$FILE_RAW")"
fi

if [[ -n "$FILE_RAW" && "$LAYER_RAW" == all ]]; then
  echo "error: --layer all cannot be combined with --file" >&2
  usage 1
fi

if [[ -n "$FILE_RAW" && -n "$LAYER_RAW" && "$LAYER_RAW" != "$FILE_KIND" ]]; then
  echo "error: --layer ${LAYER_RAW} does not match --file (${FILE_KIND})" >&2
  usage 1
fi

LAYER="${LAYER_RAW}"
if [[ -n "$FILE_RAW" ]]; then
  LAYER="$FILE_KIND"
elif [[ -z "$LAYER" ]]; then
  LAYER="all"
fi

if [[ -n "$PLATFORM_RAW" && "$LAYER" == unit ]]; then
  echo "error: --platform is only valid when running e2e tests" >&2
  usage 1
fi

if [[ -n "$FILE_RAW" ]]; then
  run_one "$FILE_RAW" "$FILE_KIND"
elif [[ "$LAYER" == unit ]]; then
  run_unit_all
elif [[ "$LAYER" == e2e ]]; then
  run_e2e_all
else
  run_unit_all
  run_e2e_all
fi

echo "test: done"
