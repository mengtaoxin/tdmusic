#!/usr/bin/env bash
# Stop Vite listener on :3000 only (no start).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

DEV_PORT=3000

usage() {
  cat <<'EOF'
Usage:
  ./scripts/dev-stop.sh

Stop the Vite listener on :3000.
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

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    echo "port $port: idle"
    return 0
  fi
  echo "port $port: stopping PIDs $pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.3
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

stop_port "$DEV_PORT"
echo "stop-dev: stopped :${DEV_PORT}"
