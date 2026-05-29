#!/usr/bin/env bash
# Start backend only on LAN — for provider mobile app (no dashboard frontend).

set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

LAN_IP="${LAN_IP:-$(get_lan_ip)}"
if [[ -z "$LAN_IP" ]]; then
  echo "Could not detect LAN IP. Connect to Wi‑Fi or run:"
  echo "  LAN_IP=192.168.x.x ./scripts/dev-lan-backend.sh"
  exit 1
fi

if [[ "${1:-}" == "--kill" ]] || [[ "${1:-}" == "-k" ]]; then
  kill_port "$BACKEND_PORT"
fi

sync_provider_app_lan_env

API_URL="http://${LAN_IP}:${BACKEND_PORT}"
CORS="http://localhost:${FRONTEND_PORT},http://${LAN_IP}:${FRONTEND_PORT},capacitor://localhost,ionic://localhost"

print_banner "Booking — LAN backend only"
echo "  LAN IP: ${LAN_IP}"
echo "  API:    ${API_URL}"
echo ""
echo "  Provider app VITE_API_URL should match (run provider-app/scripts/prepare-env.sh)."
echo "  Press Ctrl+C to stop."
echo ""

trap 'kill ${BACKEND_PID:-} 2>/dev/null; exit 0' EXIT INT TERM

run_backend "0.0.0.0" "$CORS" &
BACKEND_PID=$!

wait_for_url "http://localhost:${BACKEND_PORT}" "Backend" 60
wait
