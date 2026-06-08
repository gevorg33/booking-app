import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface InlineClarifyValidationScenario {
  id: string;
  surface?: ClassificationSurface;
  field?: string;
  answer: string;
  timeZone?: string;
  expectValid: boolean;
  expectHint?: string;
}

export interface InlineClarifyFollowUpGateScenario {
  id: string;
  prompt: string;
  sessionContext: Record<string, unknown>;
  timeZone?: string;
  expectValid: boolean;
  expectHint?: string;
}

/** n99-1.5 — per-field inline answer validation. */
export const INLINE_CLARIFY_VALIDATION_SCENARIOS: InlineClarifyValidationScenario[] = [
  {
    id: 'date-tomorrow-valid',
    field: 'date',
    answer: 'tomorrow',
    expectValid: true,
  },
  {
    id: 'date-iso-valid',
    field: 'date',
    answer: '2026-06-10',
    expectValid: true,
  },
  {
    id: 'date-ambiguous-reject',
    field: 'date',
    answer: 'maybe sometime',
    expectValid: false,
    expectHint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
  },
  {
    id: 'time-2pm-valid',
    field: 'timeSlot',
    answer: '2pm',
    expectValid: true,
  },
  {
    id: 'time-10-valid',
    field: 'timeSlot',
    answer: '10:00',
    expectValid: true,
  },
  {
    id: 'time-vague-reject',
    field: 'timeSlot',
    answer: 'later',
    expectValid: false,
    expectHint: 'Pick a specific time (for example 10:00 or 2pm).',
  },
  {
    id: 'entity-name-valid',
    field: 'employeeName',
    answer: 'Anna Smith',
    expectValid: true,
  },
  {
    id: 'entity-name-empty-reject',
    field: 'employeeName',
    answer: '   ',
    expectValid: false,
    expectHint: 'Please choose or enter a value.',
  },
];

/** n99-1.5 — follow-up gate before classify re-run. */
export const INLINE_CLARIFY_FOLLOWUP_GATE_SCENARIOS: InlineClarifyFollowUpGateScenario[] = [
  {
    id: 'single-date-field-reject',
    prompt: 'maybe sometime',
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Massage', employeeName: 'Anna' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
        clarifyFields: ['date'],
      },
    },
    expectValid: false,
    expectHint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
  },
  {
    id: 'single-date-field-accept',
    prompt: 'tomorrow',
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Massage', employeeName: 'Anna' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
        clarifyFields: ['date'],
      },
      _clarifyMemory: { date: 'tomorrow' },
    },
    expectValid: true,
  },
  {
    id: 'multi-field-form-reject-bad-date',
    prompt: 'book massage. Date: maybe. Time: 10:00',
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Massage' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
        clarifyFields: ['employeeName', 'date', 'timeSlot'],
      },
      _clarifyMemory: { employeeName: 'Anna Smith', timeSlot: '10:00' },
    },
    expectValid: false,
    expectHint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
  },
  {
    id: 'multi-field-form-accept',
    prompt: 'book massage. Date: 2026-06-10. Time: 10:00',
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Massage' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
        clarifyFields: ['employeeName', 'date', 'timeSlot'],
      },
      _clarifyMemory: {
        employeeName: 'Anna Smith',
        date: '2026-06-10',
        timeSlot: '10:00',
      },
    },
    expectValid: true,
  },
  {
    id: 'not-follow-up-skips',
    prompt: 'book haircut tomorrow',
    sessionContext: {},
    expectValid: true,
  },
];
