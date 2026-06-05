#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AI_DIR="$ROOT/src/modules/ai"
cd "$AI_DIR"

# Rename longest/most-specific prefixes first
declare -a RENAMES=(
  "ai-sprint37-provider-booking:ai-provider-booking"
  "ai-sprint36-customer-booking:ai-self-service-booking"
  "ai-sprint35-push-notifications:ai-push-notifications"
  "ai-sprint34-marketing-growth:ai-marketing-growth"
  "ai-sprint33-retail-finance:ai-retail-finance"
  "ai-sprint32-integrations:ai-integrations"
  "ai-sprint31-gift-fulfillment:ai-gift-fulfillment"
  "ai-sprint30-payments:ai-payments"
  "ai-sprint29-schedule-resources:ai-schedule-resources"
  "ai-sprint28-customer-crm:ai-customer-crm"
  "ai-sprint27-catalog:ai-catalog"
  "ai-sprint26-booking:ai-booking-depth"
  "ai-sprint25-plan:ai-platform-plan"
  "ai-sprint25:ai-platform"
  "ai-sprint24-plan:ai-operations-plan"
  "ai-sprint24-command-completion:ai-operations-command-completion"
  "ai-sprint24:ai-operations"
  "ai-sprint23-plan:ai-scheduling-plan"
  "ai-sprint23-command-completion:ai-scheduling-command-completion"
  "ai-sprint23:ai-scheduling"
  "ai-sprint18-customer-metrics:ai-customer-metrics"
)

for pair in "${RENAMES[@]}"; do
  old="${pair%%:*}"
  new="${pair##*:}"
  for f in ${old}.*; do
    [[ -e "$f" ]] || continue
    suffix="${f#${old}.}"
    if git ls-files --error-unmatch "$f" &>/dev/null; then
      git mv "$f" "${new}.${suffix}"
    else
      mv "$f" "${new}.${suffix}"
    fi
  done
done

echo "Renamed $(ls ai-scheduling* ai-operations* ai-platform* ai-catalog* 2>/dev/null | wc -l | tr -d ' ') sample files"
