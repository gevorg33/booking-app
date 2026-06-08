import type { EntityMemoryEntry } from './ai-settings.types.js';

export const ALIAS_SUGGESTION_MIN_CORRECTIONS = 3;

export const ALIAS_SUGGESTION_SCENARIOS = [
  {
    id: 'aggregate-recurring',
    corrections: [
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
    ],
    expectSuggested: true,
  },
  {
    id: 'skip-single',
    corrections: [{ alias: 'anna', field: 'serviceName', value: 'Facial' }],
    expectSuggested: false,
  },
  {
    id: 'retry-pair',
    prior: {
      traceId: 't1',
      rawPrompt: 'book gev for haircut tomorrow',
      action: 'create_booking',
      outcome: 'clarified',
      params: null,
      feedbackReason: null,
      feedbackRating: null,
      failureSignal: 'suspected_miss',
      correctedAction: 'create_booking',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      userId: 'u1',
    },
    followUp: {
      traceId: 't2',
      rawPrompt: 'book gevorg for haircut tomorrow',
      action: 'create_booking',
      outcome: 'executed',
      params: { employeeName: 'Gevorg', serviceName: 'Haircut' },
      feedbackReason: null,
      feedbackRating: null,
      failureSignal: null,
      correctedAction: null,
      createdAt: new Date('2026-06-01T10:01:00.000Z'),
      userId: 'u1',
    },
    expectAlias: 'gev',
  },
] as const;

export interface AliasCorrectionEvent {
  alias: string;
  field: keyof EntityMemoryEntry;
  value: string;
  seenAt?: string;
  source?: 'entity_disambiguation' | 'correction';
}
