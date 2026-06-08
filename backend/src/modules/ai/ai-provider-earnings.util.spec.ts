import { PROVIDER_EARNINGS_PROMPT_SCENARIOS } from './ai-provider-earnings.fixtures.js';
import {
  formatAppointmentCountSummary,
  formatProviderRevenueSummary,
  isSummarizeMyAppointmentsPrompt,
  isSummarizeMyRevenuePrompt,
  rescueProviderEarningsIntent,
  summarizeProviderAppointmentCounts,
  summarizeProviderRevenue,
  computeProviderBookingEarnings,
} from './ai-provider-earnings.util.js';

describe('ai-provider-earnings.util', () => {
  it.each(
    PROVIDER_EARNINGS_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'summarize_my_appointments',
    ).map((s) => [s.id, s.prompt]),
  )('detects appointment count prompt %s', (_id, prompt) => {
    expect(isSummarizeMyAppointmentsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EARNINGS_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'summarize_my_revenue',
    ).map((s) => [s.id, s.prompt]),
  )('detects revenue prompt %s', (_id, prompt) => {
    expect(isSummarizeMyRevenuePrompt(prompt)).toBe(true);
  });

  it.each(PROVIDER_EARNINGS_PROMPT_SCENARIOS.map((s) => [s.id, s]))(
    'rescues $0 to $1.expectedAction',
    (_id, scenario) => {
      expect(rescueProviderEarningsIntent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('summarizes appointment counts by status', () => {
    const summary = summarizeProviderAppointmentCounts(
      [
        { status: 'confirmed' },
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'cancelled' },
      ],
      { start: '2026-06-10', end: '2026-06-10' },
      'How many appointments do I have tomorrow?',
    );
    expect(summary.total).toBe(3);
    expect(summary.byStatus).toEqual({ confirmed: 2, pending: 1 });
    expect(formatAppointmentCountSummary(summary)).toContain('3 appointments');
  });

  it('computes net provider revenue with tax and commission', () => {
    const rules = [
      {
        id: 'rule-1',
        businessId: 'biz-1',
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        type: 'percent',
        value: 60,
        isActive: true,
      },
    ] as any[];

    const booking = {
      id: 'book-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: 'completed',
      paymentStatus: 'paid',
      service: { price: 100 },
      metadata: {
        pricing: {
          amountDue: 120,
          taxEnabled: true,
          taxAmount: 20,
          netAmount: 100,
          subtotal: 100,
        },
      },
    };

    const row = computeProviderBookingEarnings(booking, rules);
    expect(row.grossCollected).toBe(120);
    expect(row.taxExcluded).toBe(20);
    expect(row.netBeforeSplit).toBe(100);
    expect(row.providerNet).toBe(60);

    const summary = summarizeProviderRevenue(
      [booking],
      rules,
      { start: '2026-06-09', end: '2026-06-09' },
      'USD',
      'How much did I make today?',
    );
    expect(summary.providerNet).toBe(60);
    expect(formatProviderRevenueSummary(summary, (amount, currency) =>
      `$${amount.toFixed(2)} ${currency}`,
    )).toContain('$60.00 USD');
  });
});
