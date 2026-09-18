#!/usr/bin/env bash
# Stop Vite :3000, start it async, wait until listening.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

DEV_PORT=3000
WAIT_TIMEOUT_SEC=30

usage() {
  cat <<'EOF' >&2
Usage:
  ./scripts/dev-start.sh
EOF
  exit "${1:-1}"
}

expand_equals "$@"
set -- "${ARGS[@]+"${ARGS[@]}"}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help) usage 0 ;;
    *) reject_extra "$1" ;;
  esac
done

# New session via os.setsid so agent Shell cleanup cannot reap children (macOS).
run_detached() {
  python3 -c 'import os, sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' "$@" &
}

bash "$SCRIPT_DIR/dev-stop.sh"
(cd "$ROOT" && run_detached npm run dev >/dev/null 2>&1)
echo "web: starting async"

start="$(date +%s)"
while true; do
  if lsof -tiTCP:"$DEV_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "start-dev: done. Check http://localhost:${DEV_PORT}"
    exit 0
  fi
  if (( $(date +%s) - start >= WAIT_TIMEOUT_SEC )); then
    echo "error: Vite did not listen on :${DEV_PORT} within ${WAIT_TIMEOUT_SEC}s" >&2
    exit 1
  fi
  sleep 0.1
done
