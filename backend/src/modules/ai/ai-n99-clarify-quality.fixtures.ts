import type { AiCommandTrace } from './entities/ai-command-trace.entity.js';

function trace(
  partial: Partial<AiCommandTrace> & Pick<AiCommandTrace, 'traceId'>,
): AiCommandTrace {
  return {
    businessId: 'biz-1',
    surface: 'dashboard',
    userId: 'u1',
    role: 'owner',
    rawPrompt: 'book haircut',
    normalizedPrompt: 'book haircut',
    locale: 'en',
    action: 'create_booking',
    confidence: 0.45,
    params: { _clarifyKind: 'targeted_slots' },
    routingTier: null,
    source: 'llm',
    outcome: 'clarified',
    latencyMs: 100,
    model: null,
    tokenCost: null,
    pipelineStages: null,
    failureSignal: null,
    feedbackRating: null,
    feedbackReason: null,
    correctedAction: null,
    locationId: null,
    abVariantId: null,
    createdAt: new Date('2026-06-07T10:00:00Z'),
    ...partial,
    id: partial.id ?? partial.traceId,
    traceId: partial.traceId,
  };
}

export const N99_CLARIFY_AUTO_QUEUE_SCENARIOS = [
  {
    id: 'en-second-clarify',
    prior: trace({
      traceId: 'c-prior',
      rawPrompt: 'book haircut',
      params: { _clarifyKind: 'entity_disambiguation' },
    }),
    followUp: trace({
      traceId: 'c-follow',
      rawPrompt: 'with gevorg',
      outcome: 'clarified',
      createdAt: new Date('2026-06-07T10:00:20Z'),
    }),
    expectQueued: true,
    expectOutcome: 'second_clarify',
  },
  {
    id: 'en-abandon-pivot',
    prior: trace({
      traceId: 'a-prior',
      rawPrompt: 'cancel maybe',
      action: 'cancel_booking',
      params: { _clarifyKind: 'intent_disambiguation' },
      failureSignal: 'clarify_abandoned',
    }),
    followUp: trace({
      traceId: 'a-follow',
      rawPrompt: 'show my appointments',
      action: 'list_bookings',
      outcome: 'executed',
      createdAt: new Date('2026-06-07T10:01:00Z'),
    }),
    expectQueued: true,
    expectOutcome: 'abandon',
  },
  {
    id: 'hy-success-skip',
    prior: trace({
      traceId: 's-prior',
      locale: 'hy',
      rawPrompt: 'ամսաժամկետ',
    }),
    followUp: trace({
      traceId: 's-follow',
      locale: 'hy',
      rawPrompt: 'վաղը 14:00',
      outcome: 'executed',
      createdAt: new Date('2026-06-07T10:00:30Z'),
    }),
    expectQueued: false,
  },
] as const;
