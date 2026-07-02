import type { CommandSurface } from './ai-command-registry.types.js';
import { buildSharedEntityParamsPromptBlock } from './ai-command-entity-params.util.js';
import {
  CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES,
  DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES,
  PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES,
} from './ai-intent-disambiguation.fixtures.js';
import { NARROW_INTENT_SHORTLIST_PIPE_MARKER } from './narrow-intent-shortlist.util.js';

const BOOKING_AVAILABILITY_ACTIONS = new Set([
  'create_booking',
  'book_nearest_slot',
  'book_appointment',
  'check_providers_for_service',
  'check_availability',
  'lookup_service_assignment',
  'show_appointments',
  'list_bookings',
  'reschedule_booking',
]);

const SCHEDULE_OPS_ACTIONS = new Set([
  'create_direct_schedule',
  'apply_schedule',
  'clear_schedule',
  'fill_unused_slots',
  'list_schedule_gaps',
  'setup_week_schedule',
  'summarize_utilization',
]);

function buildNarrowParamsJson(actionUnion: string): string {
  return `{
  "action": ${actionUnion},
  "params": {
    "employeeName": "string or null",
    "employeeNames": ["string"] or null,
    "allProviders": "boolean or null",
    "bookingFirstAvailable": "boolean or null",
    "serviceName": "string or null",
    "serviceNames": ["string"] or null,
    "customerName": "string or null",
    "date": "DD/MM/YYYY or null",
    "dateFrom": "DD/MM/YYYY or null",
    "dateTo": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM or null",
    "timeFrom": "HH:MM or null",
    "timeTo": "HH:MM or null",
    "timeOfDay": "morning | afternoon | evening | null",
    "templateName": "string or null",
    "assignmentLookup": "providers_for_service | services_for_provider | null"
  },
  "reasoning": "one sentence",
  "confidence": "number 0.0-1.0"
}`;
}

function availabilityRulesForSurface(
  surface: CommandSurface,
  actions: readonly string[],
): string {
  const hasBookingAvailability = actions.some((action) =>
    BOOKING_AVAILABILITY_ACTIONS.has(action),
  );
  if (!hasBookingAvailability) return '';

  if (surface === 'dashboard')
    return DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES;
  if (surface === 'customer') return CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES;
  if (surface === 'public') return PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES;
  return '';
}

function scheduleRulesForActions(actions: readonly string[]): string {
  const hasSchedule = actions.some((action) =>
    SCHEDULE_OPS_ACTIONS.has(action),
  );
  if (!hasSchedule) return '';

  return `- Schedule ops disambiguation:
- create_direct_schedule: set/replace applied hours for provider(s) — NOT create_booking.
- apply_schedule: apply a named template to provider(s).
- clear_schedule: wipe applied schedule periods — NOT cancel appointments.
- fill_unused_slots / list_schedule_gaps: gap fill vs gap listing — NOT booking.`;
}

/**
 * Compact classifier schema constrained to a dynamic shortlist (acc-3.3 / pipe-1.4.7).
 */
export function buildNarrowClassifierSchema(
  surface: CommandSurface,
  actions: readonly string[],
): string {
  const sorted = [...new Set(actions)].sort();
  const actionUnion = sorted.map((action) => `"${action}"`).join(' | ');

  return `You are the Orchestrix intent tie-breaker (${NARROW_INTENT_SHORTLIST_PIPE_MARKER}).
The primary classifier and semantic matcher disagreed within confidence margin ${0.08}.
Re-classify the command using ONLY one action from this shortlist:

Allowed actions (${sorted.length}): ${sorted.join(', ')}.

Return JSON ${buildNarrowParamsJson(actionUnion)}

Rules:
- Choose exactly one action from the shortlist — never invent a new action id.
- Extract params from the latest user message; inherit session context when the follow-up omits provider/date/service.
- ${buildSharedEntityParamsPromptBlock()}
- If still unclear, pick the best-fit shortlist action with lower confidence (0.55–0.75) — do not return "unknown" unless it is in the shortlist.
${scheduleRulesForActions(sorted)}
${availabilityRulesForSurface(surface, sorted)}`;
}
