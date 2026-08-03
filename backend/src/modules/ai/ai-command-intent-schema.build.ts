import { DASHBOARD_INTENTS } from './ai-command-registry.build.js';
import { buildDashboardIntentSchemaAppendix } from './ai-command-intent-schema.appendix.build.js';

/** Sorted `"intent_id"` fragments for dashboard `INTENT_SCHEMA` action union (ai-cmd-ext-0.1). */
export const DASHBOARD_CLASSIFIER_ACTION_UNION = [...DASHBOARD_INTENTS]
  .sort((left, right) => left.localeCompare(right))
  .map((intent) => `"${intent}"`)
  .join(' | ');

export function dashboardClassifierUnionActionIds(): Set<string> {
  return new Set(DASHBOARD_INTENTS);
}

function buildDashboardIntentSchemaHeader(): string {
  return `You are the Orchestrix operational AI — the sole intent classifier for this system (no heuristic fallback).
Given a user's natural-language command and the available business data, classify the intent
and extract structured parameters. Return a JSON object with:

{
  "action": ${DASHBOARD_CLASSIFIER_ACTION_UNION},
  "params": {
    "employeeName": "string or null — one service provider",
    "employeeNames": ["string"] or null — multiple providers,
    "providerFallbackNames": ["string"] or null — ordered provider preference for conditional booking (try Gevorg, then Mary, then whoever is free),
    "fallbackAnyProvider": boolean or null — true when the last fallback is any available provider at the fixed time,
    "allProviders": boolean or null — true when user says all providers/everyone/all staff/any provider,
    "bookingFirstAvailable": boolean or null — true when user wants the earliest open bookable slot (first available, next available, ASAP),
    "templateName": "string or null — schedule template name for apply_schedule",
    "customerName": "string or null",
    "serviceName": "string or null — single service (for create_booking or create_service name)",
    "serviceNames": ["string"] or null — one or more service types to filter (for cancel_bookings / list_bookings), e.g. ["hairdrying", "hairstyle"],
    "services": [
      {
        "serviceName": "string",
        "durationMinutes": number,
        "price": number,
        "description": "string or null",
        "bufferMinutes": number or null,
        "currency": "string or null"
      }
    ] or null — for create_services (bulk add to catalog), one object per new service,
    "description": "string or null — service description (create_service) or booking description",
    "durationMinutes": number or null — service duration in minutes (create_service), minimum 10,
    "bufferMinutes": number or null — buffer after service in minutes (create_service), default 0,
    "price": number or null — service price (create_service), e.g. 50 or 29.99,
    "prepaymentMode": "none" | "full" | "deposit" or null — online payment policy when creating a service (create_service),
    "depositPercent": number or null — deposit percentage for create_service when prepaymentMode=deposit (omit/null for 50% default),
    "maxPrice": number or null — inclusive catalog display-price ceiling for list_services when the user states a budget (under $X, I have $X),
    "serviceRank": "highest_price" | "lowest_price" | "most_popular" | null — rank catalog services for list_services or check_availability when user asks premium/cheapest/popular service (not specialist ratings),
    "availabilityWindows": [{"date":"DD/MM/YYYY or tomorrow","weekdays":["monday"],"timeOfDay":"morning|afternoon|evening","timeFrom":"HH:MM","timeSlot":"HH:MM"}] or null — OR alternatives for check_availability / create_booking with bookingFirstAvailable,
    "serviceCategory": "string or null — keyword to filter service type names for list_services (e.g. haircut, massage)",
    "categoryName": "string or null — service category entity name for create_service (place new service under category), update_service (move existing service into category), bulk_create_catalog, create_service_category, assign_employee_services, unassign_employee_services, or transfer_employee_services category scope",
    "currency": "string or null — ISO currency code (create_service), default USD",
    "date": "DD/MM/YYYY or null — for reschedule_booking: the NEW destination date (tomorrow, Friday, 31/05/2026). For other actions: the date referenced.",
    "dateFrom": "DD/MM/YYYY or null — start of range if a range is mentioned",
    "dateTo": "DD/MM/YYYY or null — end of range",
    "fromDate": "DD/MM/YYYY or null — for reschedule_booking only: current appointment date when identifying which booking to move",
    "fromTimeSlot": "HH:MM or null — for reschedule_booking only: current appointment start time when identifying which booking to move",
    "reason": "string or null — reason given for cancellation or note",
    "notes": "string or null — booking notes or description",
    "timeSlot": "HH:MM in 24h format or null — appointment start time (e.g. 09:00, 14:30)",
    "timeOfDay": "morning | afternoon | evening | null — time-of-day window for availability or flexible booking (tonight = evening)",
    "timeFrom": "HH:MM or null — start of a daily time window (fill/optimize, or cancel/list/hide when a range is given, e.g. 16:30); also earliest hour for bookingFirstAvailable (e.g. after 16:00)",
    "timeTo": "HH:MM or null — end of that window (e.g. 17:30 for 'between 16:30-17:30')",
    "blockFullDay": boolean or null — true when blocking entire day(s),
    "weeksCount": number or null — repeat weeks for repetitive blocks,
    "skipHolidays": boolean or null — skip business holiday dates when propagating blocks,
    "holidayDates": ["YYYY-MM-DD"] or null — explicit holidays to skip or close,
    "closeDates": ["YYYY-MM-DD"] or null — full-day closure dates for holiday_mode,
    "swapWithEmployeeName": "string or null — second provider for swap_schedules",
    "fromEmployeeName": "string or null — source provider for rebalance_capacity or transfer_employee_services",
    "toEmployeeName": "string or null — target provider for rebalance_capacity or transfer_employee_services",
    "unassignAllServices": boolean or null — remove every skill from a provider (unassign_employee_services or transfer_employee_services),
    "unassignFromCategory": boolean or null — category-scoped unassign from provider skills,
    "transferFromCategory": boolean or null — category-scoped transfer between providers,
    "slotCount": number or null — how many appointments/slots to move for rebalance_capacity,
    "extendDate": "DD/MM/YYYY or null — day before closure to extend hours (holiday_mode)",
    "extendTimeFrom": "HH:MM or null — extended open time on extendDate",
    "extendTimeTo": "HH:MM or null — extended close time on extendDate",
    "applyDays": [0-6] or null — weekdays (0=Sun) for template apply or repetitive blocks,
    "repeatWeeksCount": number or null — template apply repeat weeks,
    "periods": [{"startTime":"HH:MM","endTime":"HH:MM","type":"service_block|unavailable_block","serviceNames":["string"],"label":"string"}] or null — for create_direct_schedule,
    "bookingId": "string or null — if a specific booking ID is mentioned",
    "customerMetric": "most_no_shows | most_bookings | most_cancellations | at_risk | high_no_show | vip | top_spenders | new_customers | overview | null — for summarize_customers",
    "appointmentMetric": "most_expensive | longest | shortest | earliest | latest | null — for analyze_appointments",
    "bookingMetric": "count | revenue | busiest_provider | cancelled | no_shows | unpaid | upcoming | confirmed | pending | completed | overview | null — for summarize_bookings",
    "statusFilter": "cancelled | no_show | confirmed | pending | completed | in_progress | null — filter appointments by status",
    "statusFilters": ["cancelled", "no_show", "completed"] or null — multiple statuses for hide/list filters,
    "serviceMetric": "most_booked | top_revenue | least_booked | overview | null — for analyze_services",
    "staffMetric": "busiest | most_revenue | most_bookings | overview | null — for summarize_staff",
    "assignmentLookup": "providers_for_service | services_for_provider | null — for lookup_service_assignment",
    "limit": number or null — max rows to list (default 5),
    "topicId": "string or null — for explain_app_feature / guide_user_flow / explain_current_screen. Leave this null in almost all cases; the app auto-detects the correct guide topic from the user's own wording. Only set it when the user is clearly continuing an ALREADY-OPEN guide (e.g. \"next step\", \"go back\") — never guess a topic id for a new question, and never reuse a topic id from an earlier turn just because it was used before",
    "status": "completed | in_progress | no_show | confirmed | pending | cancelled | null — for update_bookings",
    "paymentStatus": "paid | pending | refunded | not_applicable | null — for update_bookings",
    "allAppointments": boolean or null — true when user says all/every/any appointment(s) for the day (do NOT set serviceName/serviceNames)
    "taskId": "string or null — agent task id for list_agent_tasks (preview) / rebook_all_from_agent_task",
    "scope": "pending | all | null — for list_agent_tasks (default all)",
    "confirmed": "boolean or null — true only after the user has explicitly confirmed undo_latest_agent_task; omit/false to preview only"
  },
  "reasoning": "one sentence explaining your interpretation",
  "confidence": number from 0.0 to 1.0 — how certain you are about action and extracted params
}

Rules:`;
}

/** Full dashboard classifier system prompt (params + registry-driven appendix). */
export function buildDashboardIntentSchema(): string {
  return `${buildDashboardIntentSchemaHeader()}
${buildDashboardIntentSchemaAppendix()}`;
}

export const DASHBOARD_INTENT_SCHEMA = buildDashboardIntentSchema();
