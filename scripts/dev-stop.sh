#!/usr/bin/env bash
# Stop Vite listener on :3000 only (no start).
set -euo pipefail

DEV_PORT=3000

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
