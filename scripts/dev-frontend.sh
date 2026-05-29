#!/usr/bin/env bash
# Start dashboard frontend only.

set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

if [[ "${1:-}" == "--kill" ]] || [[ "${1:-}" == "-k" ]]; then
  kill_port "$FRONTEND_PORT"
fi

ensure_deps
trap 'kill_port "$FRONTEND_PORT"; exit 0' EXIT INT TERM

print_banner "Booking — frontend only"
echo "  Dashboard: http://localhost:${FRONTEND_PORT}"
echo ""

run_frontend "" "http://localhost:${BACKEND_PORT}" ""
