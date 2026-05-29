#!/usr/bin/env bash
# Start dashboard frontend + backend on localhost (default laptop-only dev).

set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

if [[ "${1:-}" == "--kill" ]] || [[ "${1:-}" == "-k" ]]; then
  dev_stop_ports
fi

print_banner "Booking — local dev (localhost only)"
echo "  Dashboard: http://localhost:${FRONTEND_PORT}"
echo "  API:       http://localhost:${BACKEND_PORT}"
echo ""

start_dev_pair \
  "127.0.0.1" \
  "http://localhost:${FRONTEND_PORT}" \
  "" \
  "http://localhost:${BACKEND_PORT}" \
  ""
