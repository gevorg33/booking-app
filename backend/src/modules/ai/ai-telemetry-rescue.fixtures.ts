import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

/** Booking verbs — skip telemetry view/analytics rescues when present. */
export const TELEMETRY_RESCUE_BOOK_VERB =
  /\b(book|schedule|reserve|create appointment|amragic|zapis|запиш)\b/i;

/** acc-3.8 — top recurring suspected_miss / wrong_execution confusion pairs from telemetry. */
export interface TelemetryRescueRule {
  id: string;
  fromAction: string;
  toAction: string;
  rescueReason: string;
  /** Production failure signal that promoted this rule. */
  telemetrySignal: 'suspected_miss' | 'wrong_execution' | 'both';
  /** Approximate rank in weekly worst-prompts feed when promoted. */
  occurrenceRank: number;
  pattern?: RegExp;
  matches?: (prompt: string) => boolean;
  skipPattern?: RegExp;
  surfaces?: CommandSurface[];
  params?:
    | Record<string, unknown>
    | ((prompt: string) => Record<string, unknown>);
}

export const TELEMETRY_RESCUE_RULES: ReadonlyArray<TelemetryRescueRule> = [
  {
    id: 'telemetry-cancel-to-reschedule',
    fromAction: 'cancel_bookings',
    toAction: 'reschedule_booking',
    rescueReason: 'telemetry_cancel_to_reschedule',
    telemetrySignal: 'wrong_execution',
    occurrenceRank: 1,
    pattern: /\b(reschedule|move|shift|change time)\b/i,
    skipPattern: /\bcancel all\b/i,
  },
  {
    id: 'telemetry-create-to-cancel',
    fromAction: 'create_booking',
    toAction: 'cancel_bookings',
    rescueReason: 'telemetry_create_to_cancel',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 2,
    pattern: /\bcancel\b.+\b(appointments?|bookings?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'telemetry-create-to-reschedule',
    fromAction: 'create_booking',
    toAction: 'reschedule_booking',
    rescueReason: 'telemetry_create_to_reschedule',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 3,
    pattern:
      /\b(reschedule|move|shift|change time)\b.+\b(appointments?|bookings?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'telemetry-create-to-check-providers',
    fromAction: 'create_booking',
    toAction: 'check_providers_for_service',
    rescueReason: 'create_booking_to_check_providers',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 4,
    pattern:
      /\b(?:who(?:'s| is)|which providers? (?:are )?|any(?:one|body))\s+(?:free|available|open)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'telemetry-create-to-show',
    fromAction: 'create_booking',
    toAction: 'show_appointments',
    rescueReason: 'telemetry_create_to_show',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 5,
    pattern:
      /\b(show|display|view|what)\b.+\b(appointments?|bookings?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'telemetry-create-to-list',
    fromAction: 'create_booking',
    toAction: 'list_bookings',
    rescueReason: 'telemetry_create_to_list',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 6,
    pattern: /\blist\b.+\b(appointments?|bookings?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'telemetry-create-to-summarize-count',
    fromAction: 'create_booking',
    toAction: 'summarize_bookings',
    rescueReason: 'telemetry_create_to_summarize_count',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 7,
    pattern:
      /\b(how many|count of|number of|total)\b.+\b(appointments?|bookings?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
    params: { bookingMetric: 'count' },
  },
  {
    id: 'telemetry-list-to-show',
    fromAction: 'list_bookings',
    toAction: 'show_appointments',
    rescueReason: 'telemetry_list_to_show',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 8,
    pattern: /\bshow\b.+\bappointments?\b/i,
  },
  {
    id: 'telemetry-list-to-summarize-count',
    fromAction: 'list_bookings',
    toAction: 'summarize_bookings',
    rescueReason: 'telemetry_list_to_summarize_count',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 9,
    pattern: /\b(how many|count of|number of)\b.+\b(appointments?|bookings?)\b/i,
    params: { bookingMetric: 'count' },
  },
  {
    id: 'telemetry-summarize-day-to-bookings',
    fromAction: 'summarize_day',
    toAction: 'summarize_bookings',
    rescueReason: 'telemetry_summarize_day_to_bookings',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 10,
    pattern:
      /\b(how many|count|total|revenue|earnings)\b.+\b(appointments?|bookings?)\b/i,
  },
  {
    id: 'telemetry-lookup-to-check-providers',
    fromAction: 'lookup_service_assignment',
    toAction: 'check_providers_for_service',
    rescueReason: 'lookup_to_check_providers',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 11,
    pattern:
      /\b(?:who(?:'s| is)|which providers? (?:are )?|any(?:one|body))\s+(?:free|available|open)\b/i,
    surfaces: ['dashboard', 'customer'],
    params: { allProviders: true, employeeName: null },
  },
  {
    id: 'telemetry-payment-sweep-to-unpaid',
    fromAction: 'payment_sweep',
    toAction: 'summarize_unpaid',
    rescueReason: 'telemetry_payment_sweep_to_unpaid',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 12,
    pattern: /\b(how many|list|show|summarize).+\bunpaid\b/i,
    skipPattern: /\b(mark|collect|sweep|charge|run payment sweep)\b/i,
  },
];

export interface TelemetryRescueScenario {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: string;
  rescueReason: string;
  ruleId: string;
  surface?: CommandSurface;
  paramsPartial?: Record<string, unknown>;
}

/** Regression scenarios — one per promoted telemetry rule (acc-3.8). */
export const TELEMETRY_RESCUE_SCENARIOS: ReadonlyArray<TelemetryRescueScenario> = [
  {
    id: 'acc-3.8-cancel-to-reschedule',
    prompt: "Move Maria's appointment to tomorrow at 2pm",
    fromAction: 'cancel_bookings',
    expectedAction: 'reschedule_booking',
    rescueReason: 'telemetry_cancel_to_reschedule',
    ruleId: 'telemetry-cancel-to-reschedule',
  },
  {
    id: 'acc-3.8-create-to-cancel',
    prompt: 'Cancel Anna haircut appointment tomorrow',
    fromAction: 'create_booking',
    expectedAction: 'cancel_bookings',
    rescueReason: 'telemetry_create_to_cancel',
    ruleId: 'telemetry-create-to-cancel',
  },
  {
    id: 'acc-3.8-create-to-reschedule',
    prompt: 'Reschedule Gevorg appointment to Friday 10:00',
    fromAction: 'create_booking',
    expectedAction: 'reschedule_booking',
    rescueReason: 'telemetry_create_to_reschedule',
    ruleId: 'telemetry-create-to-reschedule',
  },
  {
    id: 'acc-3.8-create-to-check-providers',
    prompt: 'Who is free tomorrow for lashes',
    fromAction: 'create_booking',
    expectedAction: 'check_providers_for_service',
    rescueReason: 'create_booking_to_check_providers',
    ruleId: 'telemetry-create-to-check-providers',
  },
  {
    id: 'acc-3.8-create-to-show',
    prompt: 'Show Maria appointments tomorrow',
    fromAction: 'create_booking',
    expectedAction: 'show_appointments',
    rescueReason: 'telemetry_create_to_show',
    ruleId: 'telemetry-create-to-show',
  },
  {
    id: 'acc-3.8-create-to-list',
    prompt: 'List all bookings for Gevorg on Friday',
    fromAction: 'create_booking',
    expectedAction: 'list_bookings',
    rescueReason: 'telemetry_create_to_list',
    ruleId: 'telemetry-create-to-list',
  },
  {
    id: 'acc-3.8-create-to-summarize-count',
    prompt: 'How many appointments do we have today',
    fromAction: 'create_booking',
    expectedAction: 'summarize_bookings',
    rescueReason: 'telemetry_create_to_summarize_count',
    ruleId: 'telemetry-create-to-summarize-count',
    paramsPartial: { bookingMetric: 'count' },
  },
  {
    id: 'acc-3.8-list-to-show',
    prompt: 'show Maria appointments tomorrow',
    fromAction: 'list_bookings',
    expectedAction: 'show_appointments',
    rescueReason: 'telemetry_list_to_show',
    ruleId: 'telemetry-list-to-show',
  },
  {
    id: 'acc-3.8-list-to-summarize-count',
    prompt: 'How many bookings are scheduled tomorrow',
    fromAction: 'list_bookings',
    expectedAction: 'summarize_bookings',
    rescueReason: 'telemetry_list_to_summarize_count',
    ruleId: 'telemetry-list-to-summarize-count',
    paramsPartial: { bookingMetric: 'count' },
  },
  {
    id: 'acc-3.8-summarize-day-to-bookings',
    prompt: 'How many bookings did we have today',
    fromAction: 'summarize_day',
    expectedAction: 'summarize_bookings',
    rescueReason: 'telemetry_summarize_day_to_bookings',
    ruleId: 'telemetry-summarize-day-to-bookings',
  },
  {
    id: 'acc-3.8-lookup-to-check-providers',
    prompt: 'Who is available tomorrow evening for massage',
    fromAction: 'lookup_service_assignment',
    expectedAction: 'check_providers_for_service',
    rescueReason: 'lookup_to_check_providers',
    ruleId: 'telemetry-lookup-to-check-providers',
    surface: 'dashboard',
    paramsPartial: { allProviders: true },
  },
  {
    id: 'acc-3.8-payment-sweep-to-unpaid',
    prompt: 'Show unpaid appointments for this week',
    fromAction: 'payment_sweep',
    expectedAction: 'summarize_unpaid',
    rescueReason: 'telemetry_payment_sweep_to_unpaid',
    ruleId: 'telemetry-payment-sweep-to-unpaid',
  },
];

export function telemetryRescueScenarioToEvalCase(
  scenario: TelemetryRescueScenario,
): AiCommandEvalCase {
  return {
    id: scenario.id,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface ?? 'dashboard',
    expect: {
      rescueFromAction: scenario.fromAction,
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_TELEMETRY_RESCUE_CASES: AiCommandEvalCase[] =
  TELEMETRY_RESCUE_SCENARIOS.map(telemetryRescueScenarioToEvalCase);

/** @deprecated Use TELEMETRY_RESCUE_RULES — kept for engine re-exports. */
export const TELEMETRY_RESCUE_HINTS = TELEMETRY_RESCUE_RULES.filter(
  (rule) => rule.pattern,
).map((rule) => ({
  id: rule.id,
  pattern: rule.pattern!,
  fromAction: rule.fromAction,
  toAction: rule.toAction,
}));
