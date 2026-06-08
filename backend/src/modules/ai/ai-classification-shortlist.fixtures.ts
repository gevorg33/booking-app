import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** acc-3.3 — always keep unknown + common intents when prompt signals are weak. */
export const SURFACE_BASELINE_SHORTLIST_INTENTS: Record<
  ClassificationSurface,
  readonly string[]
> = {
  dashboard: [
    'create_booking',
    'list_bookings',
    'show_appointments',
    'check_providers_for_service',
    'check_availability',
    'cancel_bookings',
    'summarize_bookings',
  ],
  customer: [
    'book_nearest_slot',
    'check_providers_for_service',
    'list_my_appointments',
    'cancel_my_booking',
    'check_availability',
  ],
  provider: [
    'list_bookings',
    'show_appointments',
    'cancel_bookings',
    'check_availability',
    'reschedule_booking',
    'mark_paid',
  ],
  public: [
    'check_availability',
    'book_appointment',
    'list_services',
    'list_providers',
    'recommend_specialists',
  ],
};

/** Prompt regex → intents to boost (surface-specific where noted). */
export const SHORTLIST_PROMPT_SIGNALS: ReadonlyArray<{
  id: string;
  pattern: RegExp;
  intents: readonly string[];
  surfaces?: readonly ClassificationSurface[];
  weight: number;
}> = [
  {
    id: 'cancel',
    pattern: /\b(cancel|call off|drop|remove)\b/i,
    intents: ['cancel_bookings', 'cancel_my_booking', 'bulk_smart_cancel'],
    weight: 2.5,
  },
  {
    id: 'reschedule',
    pattern: /\b(reschedule|move|shift|change time)\b/i,
    intents: ['reschedule_booking'],
    weight: 2.5,
  },
  {
    id: 'availability-team',
    pattern: /\b(who is free|who has availability|which provider|any provider)\b/i,
    intents: ['check_providers_for_service', 'check_availability'],
    weight: 3,
  },
  {
    id: 'book-flex',
    pattern: /\b(nearest|soonest|first available|asap|as soon as possible)\b/i,
    intents: ['book_nearest_slot', 'book_appointment', 'create_booking'],
    weight: 2.8,
  },
  {
    id: 'book-standard',
    pattern: /\b(book|schedule|reserve|appointment|put on the books)\b/i,
    intents: ['create_booking', 'book_appointment', 'book_nearest_slot'],
    weight: 2.2,
  },
  {
    id: 'revenue',
    pattern: /\b(revenue|earnings|how much|busiest|payment sweep|paid today)\b/i,
    intents: [
      'summarize_bookings',
      'payment_sweep',
      'summarize_day',
      'revenue_forecast',
    ],
    weight: 2.4,
  },
  {
    id: 'list-appointments',
    pattern: /\b(show appointments|list bookings|calendar today|my appointments)\b/i,
    intents: ['list_bookings', 'show_appointments', 'list_my_appointments'],
    weight: 2.3,
  },
  {
    id: 'clear-schedule',
    pattern: /\b(clear schedule|wipe schedule|reset schedule)\b/i,
    intents: ['clear_schedule', 'block_schedule'],
    weight: 2.5,
  },
  {
    id: 'explain-prefix',
    pattern: /\b(explain|why does|what does|how does)\b/i,
    intents: [],
    weight: 0.8,
  },
  {
    id: 'configure-prefix',
    pattern: /\b(configure|set up|enable|turn on|apply)\b/i,
    intents: [],
    weight: 0.8,
  },
  {
    id: 'clinic',
    pattern: /\b(lab|test result|specimen|patient chart|fasting|clinic)\b/i,
    intents: [
      'enter_test_result',
      'release_test_result',
      'list_test_orders',
      'explain_clinic_services',
      'book_lab_collection',
      'list_my_test_results',
    ],
    weight: 1.8,
  },
  {
    id: 'tour',
    pattern: /\b(tour|departure|pax|group size|remaining spots)\b/i,
    intents: [
      'explain_tour_booking',
      'list_upcoming_tour_departures',
      'diagnose_tour_capacity',
    ],
    weight: 1.8,
  },
  {
    id: 'tax-currency',
    pattern: /\b(tax|vat|currency|stripe checkout|€|usd)\b/i,
    intents: [
      'explain_business_tax',
      'explain_checkout_tax',
      'explain_business_currency',
      'explain_stripe_tax_charge',
    ],
    weight: 1.6,
  },
  {
    id: 'gift-package',
    pattern: /\b(gift card|package|promo code|subscription)\b/i,
    intents: [
      'book_package',
      'apply_promo_code',
      'explain_package_currency',
      'list_gift_cards',
    ],
    weight: 1.5,
  },
];

/** Extra keyword hints beyond auto-derived intent tokens (acc-3.3). */
export const INTENT_SHORTLIST_KEYWORD_OVERRIDES: Record<string, readonly string[]> =
  {
    create_booking: ['book', 'schedule', 'appointment', 'reserve', 'slot'],
    cancel_bookings: ['cancel', 'drop', 'remove appointment', 'call off'],
    reschedule_booking: ['reschedule', 'move', 'shift', 'change time'],
    check_availability: ['available', 'free', 'open slot', 'openings'],
    check_providers_for_service: [
      'who is free',
      'who has availability',
      'providers',
      'available',
      'free',
      'stylist',
    ],
    book_nearest_slot: ['nearest', 'soonest', 'first available', 'asap'],
    book_appointment: ['book', 'appointment', 'reserve', 'earliest'],
    list_bookings: ['list bookings', 'show appointments', 'appointments today'],
    show_appointments: ['show appointments', 'calendar', 'schedule today'],
    summarize_bookings: ['how many', 'revenue', 'earnings', 'busiest'],
    summarize_customers: ['top customers', 'vip', 'no-show', 'at risk'],
    clear_schedule: ['clear schedule', 'wipe schedule', 'reset schedule'],
    lookup_service_assignment: ['who can do', 'who is doing', 'who performs'],
    list_my_appointments: ['my appointments', 'my bookings'],
    cancel_my_booking: ['cancel my', 'drop my appointment'],
    recommend_specialists: ['best rated', 'top specialist', 'recommend'],
    list_services: ['services', 'price list', 'catalog'],
    list_providers: ['providers', 'stylists', 'who works'],
    mark_paid: ['mark paid', 'payment done', 'mark as paid'],
    payment_sweep: ['payment sweep', 'mark unpaid as paid'],
    mark_no_shows: ['no show', 'no-show', 'mark no shows'],
  };

export const SHORTLIST_CLASSIFIER_RULES = `- Dynamic intent shortlist (acc-3.3): when a shortlist is provided, classify using ONLY one of those actions (plus unknown if none fit). Do not invent actions outside the shortlist.`;
