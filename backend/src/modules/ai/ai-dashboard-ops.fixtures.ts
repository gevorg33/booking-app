export interface DashboardOpsScenario {
  id: string;
  prompt: string;
  expectedAction: string;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  paramsAssert?: (params: Record<string, unknown>) => void;
}

export const CATALOG_COUNTED_SCENARIOS: DashboardOpsScenario[] = [
  {
    id: 'nails-10-hy-ru',
    prompt:
      'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
  {
    id: 'spa-15-hy',
    prompt:
      'Adding a new Spa category with 15 linked services and translations in Armenian',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
  {
    id: 'wax-6-new-service-category',
    prompt: 'new service category Wax with 6 linked services',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
  {
    id: 'brow-4-service-category',
    prompt: 'new Brow service category with 4 linked services',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
  {
    id: 'hair-8-create-services',
    prompt:
      'Adding a new Hair category, create 8 linked services and add translations in English',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
];

export const CUSTOMER_BOOKING_CONTEXT_SCENARIOS: DashboardOpsScenario[] = [
  {
    id: 'summarize-customer-today',
    prompt:
      'Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00',
    expectedAction: 'lookup_customer',
    rescueReason: 'customer_booking_context',
    paramsPartial: { bookingContext: true, date: 'today' },
    paramsAssert: (p) => {
      expect(p.customerName).toBe('Maria Lopez');
      expect(p.employeeName).toBe('Gevorg');
      expect(p.timeSlot).toBe('10:00');
    },
  },
  {
    id: 'tell-me-about-tomorrow',
    prompt:
      'Tell me about customer James Smith who has a booking on Mary tomorrow at 14:30',
    expectedAction: 'lookup_customer',
    rescueReason: 'customer_booking_context',
    paramsPartial: { bookingContext: true, date: 'tomorrow' },
    paramsAssert: (p) => {
      expect(p.customerName).toBe('James Smith');
      expect(p.employeeName).toBe('Mary');
      expect(p.timeSlot).toBe('14:30');
    },
  },
  {
    id: 'lookup-service-provider',
    prompt:
      'Lookup customer Anna who has a booking with service provider Gevorg today at 3pm',
    expectedAction: 'lookup_customer',
    rescueReason: 'customer_booking_context',
    paramsPartial: { bookingContext: true, date: 'today' },
    paramsAssert: (p) => {
      expect(p.employeeName).toBe('Gevorg');
      expect(p.timeSlot).toBe('3pm');
    },
  },
  {
    id: 'who-is-with-booking',
    prompt:
      'Who is customer Robert Brown who has a booking with Maria today at 11:30',
    expectedAction: 'lookup_customer',
    rescueReason: 'customer_booking_context',
    paramsPartial: { bookingContext: true, date: 'today' },
  },
  {
    id: 'profile-booking-on',
    prompt:
      'Profile customer Lisa Chen — booking on Gevorg Gasparyan today at 09:00',
    expectedAction: 'lookup_customer',
    rescueReason: 'customer_booking_context',
    paramsPartial: { bookingContext: true, date: 'today' },
  },
];

export const PROVIDER_REVENUE_SCENARIOS: DashboardOpsScenario[] = [
  {
    id: 'named-last-week',
    prompt: 'Summarize Gevorg revenue last week',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue', employeeName: 'Gevorg' },
  },
  {
    id: 'named-last-month',
    prompt: 'Show revenue for Maria Lopez last month',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue', employeeName: 'Maria Lopez' },
  },
  {
    id: 'generic-today',
    prompt: 'Show service provider revenue today',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue' },
    paramsAssert: (p) => expect(p.employeeName).toBeUndefined(),
  },
  {
    id: 'specialist-this-month',
    prompt: 'Summarize specialist earnings this month',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue' },
  },
  {
    id: 'provider-of-named',
    prompt: 'Show revenue of provider Gevorg last month',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue', employeeName: 'Gevorg' },
  },
  {
    id: 'stylist-made-sales',
    prompt: 'How much did stylist Maria make last week?',
    expectedAction: 'summarize_staff',
    rescueReason: 'single_provider_revenue',
    paramsPartial: { staffMetric: 'most_revenue' },
  },
];

export const UPCOMING_APPOINTMENTS_SCENARIOS: DashboardOpsScenario[] = [
  {
    id: 'all-providers',
    prompt: 'Show upcoming appointments for all providers',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true, allProviders: true },
  },
  {
    id: 'every-provider',
    prompt: 'List upcoming bookings for every provider',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true, allProviders: true },
  },
  {
    id: 'named-and',
    prompt: 'List upcoming appointments for Gevorg and Maria',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true },
    paramsAssert: (p) => {
      expect(p.employeeNames).toEqual(['Gevorg', 'Maria']);
    },
  },
  {
    id: 'named-comma',
    prompt: 'View upcoming appointments for Gevorg, Maria',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true },
    paramsAssert: (p) => {
      expect(p.employeeNames).toEqual(['Gevorg', 'Maria']);
    },
  },
  {
    id: 'unspecified-scope',
    prompt: 'Show upcoming appointments',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true, allProviders: true },
  },
  {
    id: 'display-upcoming-bookings',
    prompt: 'Display upcoming bookings',
    expectedAction: 'show_appointments',
    rescueReason: 'upcoming_appointments',
    paramsPartial: { upcomingOnly: true, allProviders: true },
  },
];

export const DASHBOARD_OPS_NEGATIVE_SCENARIOS: {
  id: string;
  prompt: string;
  wrongAction?: string;
}[] = [
  { id: 'total-earnings', prompt: 'Calculate total earnings for today' },
  { id: 'top-specialists', prompt: 'Top 3 specialists by revenue last week' },
  { id: 'cart-add', prompt: 'Add massage to my cart' },
  { id: 'today-appointments', prompt: 'Show appointments today' },
  { id: 'list-customers', prompt: 'List inactive customers' },
];

export const DASHBOARD_OPS_MISCLASSIFICATION_SCENARIOS: {
  id: string;
  wrongAction: string;
  prompt: string;
  expectedAction: string;
  rescueReason: string;
}[] = [
  {
    id: 'lookup-to-catalog',
    wrongAction: 'lookup_customer',
    prompt:
      'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian',
    expectedAction: 'bulk_create_catalog',
    rescueReason: 'bulk_catalog',
  },
];

export const ALL_DASHBOARD_OPS_SCENARIOS: DashboardOpsScenario[] = [
  ...CATALOG_COUNTED_SCENARIOS,
  ...CUSTOMER_BOOKING_CONTEXT_SCENARIOS,
  ...PROVIDER_REVENUE_SCENARIOS,
  ...UPCOMING_APPOINTMENTS_SCENARIOS,
];
