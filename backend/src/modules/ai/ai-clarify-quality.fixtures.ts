import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';

function row(
  partial: Omit<AiTraceAnalyticsRow, 'locale'> & { locale?: string },
): AiTraceAnalyticsRow {
  return {
    locale: partial.locale ?? 'en',
    ...partial,
  };
}

/** Synthetic trace sequences for clarify quality metric tests. */
export const CLARIFY_QUALITY_TRACE_FIXTURES = {
  successOnNextTurn: [
    row({
      traceId: 'c1',
      surface: 'dashboard',
      userId: 'u1',
      action: 'create_booking',
      outcome: 'clarified',
      confidence: 0.42,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'book massage with anna',
      clarifyKind: 'targeted_slots',
      createdAt: new Date('2026-06-07T10:00:00Z'),
    }),
    row({
      traceId: 'c2',
      surface: 'dashboard',
      userId: 'u1',
      action: 'create_booking',
      outcome: 'executed',
      confidence: 0.88,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'tomorrow at 10',
      createdAt: new Date('2026-06-07T10:00:30Z'),
    }),
  ] satisfies AiTraceAnalyticsRow[],
  abandonedClarify: [
    row({
      traceId: 'a1',
      surface: 'customer',
      userId: 'u2',
      action: 'cancel_booking',
      outcome: 'clarified',
      confidence: 0.5,
      failureSignal: 'clarify_abandoned',
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'cancel maybe',
      clarifyKind: 'intent_disambiguation',
      createdAt: new Date('2026-06-07T11:00:00Z'),
    }),
    row({
      traceId: 'a2',
      surface: 'customer',
      userId: 'u2',
      action: 'list_bookings',
      outcome: 'executed',
      confidence: 0.9,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'show my appointments',
      createdAt: new Date('2026-06-07T11:01:00Z'),
    }),
  ] satisfies AiTraceAnalyticsRow[],
  secondClarify: [
    row({
      traceId: 's1',
      surface: 'dashboard',
      userId: 'u3',
      action: 'create_booking',
      outcome: 'clarified',
      confidence: 0.48,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'book haircut',
      clarifyKind: 'entity_disambiguation',
      createdAt: new Date('2026-06-07T12:00:00Z'),
    }),
    row({
      traceId: 's2',
      surface: 'dashboard',
      userId: 'u3',
      action: 'create_booking',
      outcome: 'clarified',
      confidence: 0.52,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'with gevorg',
      clarifyKind: 'targeted_slots',
      createdAt: new Date('2026-06-07T12:00:20Z'),
    }),
  ] satisfies AiTraceAnalyticsRow[],
} as const;
