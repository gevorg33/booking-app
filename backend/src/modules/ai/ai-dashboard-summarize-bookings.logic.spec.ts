import {
  SUMMARIZE_BOOKINGS_HANDLER_SCENARIOS,
  SUMMARIZE_BOOKINGS_OVERVIEW_REVENUE_SCENARIOS,
  SUMMARIZE_BOOKINGS_REVENUE_BOOKING_ROWS,
  SUMMARIZE_BOOKINGS_REVENUE_CURRENCY_SCENARIOS,
  SUMMARIZE_BOOKINGS_REVENUE_PROMPTS,
} from './ai-dashboard-summarize-bookings.fixtures.js';
import {
  buildSummarizeBookingsOverviewRevenueLine,
  buildSummarizeBookingsRevenueDetails,
  buildSummarizeBookingsRevenueLine,
  composeSummarizeBookingsResult,
  computeBookingRevenueTotal,
  formatSummarizeBookingsRevenue,
  isDashboardSummarizeBookingsPrompt,
  isRevenueEligibleBooking,
  rescueSummarizeBookingsIntent,
  resolveSummarizeBookingsCurrency,
} from './ai-dashboard-summarize-bookings.logic.js';

describe('ai-dashboard-summarize-bookings.logic (ai-cmd-ext-1.6)', () => {
  it.each(SUMMARIZE_BOOKINGS_REVENUE_CURRENCY_SCENARIOS)(
    'formats revenue KPI $id with tenant currency',
    ({ amount, appointmentCount, settings, pattern }) => {
      const line = buildSummarizeBookingsRevenueLine(
        amount,
        appointmentCount,
        settings,
      );
      expect(line).toMatch(pattern);
      expect(line).toContain(`${appointmentCount} appointment(s)`);

      const details = buildSummarizeBookingsRevenueDetails(
        amount,
        appointmentCount,
        settings,
      );
      expect(details.formatted).toMatch(pattern);
      expect(details.currency).toBe(resolveSummarizeBookingsCurrency(settings));
      expect(details.total).toBe(amount);
    },
  );

  it.each(SUMMARIZE_BOOKINGS_OVERVIEW_REVENUE_SCENARIOS)(
    'formats overview revenue line $id',
    ({ amount, unpaidCount, settings, pattern }) => {
      const line = buildSummarizeBookingsOverviewRevenueLine(
        amount,
        unpaidCount,
        settings,
      );
      expect(line).toMatch(pattern);
      expect(line).toContain(`${unpaidCount} unpaid`);
    },
  );

  it.each(SUMMARIZE_BOOKINGS_REVENUE_BOOKING_ROWS)(
    'computes booking revenue total $id',
    ({ rows, expectedTotal, expectedCount }) => {
      const eligible = rows.filter(isRevenueEligibleBooking);
      expect(computeBookingRevenueTotal(rows)).toBe(expectedTotal);
      expect(eligible).toHaveLength(expectedCount);
    },
  );

  it('defaults tenant currency to USD when settings missing', () => {
    expect(resolveSummarizeBookingsCurrency(undefined)).toBe('USD');
    expect(formatSummarizeBookingsRevenue(10, undefined)).toMatch(/\$|USD/);
  });

  it.each(SUMMARIZE_BOOKINGS_HANDLER_SCENARIOS)(
    'composeSummarizeBookingsResult $id',
    ({ metric, settings, range, bookings, expectedTotal, summaryPattern }) => {
      const result = composeSummarizeBookingsResult({
        bookings,
        businessSettings: settings,
        metric,
        range,
        now: new Date('2026-06-11T12:00:00Z'),
      });
      expect(result.summary).toMatch(summaryPattern);
      expect(result.details?.revenue?.total).toBe(expectedTotal);
    },
  );

  it('treats missing service price as zero revenue', () => {
    expect(
      computeBookingRevenueTotal([
        { status: 'completed', servicePrice: null },
        { status: 'confirmed', servicePrice: 15 },
      ]),
    ).toBe(15);
  });

  it.each(SUMMARIZE_BOOKINGS_REVENUE_PROMPTS)(
    'detects dashboard summarize_bookings prompt $id',
    ({ prompt }) => {
      expect(isDashboardSummarizeBookingsPrompt(prompt)).toBe(true);
      expect(rescueSummarizeBookingsIntent(prompt, 'unknown')).toMatchObject({
        action: 'summarize_bookings',
      });
    },
  );

  it('does not steal client overview prompts', () => {
    expect(isDashboardSummarizeBookingsPrompt('Client overview for Jane')).toBe(
      false,
    );
    expect(rescueSummarizeBookingsIntent('Client overview for Jane', 'unknown')).toBeNull();
  });

  it('skips rescue when action is already summarize_bookings', () => {
    expect(
      rescueSummarizeBookingsIntent('How much did we earn today?', 'summarize_bookings'),
    ).toBeNull();
  });

  it('detects booking overview with explicit date range', () => {
    expect(
      isDashboardSummarizeBookingsPrompt('Appointments overview 01/05/2026 to 31/05/2026'),
    ).toBe(true);
  });

  const composeBookings = [
    {
      status: 'completed',
      paymentStatus: 'paid',
      startTime: new Date('2026-06-10T10:00:00Z'),
      service: { price: 10 },
      employee: { name: 'Anna' },
    },
    {
      status: 'confirmed',
      paymentStatus: 'pending',
      startTime: new Date('2026-06-12T10:00:00Z'),
      service: { price: 20 },
      employee: { name: 'Bob' },
    },
    {
      status: 'cancelled',
      paymentStatus: 'not_applicable',
      startTime: new Date('2026-06-10T12:00:00Z'),
      service: { price: 5 },
      employee: { name: 'Anna' },
    },
    {
      status: 'no_show',
      paymentStatus: 'pending',
      startTime: new Date('2026-06-10T08:00:00Z'),
      service: { price: 15 },
      employee: { name: 'Cara' },
    },
    {
      status: 'pending',
      paymentStatus: 'pending',
      startTime: new Date('2026-06-11T10:00:00Z'),
      service: { price: 8 },
      employee: { name: 'Anna' },
    },
  ] as const;

  it.each([
    ['count', /active appointment/],
    ['busiest_provider', /appointment\(s\)/],
    ['cancelled', /cancelled appointment/],
    ['no_shows', /no-show/],
    ['unpaid', /unpaid appointment/],
    ['upcoming', /upcoming appointment/],
    ['confirmed', /confirmed appointment/],
    ['pending', /pending appointment/],
    ['completed', /completed appointment/],
  ] as const)(
    'composeSummarizeBookingsResult metric branch %s',
    (metric, pattern) => {
      const result = composeSummarizeBookingsResult({
        bookings: [...composeBookings],
        businessSettings: { currency: 'USD' },
        metric,
        range: { start: '2026-06-10', end: '2026-06-12' },
        now: new Date('2026-06-11T12:00:00Z'),
      });
      expect(result.summary).toMatch(pattern);
      expect(result.details?.date).toBeNull();
    },
  );

  it('composeSummarizeBookingsResult supports filters and provider scope', () => {
    const filtered = composeSummarizeBookingsResult({
      bookings: [...composeBookings],
      businessSettings: { currency: 'USD' },
      metric: 'count',
      range: { start: '2026-06-10', end: '2026-06-10' },
      statusFilter: 'completed',
      employeeId: 'emp-1',
      employeeName: 'Anna',
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(filtered.summary).toContain('(completed only)');
    expect(filtered.summary).not.toContain('cancelled ·');
    expect(filtered.details?.scope).toBe('provider');
    expect(filtered.details?.employee).toBe('Anna');
  });

  it('composeSummarizeBookingsResult busiest_provider ranks multiple providers', () => {
    const ranked = composeSummarizeBookingsResult({
      bookings: [
        {
          status: 'completed',
          paymentStatus: 'paid',
          startTime: new Date('2026-06-10T10:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Anna' },
        },
        {
          status: 'confirmed',
          paymentStatus: 'paid',
          startTime: new Date('2026-06-10T11:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Anna' },
        },
        {
          status: 'pending',
          paymentStatus: 'pending',
          startTime: new Date('2026-06-10T12:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Bob' },
        },
      ],
      businessSettings: { currency: 'USD' },
      metric: 'busiest_provider',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(ranked.summary).toContain('All providers:');
    expect(ranked.summary).toContain('Anna: 2');
    expect(ranked.summary).toContain('Bob: 1');
  });

  it('composeSummarizeBookingsResult busiest_provider handles ties and rankings', () => {
    const tied = composeSummarizeBookingsResult({
      bookings: [
        {
          status: 'completed',
          paymentStatus: 'paid',
          startTime: new Date('2026-06-10T10:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Anna' },
        },
        {
          status: 'confirmed',
          paymentStatus: 'paid',
          startTime: new Date('2026-06-10T11:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Bob' },
        },
      ],
      businessSettings: { currency: 'USD' },
      metric: 'busiest_provider',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(tied.summary).toMatch(/Tied with/);

    const empty = composeSummarizeBookingsResult({
      bookings: [
        {
          status: 'cancelled',
          paymentStatus: 'not_applicable',
          startTime: new Date('2026-06-10T10:00:00Z'),
          service: { price: 10 },
          employee: { name: 'Anna' },
        },
      ],
      businessSettings: { currency: 'USD' },
      metric: 'busiest_provider',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(empty.summary).toContain('No active appointments');
  });

  it('composeSummarizeBookingsResult overview omits busiest line when empty', () => {
    const result = composeSummarizeBookingsResult({
      bookings: [
        {
          status: 'cancelled',
          paymentStatus: 'not_applicable',
          startTime: new Date('2026-06-10T10:00:00Z'),
          service: { price: 0 },
          employee: { name: 'Anna' },
        },
      ],
      businessSettings: { currency: 'USD' },
      metric: 'overview',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(result.summary).not.toMatch(/Busiest:/);
  });

  it('composeSummarizeBookingsResult handles missing service and employee fields', () => {
    const result = composeSummarizeBookingsResult({
      bookings: [
        {
          status: 'completed',
          paymentStatus: 'paid',
          startTime: new Date('2026-06-10T10:00:00Z'),
          service: null,
          employee: null,
        },
      ],
      businessSettings: { currency: 'USD' },
      metric: 'revenue',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(result.details?.revenue?.total).toBe(0);
    expect(result.details?.busiestProvider?.name).toBe('Unknown');
  });

  it('composeSummarizeBookingsResult falls back for unknown metric title', () => {
    const result = composeSummarizeBookingsResult({
      bookings: [],
      businessSettings: { currency: 'USD' },
      metric: 'custom_metric',
      range: { start: '2026-06-10', end: '2026-06-10' },
      now: new Date('2026-06-11T12:00:00Z'),
    });
    expect(result.summary).toContain('Booking overview for all providers');
  });
});
