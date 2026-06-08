import type { ClassificationSurface } from './ai-classification-engine.types.js';

export const SELF_CHECK_CLARIFY_CONFIDENCE_CAP = 0.45;
export const SELF_CHECK_MISMATCH_CONFIDENCE_CAP = 0.35;
export const SELF_CHECK_LLM_TRIGGER_MAX_CONFIDENCE = 0.78;

/** Rule-only self-check scenarios (acc-3.4). */
export const SELF_CHECK_RULE_SCENARIOS: ReadonlyArray<{
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params?: Record<string, unknown>;
  expectOk: boolean;
  expectReasonIncludes?: string;
}> = [
  {
    id: 'dash-availability-not-book',
    prompt: 'Who is free tomorrow evening for permanent lashes',
    surface: 'dashboard',
    action: 'create_booking',
    expectOk: false,
    expectReasonIncludes: 'availability',
  },
  {
    id: 'dash-read-not-book',
    prompt: 'How many appointments did we have today',
    surface: 'dashboard',
    action: 'create_booking',
    expectOk: false,
    expectReasonIncludes: 'read-only',
  },
  {
    id: 'dash-cancel-not-book',
    prompt: 'Cancel Maria appointment tomorrow',
    surface: 'dashboard',
    action: 'create_booking',
    expectOk: false,
    expectReasonIncludes: 'cancel',
  },
  {
    id: 'dash-flex-not-check-providers',
    prompt: 'Book the nearest slot for massage tomorrow evening',
    surface: 'dashboard',
    action: 'check_providers_for_service',
    expectOk: false,
    expectReasonIncludes: 'flexible booking',
  },
  {
    id: 'dash-book-ok',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: { serviceName: 'Massage', employeeName: 'Gevorg', timeSlot: '10:00' },
    expectOk: true,
  },
  {
    id: 'dash-revenue-ok',
    prompt: 'How much did we earn today',
    surface: 'dashboard',
    action: 'summarize_bookings',
    expectOk: true,
  },
  {
    id: 'customer-cancel-not-book',
    prompt: 'Cancel my appointment tomorrow',
    surface: 'customer',
    action: 'book_nearest_slot',
    expectOk: false,
    expectReasonIncludes: 'cancel',
  },
  {
    id: 'public-availability-not-book',
    prompt: 'Who is free tomorrow for lashes',
    surface: 'public',
    action: 'book_appointment',
    expectOk: false,
    expectReasonIncludes: 'availability',
  },
  {
    id: 'public-flex-ok',
    prompt: 'Book the nearest facemassage tomorrow evening',
    surface: 'public',
    action: 'book_appointment',
    params: { bookingFirstAvailable: true, serviceName: 'Facemassage' },
    expectOk: true,
  },
  {
    id: 'provider-list-ok',
    prompt: 'Show my appointments today',
    surface: 'provider',
    action: 'show_appointments',
    expectOk: true,
  },
  {
    id: 'dash-explain-mismatch',
    prompt: 'Why do prices show euros on checkout',
    surface: 'dashboard',
    action: 'create_booking',
    expectOk: false,
    expectReasonIncludes: 'explain',
  },
  {
    id: 'dash-missing-service',
    prompt: 'Book with Gevorg tomorrow at 10:00',
    surface: 'dashboard',
    action: 'create_booking',
    params: { employeeName: 'Gevorg', timeSlot: '10:00' },
    expectOk: false,
    expectReasonIncludes: 'serviceName',
  },
];

export const READ_ONLY_ACTION_PREFIXES = [
  'list_',
  'show_',
  'summarize_',
  'explain_',
  'lookup_',
  'check_',
  'recommend_',
  'diagnose_',
  'preview_',
] as const;

export const EXPLAIN_ACTION_PATTERN = /^explain_/;

export const CONFIGURE_ACTION_PATTERN = /^(configure_|apply_|enable_|set_|toggle_)/;
