#!/usr/bin/env bash
# Start API backend only (localhost).

set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

if [[ "${1:-}" == "--kill" ]] || [[ "${1:-}" == "-k" ]]; then
  kill_port "$BACKEND_PORT"
fi

ensure_deps
trap 'kill_port "$BACKEND_PORT"; exit 0' EXIT INT TERM

print_banner "Booking — backend only"
echo "  API: http://localhost:${BACKEND_PORT}"
echo ""

run_backend "127.0.0.1" "http://localhost:${FRONTEND_PORT}"
