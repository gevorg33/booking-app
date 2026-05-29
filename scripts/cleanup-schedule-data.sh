#!/usr/bin/env bash
# Removes all schedule infrastructure and appointments; keeps customers, services, employees.
# Usage: CONFIRM=1 ./scripts/cleanup-schedule-data.sh [business_id]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-gevorggasparyan}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-booking_platform}"
BUSINESS_ID="${1:-}"

if [[ "${CONFIRM:-}" != "1" ]]; then
  echo "This will DELETE all schedule slots, periods, templates, blocks, bookings, and checkout drafts."
  echo "It KEEPS: businesses, users, customers, services, service categories, employees."
  echo ""
  echo "Re-run with: CONFIRM=1 $0 ${BUSINESS_ID:+(business_id)}"
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

SCOPE_WHERE=""
if [[ -n "$BUSINESS_ID" ]]; then
  SCOPE_WHERE="WHERE business_id = '$BUSINESS_ID'"
  echo "Scope: business_id=$BUSINESS_ID"
else
  echo "Scope: entire database (all businesses)"
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<EOSQL
BEGIN;

-- Appointments tied to time slots
DELETE FROM reviews
  ${SCOPE_WHERE:+WHERE booking_id IN (SELECT id FROM bookings $SCOPE_WHERE)}
  ${SCOPE_WHERE:-WHERE booking_id IS NOT NULL};

DELETE FROM bookings ${SCOPE_WHERE};
DELETE FROM booking_checkout_drafts ${SCOPE_WHERE};

-- Applied calendar + micro-slots
DELETE FROM block_schedule_instances ${SCOPE_WHERE};
DELETE FROM scheduling_slots ${SCOPE_WHERE};
DELETE FROM scheduling_periods ${SCOPE_WHERE};
DELETE FROM block_schedules ${SCOPE_WHERE};

-- Templates
DELETE FROM scheduling_template_periods
  WHERE template_id IN (SELECT id FROM schedule_templates ${SCOPE_WHERE});
DELETE FROM schedule_assignments
  WHERE template_id IN (SELECT id FROM schedule_templates ${SCOPE_WHERE})
     OR employee_id IN (SELECT id FROM employees ${SCOPE_WHERE});
DELETE FROM schedule_templates ${SCOPE_WHERE};
DELETE FROM schedule_overrides ${SCOPE_WHERE};

COMMIT;

SELECT
  (SELECT COUNT(*) FROM customers ${SCOPE_WHERE}) AS customers_kept,
  (SELECT COUNT(*) FROM services ${SCOPE_WHERE}) AS services_kept,
  (SELECT COUNT(*) FROM employees ${SCOPE_WHERE}) AS employees_kept,
  (SELECT COUNT(*) FROM scheduling_slots ${SCOPE_WHERE}) AS slots_remaining,
  (SELECT COUNT(*) FROM bookings ${SCOPE_WHERE}) AS bookings_remaining;
EOSQL

echo "Done."
