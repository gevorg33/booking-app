import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type AmbiguityCorpusKind = 'validation_clarify' | 'compound_empty';

export type AmbiguityCorpusScenario = {
  id: string;
  prompt: string;
  surface: CommandSurface;
  locale: AiEvalLocale;
  kind: AmbiguityCorpusKind;
  /** Simulated classified action with incomplete params (validation_clarify). */
  action?: string;
  validationParamsPartial?: Record<string, unknown>;
  /** Required validation issue fields when clarify is expected. */
  clarifyFieldsContains?: string[];
};

/** acc-2.6 — prompts that should clarify (missing slots) or avoid false compound execution. */
export const AMBIGUITY_CORPUS_SCENARIOS: AmbiguityCorpusScenario[] = [
  {
    id: 'dashboard-book-missing-when',
    prompt: 'Book facemassage with Gevorg',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'create_booking',
    validationParamsPartial: {
      serviceName: 'facemassage',
      employeeName: 'Gevorg',
    },
    clarifyFieldsContains: ['date', 'timeSlot'],
  },
  {
    id: 'dashboard-book-missing-service',
    prompt: 'Book with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'create_booking',
    validationParamsPartial: {
      employeeName: 'Gevorg',
      date: 'tomorrow',
      timeSlot: '10:00',
    },
    clarifyFieldsContains: ['serviceName'],
  },
  {
    id: 'dashboard-cancel-missing-filter',
    prompt: 'Cancel appointments',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'cancel_bookings',
    validationParamsPartial: {},
    clarifyFieldsContains: ['date'],
  },
  {
    id: 'dashboard-reschedule-missing-time',
    prompt: "Reschedule Maria's appointment",
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'reschedule_booking',
    validationParamsPartial: { employeeName: 'Maria' },
    clarifyFieldsContains: ['timeSlot'],
  },
  {
    id: 'dashboard-check-avail-missing-date',
    prompt: 'Is Gevorg available for massage',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'check_availability',
    validationParamsPartial: { employeeName: 'Gevorg', serviceName: 'massage' },
    clarifyFieldsContains: ['date'],
  },
  {
    id: 'customer-book-missing-when',
    prompt: 'Book lashes with Karo',
    surface: 'customer',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'create_booking',
    validationParamsPartial: {
      serviceName: 'lashes',
      employeeName: 'Karo',
    },
    clarifyFieldsContains: ['date', 'timeSlot'],
  },
  {
    id: 'customer-cancel-missing-filter',
    prompt: 'Cancel my appointments',
    surface: 'customer',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'cancel_bookings',
    validationParamsPartial: {},
    clarifyFieldsContains: ['date'],
  },
  {
    id: 'dashboard-bulk-cancel-missing-filter',
    prompt: 'Cancel all bookings',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'bulk_smart_cancel',
    validationParamsPartial: {},
    clarifyFieldsContains: ['date'],
  },
  {
    id: 'dashboard-show-appts-missing-date',
    prompt: 'Show appointments for Gevorg',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'show_appointments',
    validationParamsPartial: { employeeName: 'Gevorg' },
    clarifyFieldsContains: ['date'],
  },
  {
    id: 'dashboard-rebalance-missing-service',
    prompt: 'Rebalance capacity from Gevorg to Maria on Friday',
    surface: 'dashboard',
    locale: 'en',
    kind: 'validation_clarify',
    action: 'rebalance_capacity',
    validationParamsPartial: {
      fromEmployeeName: 'Gevorg',
      toEmployeeName: 'Maria',
      date: 'Friday',
    },
    clarifyFieldsContains: ['serviceName'],
  },
  {
    // §165 — see `public_compound_no_deterministic` in
    // `intent-decomposition.fixtures.ts`. Same stale prompt, same fix: 'List
    // providers and check availability' became a real deterministic compound on
    // 2026-07-20, six weeks after this fixture claimed it was not one. The id
    // keeps its name because the case it covers is unchanged.
    id: 'public-compound-list-and-check',
    prompt: 'List providers and cancel my haircut',
    surface: 'public',
    locale: 'en',
    kind: 'compound_empty',
  },
  {
    id: 'dashboard-non-compound-list-bookings',
    prompt: 'List bookings',
    surface: 'dashboard',
    locale: 'en',
    kind: 'compound_empty',
  },
  {
    id: 'customer-unsupported-compound',
    prompt: 'Optimize schedule and rebalance capacity for next week',
    surface: 'customer',
    locale: 'en',
    kind: 'compound_empty',
  },
  {
    id: 'dashboard-cancel-or-reschedule-question',
    prompt: 'Should I cancel or reschedule this appointment?',
    surface: 'dashboard',
    locale: 'en',
    kind: 'compound_empty',
  },
];
