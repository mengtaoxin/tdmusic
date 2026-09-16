#!/usr/bin/env bash
# Stop Vite :3000, then start it async and wait 5s.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_LOG="${TDMUSIC_WEB_LOG:-/tmp/tdmusic-web.log}"
DEV_PORT=3000

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

bash "$SCRIPT_DIR/dev-stop.sh" && start_web_async && sleep 5

echo "start-dev: done (slept 5s). Check http://localhost:${DEV_PORT}"
