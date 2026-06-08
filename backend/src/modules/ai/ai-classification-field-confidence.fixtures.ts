import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** acc-3.6 — per-field confidence below this triggers targeted clarify (acc-4). */
export const DEFAULT_FIELD_CONFIDENCE_THRESHOLD = 0.55;

export const FIELD_CONFIDENCE_PARAM_KEYS = [
  'action',
  'date',
  'timeSlot',
  'employeeName',
  'serviceName',
] as const;

export type FieldConfidenceParamKey = (typeof FIELD_CONFIDENCE_PARAM_KEYS)[number];

export const FIELD_CLARIFY_LABELS: Record<FieldConfidenceParamKey, string> = {
  action: 'Intent',
  date: 'Date',
  timeSlot: 'Start time',
  employeeName: 'Service provider',
  serviceName: 'Service',
};

export const FIELD_CLARIFY_MESSAGES: Record<FieldConfidenceParamKey, string> = {
  action: 'Which action did you mean?',
  date: 'Which date should I use?',
  timeSlot: 'What time should I use?',
  employeeName: 'Which provider or specialist?',
  serviceName: 'Which service from the catalog?',
};

export const FIELD_CLARIFY_EXAMPLES: Partial<Record<FieldConfidenceParamKey, string>> = {
  date: 'tomorrow or 29/05/2026',
  timeSlot: '09:00 or first available',
  employeeName: 'Gevorg or any provider',
  serviceName: 'facemassage',
};

/** acc-3.6 — field-level confidence scenarios (it.each in spec). */
export const FIELD_CONFIDENCE_SCENARIOS: ReadonlyArray<{
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  actionConfidence: number;
  expectLowFields: FieldConfidenceParamKey[];
  expectTargetedClarify: boolean;
}> = [
  {
    id: 'book-missing-service',
    prompt: 'Book with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: { employeeName: 'Gevorg', timeSlot: '10:00' },
    actionConfidence: 0.82,
    expectLowFields: ['serviceName', 'date'],
    expectTargetedClarify: true,
  },
  {
    id: 'book-complete',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      serviceName: 'Massage',
      employeeName: 'Gevorg',
      date: '08/06/2026',
      timeSlot: '10:00',
    },
    actionConfidence: 0.9,
    expectLowFields: [],
    expectTargetedClarify: false,
  },
  {
    id: 'flex-book-missing-service',
    prompt: 'Book the nearest slot for massage tomorrow evening',
    surface: 'customer',
    action: 'book_nearest_slot',
    params: { bookingFirstAvailable: true, timeOfDay: 'evening' },
    actionConfidence: 0.8,
    expectLowFields: ['serviceName', 'date'],
    expectTargetedClarify: true,
  },
  {
    id: 'availability-team-wide',
    prompt: 'Who is free tomorrow evening for lashes',
    surface: 'dashboard',
    action: 'check_providers_for_service',
    params: { serviceName: 'Lashes', allProviders: true },
    actionConfidence: 0.88,
    expectLowFields: ['date'],
    expectTargetedClarify: true,
  },
  {
    id: 'low-action-confidence',
    prompt: 'Maybe do something with Maria tomorrow',
    surface: 'dashboard',
    action: 'create_booking',
    params: {},
    actionConfidence: 0.4,
    expectLowFields: ['action', 'serviceName', 'date', 'timeSlot'],
    expectTargetedClarify: false,
  },
];

export const BOOKING_FIELD_ACTIONS = new Set([
  'create_booking',
  'book_nearest_slot',
  'book_appointment',
  'reschedule_booking',
]);

export const AVAILABILITY_FIELD_ACTIONS = new Set([
  'check_availability',
  'check_providers_for_service',
  'recommend_specialists',
]);
