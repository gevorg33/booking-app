import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import {
  TELEMETRY_RESCUE_BOOK_VERB,
  type TelemetryRescueRule,
} from './ai-telemetry-rescue.fixtures.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';

/** n99-2.5 — recurring suspected_miss patterns promoted to no-LLM rescues (acc-3.8). */
export interface N99DeterministicRescueScenario {
  id: string;
  prompt: string;
  fromAction: string;
  expectedAction: string;
  rescueReason: string;
  ruleId: string;
  surface?: CommandSurface;
  paramsPartial?: Record<string, unknown>;
}

const SEND_REMINDER_SKIP =
  /\b(book|schedule|reserve|cancel|result|lab results?|test results?|breach|gift.?card|confirmation email|notification date|notification currency|explain|preview|configure|patient result)\b/i;

function isAppointmentReminderPrompt(prompt: string): boolean {
  if (SEND_REMINDER_SKIP.test(prompt)) return false;
  if (/\b(remind|ping|հիշեց|напомн)\b/i.test(prompt)) return true;
  return /\b(notify|text|sms)\b.+\b(appointment|booking|visit|tomorrow|today)\b/i.test(
    prompt,
  );
}

export const N99_SUSPECTED_MISS_RESCUE_RULES: ReadonlyArray<TelemetryRescueRule> = [
  {
    id: 'n99-create-to-send-reminder',
    fromAction: 'create_booking',
    toAction: 'send_reminder',
    rescueReason: 'n99_create_to_send_reminder',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 13,
    matches: isAppointmentReminderPrompt,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'n99-unknown-to-send-reminder',
    fromAction: 'unknown',
    toAction: 'send_reminder',
    rescueReason: 'n99_unknown_to_send_reminder',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 14,
    matches: isAppointmentReminderPrompt,
  },
  {
    id: 'n99-show-to-send-reminder',
    fromAction: 'show_appointments',
    toAction: 'send_reminder',
    rescueReason: 'n99_show_to_send_reminder',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 15,
    matches: isAppointmentReminderPrompt,
  },
  {
    id: 'n99-create-to-fill-gaps',
    fromAction: 'create_booking',
    toAction: 'fill_unused_slots',
    rescueReason: 'n99_create_to_fill_gaps',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 16,
    pattern: /\b(fill|cover)\b.+\b(gaps?|unused slots?|open slots?)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'n99-customer-create-to-nearest',
    fromAction: 'create_booking',
    toAction: 'book_nearest_slot',
    rescueReason: 'n99_customer_create_to_nearest',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 17,
    surfaces: ['customer'],
    matches: (prompt) => isBookNearestSlotPrompt(prompt),
  },
  {
    id: 'n99-public-book-to-check',
    fromAction: 'book_appointment',
    toAction: 'check_availability',
    rescueReason: 'n99_public_book_to_check',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 18,
    surfaces: ['public'],
    pattern:
      /\b(?:who(?:'s| is)|who has|any(?:one|body)?)\s+(?:free|available|open)\b/i,
    skipPattern: /\b(book|reserve|schedule|grab|hold)\b/i,
  },
  {
    id: 'n99-public-check-to-book-nearest',
    fromAction: 'check_availability',
    toAction: 'book_appointment',
    rescueReason: 'n99_public_check_to_book_nearest',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 19,
    surfaces: ['public'],
    matches: (prompt) => isBookNearestSlotPrompt(prompt),
  },
  {
    id: 'n99-provider-sweep-to-mark-paid',
    fromAction: 'payment_sweep',
    toAction: 'mark_paid',
    rescueReason: 'n99_provider_sweep_to_mark_paid',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 20,
    surfaces: ['provider'],
    pattern: /\bmark\b.+\b(?:as\s+)?paid\b|\brecord payment\b|\bpayment received\b/i,
  },
  {
    id: 'n99-create-to-mark-no-shows',
    fromAction: 'create_booking',
    toAction: 'mark_no_shows',
    rescueReason: 'n99_create_to_mark_no_shows',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 21,
    pattern: /\b(mark|flag|set).+\bno[\s-]?shows?\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'n99-create-to-clear-schedule',
    fromAction: 'create_booking',
    toAction: 'clear_schedule',
    rescueReason: 'n99_create_to_clear_schedule',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 22,
    pattern: /\b(clear|wipe|empty|reset)\b.+\b(schedule|calendar)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'n99-customer-create-to-check-providers',
    fromAction: 'create_booking',
    toAction: 'check_providers_for_service',
    rescueReason: 'n99_customer_create_to_check_providers',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 23,
    surfaces: ['customer'],
    pattern:
      /\b(?:who(?:'s| is)|which providers? (?:are )?|any(?:one|body))\s+(?:free|available|open)\b/i,
    skipPattern: TELEMETRY_RESCUE_BOOK_VERB,
  },
  {
    id: 'n99-check-to-check-providers',
    fromAction: 'check_availability',
    toAction: 'check_providers_for_service',
    rescueReason: 'n99_check_to_check_providers',
    telemetrySignal: 'suspected_miss',
    occurrenceRank: 24,
    surfaces: ['dashboard', 'customer'],
    pattern:
      /\b(?:who(?:'s| is)|which providers? (?:are )?|any(?:one|body))\s+(?:free|available|open)\b.+\b(for|with)\b/i,
  },
];

export const N99_DETERMINISTIC_RESCUE_SCENARIOS: ReadonlyArray<N99DeterministicRescueScenario> = [
  {
    id: 'n99-2.5-create-to-send-reminder',
    prompt: 'Remind Maria about her appointment tomorrow',
    fromAction: 'create_booking',
    expectedAction: 'send_reminder',
    rescueReason: 'n99_create_to_send_reminder',
    ruleId: 'n99-create-to-send-reminder',
  },
  {
    id: 'n99-2.5-unknown-to-send-reminder',
    prompt: 'Ping Anna about tomorrow haircut',
    fromAction: 'unknown',
    expectedAction: 'send_reminder',
    rescueReason: 'n99_unknown_to_send_reminder',
    ruleId: 'n99-unknown-to-send-reminder',
  },
  {
    id: 'n99-2.5-show-to-send-reminder',
    prompt: 'Notify Gevorg about his booking tomorrow morning',
    fromAction: 'show_appointments',
    expectedAction: 'send_reminder',
    rescueReason: 'n99_show_to_send_reminder',
    ruleId: 'n99-show-to-send-reminder',
  },
  {
    id: 'n99-2.5-create-to-fill-gaps',
    prompt: 'Fill Gevorg gaps this week with facials',
    fromAction: 'create_booking',
    expectedAction: 'fill_unused_slots',
    rescueReason: 'n99_create_to_fill_gaps',
    ruleId: 'n99-create-to-fill-gaps',
  },
  {
    id: 'n99-2.5-customer-create-to-nearest',
    prompt: 'Grab the soonest opening for massage tomorrow evening',
    fromAction: 'create_booking',
    expectedAction: 'book_nearest_slot',
    rescueReason: 'n99_customer_create_to_nearest',
    ruleId: 'n99-customer-create-to-nearest',
    surface: 'customer',
  },
  {
    id: 'n99-2.5-public-book-to-check',
    prompt: "Who's free tomorrow evening for permanent lashes",
    fromAction: 'book_appointment',
    expectedAction: 'check_availability',
    rescueReason: 'n99_public_book_to_check',
    ruleId: 'n99-public-book-to-check',
    surface: 'public',
  },
  {
    id: 'n99-2.5-public-check-to-book-nearest',
    prompt: 'Book the soonest massage appointment tomorrow evening',
    fromAction: 'check_availability',
    expectedAction: 'book_appointment',
    rescueReason: 'n99_public_check_to_book_nearest',
    ruleId: 'n99-public-check-to-book-nearest',
    surface: 'public',
  },
  {
    id: 'n99-2.5-provider-sweep-to-mark-paid',
    prompt: 'Mark this visit as paid',
    fromAction: 'payment_sweep',
    expectedAction: 'mark_paid',
    rescueReason: 'n99_provider_sweep_to_mark_paid',
    ruleId: 'n99-provider-sweep-to-mark-paid',
    surface: 'provider',
  },
  {
    id: 'n99-2.5-create-to-mark-no-shows',
    prompt: 'Mark no-shows for Gevorg today',
    fromAction: 'create_booking',
    expectedAction: 'mark_no_shows',
    rescueReason: 'n99_create_to_mark_no_shows',
    ruleId: 'n99-create-to-mark-no-shows',
  },
  {
    id: 'n99-2.5-create-to-clear-schedule',
    prompt: 'Wipe Gevorg calendar for Friday',
    fromAction: 'create_booking',
    expectedAction: 'clear_schedule',
    rescueReason: 'n99_create_to_clear_schedule',
    ruleId: 'n99-create-to-clear-schedule',
  },
  {
    id: 'n99-2.5-customer-create-to-check-providers',
    prompt: 'Who is free tomorrow for lashes',
    fromAction: 'create_booking',
    expectedAction: 'check_providers_for_service',
    rescueReason: 'n99_customer_create_to_check_providers',
    ruleId: 'n99-customer-create-to-check-providers',
    surface: 'customer',
  },
  {
    id: 'n99-2.5-check-to-check-providers',
    prompt: 'Who is free tomorrow evening for massage',
    fromAction: 'check_availability',
    expectedAction: 'check_providers_for_service',
    rescueReason: 'n99_check_to_check_providers',
    ruleId: 'n99-check-to-check-providers',
    surface: 'dashboard',
  },
];

/** acc-1.4 — fixture rows for mining suspected_miss → rescue candidates. */
export const N99_SUSPECTED_MISS_MINING_FIXTURES = [
  {
    promptSnippet: 'Remind Maria about tomorrow',
    action: 'create_booking',
    correctedAction: 'send_reminder',
    surface: 'dashboard',
    failureCount: 4,
    failureSignals: { suspected_miss: 4 },
  },
  {
    promptSnippet: 'Remind Maria about tomorrow',
    action: 'create_booking',
    correctedAction: 'send_reminder',
    surface: 'dashboard',
    failureCount: 3,
    failureSignals: { suspected_miss: 3 },
  },
  {
    promptSnippet: 'Fill gaps this week',
    action: 'create_booking',
    correctedAction: 'fill_unused_slots',
    surface: 'dashboard',
    failureCount: 5,
    failureSignals: { suspected_miss: 5 },
  },
  {
    promptSnippet: 'Book massage tomorrow',
    action: 'create_booking',
    correctedAction: 'create_booking',
    surface: 'dashboard',
    failureCount: 2,
    failureSignals: { suspected_miss: 2 },
  },
] as const;

export function n99DeterministicRescueScenarioToEvalCase(
  scenario: N99DeterministicRescueScenario,
): AiCommandEvalCase {
  return {
    id: scenario.id,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface ?? 'dashboard',
    domain: 'operations',
    corpus: 'golden',
    difficulty: 'medium',
    expect: {
      rescueFromAction: scenario.fromAction,
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES: AiCommandEvalCase[] =
  N99_DETERMINISTIC_RESCUE_SCENARIOS.map(n99DeterministicRescueScenarioToEvalCase);
