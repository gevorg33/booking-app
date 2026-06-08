/** acc-4 — smart clarification thresholds and fixtures. */
export const SMART_CLARIFY_MAX_ROUNDS = 1;

export {
  HONEST_FAILURE_CONFIDENCE_THRESHOLD as SMART_CLARIFY_HONEST_FAILURE_CONFIDENCE,
  HONEST_FAILURE_SUGGESTIONS,
} from './ai-honest-failure-clarify.fixtures.js';

export { HIGH_RISK_CONFIRM_ACTIONS } from './ai-high-risk-confirm-clarify.fixtures.js';

export interface SmartClarifyScenario {
  id: string;
  kind:
    | 'targeted_slots'
    | 'intent_disambiguation'
    | 'entity_disambiguation'
    | 'high_risk_confirm'
    | 'honest_failure';
  surface: 'dashboard' | 'customer' | 'provider' | 'public';
}

export const SMART_CLARIFY_SCENARIOS: SmartClarifyScenario[] = [
  { id: 'slots-missing-service', kind: 'targeted_slots', surface: 'dashboard' },
  { id: 'intent-top2', kind: 'intent_disambiguation', surface: 'dashboard' },
  { id: 'entity-two-annas', kind: 'entity_disambiguation', surface: 'dashboard' },
  { id: 'bulk-cancel-confirm', kind: 'high_risk_confirm', surface: 'dashboard' },
  { id: 'honest-after-retry', kind: 'honest_failure', surface: 'customer' },
];

/** acc-4.1 — targeted slot-fill: only ask missing fields (field confidence + validator). */
export const TARGETED_SLOT_CLARIFY_SCENARIOS: ReadonlyArray<{
  id: string;
  prompt: string;
  surface: 'dashboard' | 'customer' | 'provider' | 'public';
  action: string;
  params: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  resolved?: {
    params: Record<string, unknown>;
    enrichedParams: Record<string, unknown>;
    entities: Record<string, unknown>;
  };
  expectClarify: boolean;
  expectMissingFields: string[];
  expectSkippedFields: string[];
}> = [
  {
    id: 'acc41-missing-service-only',
    prompt: 'Book with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: { employeeName: 'Gevorg', timeSlot: '10:00', allProviders: false },
    resolved: {
      params: { employeeName: 'Gevorg', timeSlot: '10:00', allProviders: false },
      enrichedParams: { employeeName: 'Gevorg', timeSlot: '10:00', allProviders: false },
      entities: {},
    },
    expectClarify: true,
    expectMissingFields: ['serviceName'],
    expectSkippedFields: ['employeeName', 'timeSlot', 'date'],
  },
  {
    id: 'acc41-skip-clarify-memory',
    prompt: 'Book massage with Gevorg',
    surface: 'dashboard',
    action: 'create_booking',
    params: { serviceName: 'Massage', employeeName: 'Gevorg', allProviders: false },
    sessionContext: { _clarifyMemory: { date: '2026-06-08' } },
    resolved: {
      params: { serviceName: 'Massage', employeeName: 'Gevorg', date: '2026-06-08', allProviders: false },
      enrichedParams: { serviceName: 'Massage', employeeName: 'Gevorg', date: '2026-06-08', allProviders: false },
      entities: {},
    },
    expectClarify: true,
    expectMissingFields: ['timeSlot'],
    expectSkippedFields: ['serviceName', 'employeeName', 'date'],
  },
  {
    id: 'acc41-resolved-service-id',
    prompt: 'Book with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: { employeeName: 'Gevorg', timeSlot: '10:00', allProviders: false },
    resolved: {
      params: { employeeName: 'Gevorg', timeSlot: '10:00', allProviders: false },
      enrichedParams: {
        employeeName: 'Gevorg',
        timeSlot: '10:00',
        serviceId: 'svc-1',
        serviceName: 'Facemassage',
        allProviders: false,
      },
      entities: { service: { id: 'svc-1', name: 'Facemassage' } },
    },
    expectClarify: false,
    expectMissingFields: [],
    expectSkippedFields: ['serviceName', 'employeeName', 'timeSlot', 'date'],
  },
  {
    id: 'acc41-all-known-no-clarify',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      serviceName: 'Massage',
      employeeName: 'Gevorg',
      date: '2026-06-08',
      timeSlot: '10:00',
      allProviders: false,
    },
    resolved: {
      params: {
        serviceName: 'Massage',
        employeeName: 'Gevorg',
        date: '2026-06-08',
        timeSlot: '10:00',
        allProviders: false,
      },
      enrichedParams: {
        serviceName: 'Massage',
        employeeName: 'Gevorg',
        date: '2026-06-08',
        timeSlot: '10:00',
        allProviders: false,
      },
      entities: {},
    },
    expectClarify: false,
    expectMissingFields: [],
    expectSkippedFields: ['serviceName', 'employeeName', 'date', 'timeSlot'],
  },
];
