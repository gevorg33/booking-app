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
echo "  API:       http://127.0.0.1:${BACKEND_PORT}"
echo ""

if ! wait_for_port "$BACKEND_PORT" "Backend" 3 2>/dev/null; then
  echo "  Warning: backend is not listening on port ${BACKEND_PORT}."
  echo "  Start it in another terminal: ./scripts/dev-backend.sh"
  echo ""
fi

run_frontend "" "http://127.0.0.1:${BACKEND_PORT}" ""
