#!/usr/bin/env bash
# Start frontend + backend reachable on your LAN (phone / provider app on same Wi‑Fi).

set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

LAN_IP="${LAN_IP:-$(get_lan_ip)}"
if [[ -z "$LAN_IP" ]]; then
  echo "Could not detect LAN IP. Connect to Wi‑Fi or set it manually:"
  echo "  LAN_IP=192.168.x.x ./scripts/dev-lan.sh"
  exit 1
fi

if [[ "${1:-}" == "--kill" ]] || [[ "${1:-}" == "-k" ]]; then
  dev_stop_ports
fi

sync_provider_app_lan_env

CORS="http://localhost:${FRONTEND_PORT},http://${LAN_IP}:${FRONTEND_PORT}"
API_URL="http://${LAN_IP}:${BACKEND_PORT}"

print_banner "Booking — LAN dev (mobile + dashboard)"
echo "  LAN IP:    ${LAN_IP}"
echo "  Dashboard: http://${LAN_IP}:${FRONTEND_PORT}"
echo "  API:       ${API_URL}"
echo ""
echo "  Provider app: rebuild/sync after IP change (see scripts/README.md)"
echo "  Phone must be on the same Wi‑Fi network."
echo ""

start_dev_pair \
  "0.0.0.0" \
  "$CORS" \
  "0.0.0.0" \
  "$API_URL" \
  "$LAN_IP"
