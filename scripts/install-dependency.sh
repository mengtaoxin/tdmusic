#!/usr/bin/env bash
# Install npm dependencies and Playwright browsers.
set -euo pipefail

# Cursor Agent may inject PLAYWRIGHT_BROWSERS_PATH at a sandbox cache.
# Clear it so browsers install into the normal user cache.
unset PLAYWRIGHT_BROWSERS_PATH

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/install-dependency.sh [--browsers chrome|chromium|firefox|webkit|safari|all[,...]]

Default: npm install, then Playwright Chromium only.
--browsers all installs chromium, firefox, and webkit.
Named flags only (--key value or --key=value); order does not matter.
EOF
  exit "${1:-1}"
}

BROWSERS_RAW=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --browsers)
      tdmusic_require_value "$1" "${2:-}"
      BROWSERS_RAW="$2"
      shift 2
      ;;
    --browsers=*)
      BROWSERS_RAW="${1#--browsers=}"
      tdmusic_require_value "--browsers" "$BROWSERS_RAW"
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

BROWSERS_CSV="$(tdmusic_node_cli resolve-browsers "$BROWSERS_RAW")"
# shellcheck disable=SC2206
BROWSERS=(${BROWSERS_CSV//,/ })

echo "install: npm install"
(
  cd "$ROOT"
  npm install
)

echo "install: playwright browsers (${BROWSERS_CSV})"
(
  cd "$ROOT"
  env -u PLAYWRIGHT_BROWSERS_PATH npx playwright install "${BROWSERS[@]}"
)

echo "install: done"
