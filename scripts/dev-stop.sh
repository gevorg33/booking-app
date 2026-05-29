#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib/dev-common.sh"

dev_stop_ports
echo "Stopped dev servers on ports ${FRONTEND_PORT} and ${BACKEND_PORT} (if any were running)."
