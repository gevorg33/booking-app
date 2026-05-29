#!/usr/bin/env bash
# Shared helpers for local dev scripts.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
PROVIDER_APP_DIR="$REPO_ROOT/provider-app"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

get_lan_ip() {
  local ip=""
  if [[ "$(uname -s)" == "Darwin" ]]; then
    ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
    if [[ -z "$ip" ]]; then
      ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
    fi
  else
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  echo "$ip"
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti ":$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Stopping process(es) on port $port: $pids"
    kill $pids 2>/dev/null || kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
}

dev_stop_ports() {
  kill_port "$FRONTEND_PORT"
  kill_port "$BACKEND_PORT"
  pkill -f "next dev" 2>/dev/null || true
  rm -f "$FRONTEND_DIR/.next/dev/lock" 2>/dev/null || true
}

print_banner() {
  local title="$1"
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  $title"
  echo "════════════════════════════════════════════════════════════"
}

port_is_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local tries="${3:-90}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if port_is_listening "$port"; then
      echo "✓ $label listening on port $port"
      return 0
    fi
    sleep 1
  done
  echo "⚠ $label did not start on port $port within ${tries}s"
  return 1
}

ensure_deps() {
  use_project_node
  if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
    echo "Missing backend deps. Run: cd backend && npm install"
    exit 1
  fi
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "Missing frontend deps. Run: cd frontend && npm install"
    exit 1
  fi
}

use_project_node() {
  if [[ -f "$REPO_ROOT/.nvmrc" ]] && [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm use --silent 2>/dev/null || nvm use 2>/dev/null || true
  fi

  local version major minor patch
  version="$(node -v 2>/dev/null | sed 's/^v//')"
  if [[ -z "$version" ]]; then
    echo "Node.js is required. Install Node 20.9+ (recommended: 20.20.2 via nvm)."
    exit 1
  fi
  IFS=. read -r major minor patch <<< "$version"
  if (( major < 20 )) || { (( major == 20 )) && (( minor < 9 )); }; then
    echo "Node.js v${version} is too old for Next.js 16 (needs >= 20.9.0)."
    echo "Run: nvm install 20.20.2 && nvm use 20.20.2"
    exit 1
  fi
}

log_pipe() {
  local prefix="$1"
  while IFS= read -r line; do
    printf '[%s] %s\n' "$prefix" "$line"
  done
}

run_backend() {
  local host="${1:-0.0.0.0}"
  local cors="${2:-http://localhost:${FRONTEND_PORT}}"
  (
    cd "$BACKEND_DIR"
    export HOST="$host"
    export PORT="$BACKEND_PORT"
    export CORS_ORIGIN="$cors"
    export NODE_ENV="${NODE_ENV:-development}"
    npm run start:dev 2>&1 | log_pipe "backend"
  )
}

run_frontend() {
  local bind_host="${1:-}"
  local api_url="${2:-http://localhost:${BACKEND_PORT}}"
  local lan_host="${3:-}"
  (
    cd "$FRONTEND_DIR"
    export NEXT_PUBLIC_API_URL="$api_url"
    export LAN_HOST="$lan_host"
    if [[ -n "$bind_host" ]]; then
      npm run dev -- -H "$bind_host" -p "$FRONTEND_PORT" 2>&1 | log_pipe "frontend"
    else
      npm run dev -- -p "$FRONTEND_PORT" 2>&1 | log_pipe "frontend"
    fi
  )
}

sync_provider_app_lan_env() {
  if [[ ! -d "$PROVIDER_APP_DIR" ]]; then
    return 0
  fi
  echo "Updating provider-app LAN env..."
  (cd "$PROVIDER_APP_DIR" && bash scripts/prepare-env.sh)
}

cleanup_children() {
  local exit_code=$?
  dev_stop_ports
  exit "$exit_code"
}

start_dev_pair() {
  local backend_host="$1"
  local cors="$2"
  local frontend_bind="${3:-}"
  local api_url="${4:-http://localhost:${BACKEND_PORT}}"
  local lan_host="${5:-}"

  ensure_deps
  trap cleanup_children EXIT INT TERM

  echo "Starting backend (port ${BACKEND_PORT})..."
  run_backend "$backend_host" "$cors" &
  BACKEND_PID=$!

  sleep 2
  echo "Starting frontend (port ${FRONTEND_PORT})..."
  run_frontend "$frontend_bind" "$api_url" "$lan_host" &
  FRONTEND_PID=$!

  sleep 2
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "✗ Backend process exited immediately — check logs above."
    exit 1
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "✗ Frontend process exited immediately — check logs above."
    exit 1
  fi

  wait_for_port "$BACKEND_PORT" "Backend" 90 || true
  wait_for_port "$FRONTEND_PORT" "Frontend" 90 || true

  echo ""
  echo "Both servers running. Press Ctrl+C to stop."
  echo ""

  wait "$BACKEND_PID" "$FRONTEND_PID"
}
