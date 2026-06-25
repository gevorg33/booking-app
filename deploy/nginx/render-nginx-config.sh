#!/usr/bin/env bash
# Render deploy/nginx templates with BOOKING_ROOT_DOMAIN and upstream hosts.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE="${1:-self-hosted}"

ROOT_DOMAIN="${BOOKING_ROOT_DOMAIN:-}"
FRONTEND_UPSTREAM="${BOOKING_FRONTEND_UPSTREAM:-127.0.0.1:3000}"
API_UPSTREAM="${BOOKING_API_UPSTREAM:-127.0.0.1:3001}"

if [[ -z "$ROOT_DOMAIN" ]]; then
  echo "Set BOOKING_ROOT_DOMAIN (e.g. example.com)" >&2
  exit 1
fi

case "$TEMPLATE" in
  self-hosted)
    SRC="$REPO_ROOT/deploy/nginx/booking.conf"
    OUT="${2:-$REPO_ROOT/deploy/nginx/booking.rendered.conf}"
  ;;
  docker)
    SRC="$REPO_ROOT/deploy/nginx/booking.docker.conf"
    OUT="${2:-$REPO_ROOT/deploy/nginx/booking.rendered.conf}"
  ;;
  vercel-railway)
    if [[ -z "${BOOKING_FRONTEND_UPSTREAM:-}" || -z "${BOOKING_API_UPSTREAM:-}" ]]; then
      echo "For vercel-railway template set BOOKING_FRONTEND_UPSTREAM and BOOKING_API_UPSTREAM" >&2
      exit 1
    fi
    SRC="$REPO_ROOT/deploy/nginx/booking.vercel-railway.conf"
    OUT="${2:-$REPO_ROOT/deploy/nginx/booking.rendered.conf}"
  ;;
  *)
    echo "Usage: $0 [self-hosted|docker|vercel-railway] [output-file]" >&2
    exit 1
  ;;
esac

sed \
  -e "s/BOOKING_ROOT_DOMAIN/${ROOT_DOMAIN}/g" \
  -e "s/BOOKING_FRONTEND_UPSTREAM/${FRONTEND_UPSTREAM}/g" \
  -e "s/BOOKING_API_UPSTREAM/${API_UPSTREAM}/g" \
  "$SRC" > "$OUT"

echo "Wrote $OUT"
