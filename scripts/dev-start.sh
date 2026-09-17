#!/usr/bin/env bash
# Stop Vite :3000, then start it async and wait until the port is listening.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

WEB_LOG="${TDMUSIC_WEB_LOG:-/tmp/tdmusic-web.log}"
DEV_PORT=3000
WAIT_TIMEOUT_SEC=30

usage() {
  cat <<'EOF'
Usage:
  ./scripts/dev-start.sh

Stop any listener on :3000, start Vite, and wait until the port is ready.
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

# New session via os.setsid so agent Shell cleanup cannot reap children (macOS).
run_detached() {
  python3 -c 'import os, sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' "$@" &
}

start_web_async() {
  : >"$WEB_LOG"
  (
    cd "$ROOT"
    run_detached npm run dev >>"$WEB_LOG" 2>&1
  )
  echo "web: starting async (log: $WEB_LOG)"
}

wait_for_listen() {
  local port="$1"
  local timeout="$2"
  local start
  start="$(date +%s)"
  while true; do
    if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    if (( $(date +%s) - start >= timeout )); then
      return 1
    fi
    sleep 0.1
  done
}

bash "$SCRIPT_DIR/dev-stop.sh"
start_web_async

if ! wait_for_listen "$DEV_PORT" "$WAIT_TIMEOUT_SEC"; then
  echo "error: Vite did not listen on :${DEV_PORT} within ${WAIT_TIMEOUT_SEC}s" >&2
  echo "--- ${WEB_LOG} (tail) ---" >&2
  tail -n 50 "$WEB_LOG" >&2 || true
  exit 1
fi

echo "start-dev: done. Check http://localhost:${DEV_PORT}"
