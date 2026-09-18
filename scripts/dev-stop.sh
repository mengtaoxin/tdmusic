#!/usr/bin/env bash
# Stop Vite listener on :3000.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

DEV_PORT=3000

usage() {
  cat <<'EOF' >&2
Usage:
  ./scripts/dev-stop.sh
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

pids="$(lsof -tiTCP:"$DEV_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -z "$pids" ]]; then
  echo "port $DEV_PORT: idle"
else
  echo "port $DEV_PORT: stopping PIDs $pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.3
  pids="$(lsof -tiTCP:"$DEV_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
fi

echo "stop-dev: stopped :${DEV_PORT}"
