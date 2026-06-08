import type { ClassificationSurface } from './ai-classification-engine.types.js';

export const HONEST_FAILURE_CONFIDENCE_THRESHOLD = 0.55;

export interface HonestFailureSuggestion {
  id: string;
  label: string;
  prompt: string;
}

export type HonestFailureSurface = 'dashboard' | 'customer' | 'provider' | 'public';

export const HONEST_FAILURE_SUGGESTIONS: Record<
  HonestFailureSurface,
  HonestFailureSuggestion[]
> = {
  dashboard: [
    {
      id: 'show-today',
      label: "Show today's appointments",
      prompt: 'Show all appointments today',
    },
    {
      id: 'check-availability',
      label: 'Check provider availability',
      prompt: 'Who is free tomorrow for massage',
    },
    {
      id: 'create-booking',
      label: 'Book an appointment',
      prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    },
  ],
  customer: [
    {
      id: 'list-appointments',
      label: 'My upcoming appointments',
      prompt: 'Show my upcoming appointments',
    },
    {
      id: 'book-nearest',
      label: 'Book nearest slot',
      prompt: 'Book the nearest slot for massage tomorrow evening',
    },
    {
      id: 'cancel-mine',
      label: 'Cancel my booking',
      prompt: 'Cancel my appointment tomorrow',
    },
  ],
  provider: [
    {
      id: 'list-my-bookings',
      label: 'My schedule today',
      prompt: 'Show my appointments today',
    },
    {
      id: 'mark-paid',
      label: 'Mark booking paid',
      prompt: 'Mark my last appointment as paid',
    },
    {
      id: 'block-time',
      label: 'Block my calendar',
      prompt: 'Block my calendar tomorrow afternoon',
    },
  ],
  public: [
    {
      id: 'check-availability',
      label: 'Check availability',
      prompt: 'Who is free tomorrow evening for lashes',
    },
    {
      id: 'book-appointment',
      label: 'Book appointment',
      prompt: 'Book the nearest slot for massage tomorrow evening',
    },
    {
      id: 'business-info',
      label: 'Business hours',
      prompt: 'What are your opening hours',
    },
  ],
};

export interface HonestFailureScenario {
  id: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  confidence?: number;
  actionThreshold?: number;
  expectHonestFailure: boolean;
  expectSuggestionCount?: number;
  expectSummaryIncludes?: string[];
}

/** acc-4.7 — honest suggestions instead of executing a low-confidence guess. */
export const HONEST_FAILURE_SCENARIOS: HonestFailureScenario[] = [
  {
    id: 'dash-after-clarify-still-low',
    surface: 'dashboard',
    action: 'cancel_bookings',
    params: { _classificationNeedsClarify: true },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'cancel stuff maybe',
        originalAction: 'cancel_bookings',
        partialParams: {},
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    confidence: 0.42,
    expectHonestFailure: true,
    expectSuggestionCount: 3,
    expectSummaryIncludes: ["didn't fully understand", 'help with'],
  },
  {
    id: 'dash-first-turn-skips',
    surface: 'dashboard',
    action: 'unknown',
    params: { _semanticClarify: true },
    confidence: 0.4,
    expectHonestFailure: false,
  },
  {
    id: 'customer-honest-after-retry',
    surface: 'customer',
    action: 'unknown',
    params: { _semanticClarify: true },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'hmm maybe something',
        originalAction: 'unknown',
        partialParams: {},
        clarifyRound: 1,
        clarifyKind: 'intent_disambiguation',
      },
    },
    confidence: 0.48,
    expectHonestFailure: true,
    expectSuggestionCount: 3,
  },
  {
    id: 'provider-honest-after-entity',
    surface: 'provider',
    action: 'list_my_bookings',
    params: { _semanticClarify: true },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'show my day',
        originalAction: 'list_my_bookings',
        partialParams: {},
        clarifyRound: 1,
        clarifyKind: 'entity_disambiguation',
      },
    },
    confidence: 0.5,
    expectHonestFailure: true,
    expectSuggestionCount: 3,
  },
  {
    id: 'public-honest-after-clarify',
    surface: 'public',
    action: 'unknown',
    params: { _classificationNeedsClarify: true },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book something',
        originalAction: 'unknown',
        partialParams: {},
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    confidence: 0.44,
    expectHonestFailure: true,
    expectSuggestionCount: 3,
  },
  {
    id: 'dash-high-confidence-skips',
    surface: 'dashboard',
    action: 'list_bookings',
    params: { date: '2026-06-08' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'show today',
        originalAction: 'list_bookings',
        partialParams: { date: '2026-06-08' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    confidence: 0.82,
    expectHonestFailure: false,
  },
];
