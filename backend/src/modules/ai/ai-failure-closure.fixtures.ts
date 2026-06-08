export type FailureFixType = 'rescue' | 'fewshot' | 'prompt' | 'alias';
export type FailureFixStatus = 'open' | 'applied' | 'dismissed';

export const FAILURE_CLOSURE_SCENARIOS = [
  {
    id: 'misroute-rescue',
    classifiedAction: 'list_bookings',
    expectedRescuedAction: 'show_appointments',
    expectFixType: 'rescue' as FailureFixType,
  },
  {
    id: 'clarify-prompt',
    labelOutcome: 'clarify',
    expectedClarifyFields: ['date'],
    expectFixType: 'prompt' as FailureFixType,
  },
  {
    id: 'entity-alias',
    expectedParams: { customerName: 'Maria K.' },
    classifiedAction: 'create_booking',
    expectFixType: 'alias' as FailureFixType,
  },
  {
    id: 'fewshot-correction',
    classifiedAction: 'create_booking',
    correctedAction: 'list_bookings',
    expectFixType: 'fewshot' as FailureFixType,
  },
] as const;
