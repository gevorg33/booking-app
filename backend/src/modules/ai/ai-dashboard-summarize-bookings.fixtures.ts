/** Dashboard summarize_bookings revenue + tenant currency (ai-cmd-ext-1.6). */

export const DASHBOARD_SUMMARIZE_BOOKINGS_CURRENCY_CLASSIFIER_RULES = `- summarize_bookings revenue/earnings: format totals in the salon tenant business currency (formatBusinessMoney — AMD shows ֏, EUR shows €, USD shows $). Set bookingMetric="revenue" for "how much did we earn", "total revenue", "calculate earnings". Single-period booking revenue total only — NOT summarize_revenue_kpis (dashboard overview + reports staff/service KPI bundle), NOT summarize_staff (per-provider ranking), NOT explain_business_currency (settings overview).
- Examples:
  - "How much did we earn today?" → summarize_bookings, bookingMetric=revenue
  - "Calculate total earnings for last week" → summarize_bookings, bookingMetric=revenue
  - "Total booking revenue this month" → summarize_bookings, bookingMetric=revenue
  - "Օրվա ընդհանուր եկամուտը" → summarize_bookings, bookingMetric=revenue
  - "Сколько мы заработали за сегодня?" → summarize_bookings, bookingMetric=revenue`;

export const SUMMARIZE_BOOKINGS_REVENUE_CURRENCY_SCENARIOS = [
  {
    id: 'dash-revenue-eur-salon',
    amount: 4200,
    appointmentCount: 3,
    settings: { currency: 'EUR' },
    pattern: /€|EUR/,
  },
  {
    id: 'dash-revenue-amd-salon',
    amount: 15000,
    appointmentCount: 5,
    settings: { currency: 'AMD' },
    pattern: /֏|AMD/,
  },
  {
    id: 'dash-revenue-usd-salon',
    amount: 199.5,
    appointmentCount: 2,
    settings: { currency: 'USD' },
    pattern: /\$|USD/,
  },
  {
    id: 'dash-revenue-gbp-legacy-default',
    amount: 880,
    appointmentCount: 1,
    settings: { defaultCurrency: 'GBP' },
    pattern: /£|GBP/,
  },
  {
    id: 'dash-revenue-zero-appts',
    amount: 0,
    appointmentCount: 0,
    settings: { currency: 'EUR' },
    pattern: /€|EUR|0/,
  },
] as const;

export const SUMMARIZE_BOOKINGS_OVERVIEW_REVENUE_SCENARIOS = [
  {
    id: 'dash-revenue-overview-unpaid',
    amount: 250,
    unpaidCount: 2,
    settings: { currency: 'USD' },
    pattern: /\$|USD/,
  },
] as const;

export const SUMMARIZE_BOOKINGS_REVENUE_PROMPTS = [
  {
    id: 'dash-earn-today-en',
    prompt: 'How much did we earn today?',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-calc-earnings-today-en',
    prompt: 'Calculate total earnings for today',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-revenue-last-week-en',
    prompt: 'What is total revenue last week',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-earn-last-month-en',
    prompt: 'How much did we earn last month?',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-income-this-week-en',
    prompt: 'Show total income this week',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-sales-yesterday-en',
    prompt: 'Compute total sales for yesterday',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-earnings-all-time-en',
    prompt: 'Tell me total earnings all time',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-revenue-this-month-en',
    prompt: 'Total booking revenue this month',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-earn-today-hy',
    prompt: 'Օրվա ընդհանուր եկամուտը',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-earn-today-ru',
    prompt: 'Сколько мы заработали за сегодня?',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-revenue-custom-range-en',
    prompt: 'Get total revenue from 01/05/2026 to 31/05/2026',
    bookingMetric: 'revenue',
  },
  {
    id: 'dash-revenue-overview-en',
    prompt: 'Booking overview for today',
    bookingMetric: 'overview',
  },
] as const;

export const RESCHEDULE_NEAREST_FREE_YEAR_PROMPT =
  'Move Jujos appointment on June 10 2027 from 16-17 to june 11 2027 nearest free time';

export const SUMMARIZE_BOOKINGS_HANDLER_SCENARIOS = [
  {
    id: 'handler-revenue-eur-tenant',
    metric: 'revenue' as const,
    settings: { currency: 'EUR' },
    range: { start: '2026-06-10', end: '2026-06-10' },
    bookings: [
      {
        status: 'completed',
        paymentStatus: 'paid',
        startTime: new Date('2026-06-10T10:00:00Z'),
        service: { price: 60 },
        employee: { name: 'Anna' },
      },
      {
        status: 'confirmed',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-10T14:00:00Z'),
        service: { price: 40 },
        employee: { name: 'Bob' },
      },
      {
        status: 'cancelled',
        paymentStatus: 'not_applicable',
        startTime: new Date('2026-06-10T16:00:00Z'),
        service: { price: 100 },
        employee: { name: 'Anna' },
      },
    ],
    expectedTotal: 100,
    summaryPattern: /€|EUR/,
    expectedAppointmentCount: 2,
  },
  {
    id: 'handler-overview-amd-tenant',
    metric: 'overview' as const,
    settings: { currency: 'AMD' },
    range: { start: '2026-06-11', end: '2026-06-11' },
    bookings: [
      {
        status: 'completed',
        paymentStatus: 'paid',
        startTime: new Date('2026-06-11T09:00:00Z'),
        service: { price: 15000 },
        employee: { name: 'Gevorg' },
      },
      {
        status: 'pending',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-11T11:00:00Z'),
        service: { price: 8000 },
        employee: { name: 'Maria' },
      },
    ],
    expectedTotal: 23000,
    summaryPattern: /֏|AMD/,
    expectedUnpaid: 1,
  },
] as const;

export const SUMMARIZE_BOOKINGS_REVENUE_BOOKING_ROWS = [
  {
    id: 'dash-revenue-mixed-statuses',
    rows: [
      { status: 'completed', servicePrice: 50 },
      { status: 'confirmed', servicePrice: 30 },
      { status: 'cancelled', servicePrice: 100 },
      { status: 'pending', servicePrice: 20 },
      { status: 'no_show', servicePrice: 40 },
    ],
    expectedTotal: 100,
    expectedCount: 3,
  },
  {
    id: 'dash-revenue-in-progress',
    rows: [
      { status: 'in_progress', servicePrice: 75 },
      { status: 'completed', servicePrice: 25 },
    ],
    expectedTotal: 100,
    expectedCount: 2,
  },
] as const;
