import {
  extractCustomerBookingContextFromPrompt,
  extractSingleProviderNameFromPrompt,
  extractUpcomingAppointmentScope,
  isCustomerBookingContextPrompt,
  isSingleProviderRevenuePrompt,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import {
  CUSTOMER_BOOKING_CONTEXT_SCENARIOS,
  PROVIDER_REVENUE_SCENARIOS,
  UPCOMING_APPOINTMENTS_SCENARIOS,
} from './ai-dashboard-ops.fixtures.js';

describe('ai-dashboard-ops.util', () => {
  describe('isCustomerBookingContextPrompt', () => {
    it.each(CUSTOMER_BOOKING_CONTEXT_SCENARIOS.map((s) => [s.id, s.prompt]))(
      'detects %s',
      (_id, prompt) => {
        expect(isCustomerBookingContextPrompt(prompt)).toBe(true);
      },
    );

    it('rejects prompts without customer or booking context', () => {
      expect(isCustomerBookingContextPrompt('List all customers')).toBe(false);
      expect(isCustomerBookingContextPrompt('Show revenue today')).toBe(false);
      expect(isCustomerBookingContextPrompt('Book haircut tomorrow')).toBe(
        false,
      );
    });

    it('accepts booking-with phrasing without summarize verb', () => {
      expect(
        isCustomerBookingContextPrompt(
          'Customer Anna has a booking with Gevorg',
        ),
      ).toBe(true);
      expect(
        isCustomerBookingContextPrompt('Who has a booking with Maria today'),
      ).toBe(true);
      expect(
        isCustomerBookingContextPrompt('booking with Gevorg for customer Sam'),
      ).toBe(true);
    });
  });

  describe('extractCustomerBookingContextFromPrompt', () => {
    it('extracts customer, provider, time, and today', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00',
      );
      expect(ctx).toEqual({
        customerName: 'Maria Lopez',
        employeeName: 'Gevorg',
        timeSlot: '10:00',
        dateHint: 'today',
      });
    });

    it('extracts tomorrow date hint', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Tell me about customer James Smith who has a booking on Mary tomorrow at 14:30',
      );
      expect(ctx.dateHint).toBe('tomorrow');
      expect(ctx.customerName).toBe('James Smith');
      expect(ctx.employeeName).toBe('Mary');
    });

    it('extracts via who is pattern', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Who is customer Robert Brown who has a booking with Maria today at 11:30',
      );
      expect(ctx.customerName).toBe('Robert Brown');
      expect(ctx.employeeName).toBe('Maria');
    });

    it('extracts service provider prefix and pm time', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Summarize customer Anna who has a booking with service provider Gevorg today at 3pm',
      );
      expect(ctx.employeeName).toBe('Gevorg');
      expect(ctx.timeSlot).toBe('3pm');
    });

    it('extracts booking on provider with full name', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Profile customer Lisa Chen — booking on Gevorg Gasparyan today at 09:00',
      );
      expect(ctx.customerName).toBe('Lisa Chen');
      expect(ctx.employeeName).toBe('Gevorg Gasparyan');
    });

    it('skips reserved words as customer names', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Summarize customer service provider today',
      );
      expect(ctx.customerName).not.toBe('customer');
    });

    it('extracts via look up phrasing', () => {
      const ctx = extractCustomerBookingContextFromPrompt(
        'Look up John Doe who has a booking with Anna at 15:00',
      );
      expect(ctx.customerName).toBe('John Doe');
      expect(ctx.timeSlot).toBe('15:00');
    });

    it('returns empty context for unrelated text', () => {
      expect(extractCustomerBookingContextFromPrompt('List packages')).toEqual(
        {},
      );
    });
  });

  describe('isSingleProviderRevenuePrompt', () => {
    it.each(PROVIDER_REVENUE_SCENARIOS.map((s) => [s.id, s.prompt]))(
      'detects %s',
      (_id, prompt) => {
        expect(isSingleProviderRevenuePrompt(prompt)).toBe(true);
      },
    );

    it('rejects top-N and total earnings prompts', () => {
      expect(
        isSingleProviderRevenuePrompt('Top 3 specialists by revenue last week'),
      ).toBe(false);
      expect(
        isSingleProviderRevenuePrompt('Calculate total earnings for today'),
      ).toBe(false);
      expect(
        isSingleProviderRevenuePrompt('What is total revenue this week'),
      ).toBe(false);
    });

    it('rejects revenue forecast prompts', () => {
      expect(
        isSingleProviderRevenuePrompt(
          'Project next week revenue from current schedule',
        ),
      ).toBe(false);
    });

    it('rejects non-revenue prompts', () => {
      expect(
        isSingleProviderRevenuePrompt('Show appointments for Gevorg'),
      ).toBe(false);
    });

    it('detects how much did stylist make phrasing', () => {
      expect(
        isSingleProviderRevenuePrompt(
          'How much did stylist Maria make last week?',
        ),
      ).toBe(true);
    });
  });

  describe('extractSingleProviderNameFromPrompt', () => {
    it.each(
      PROVIDER_REVENUE_SCENARIOS.filter(
        (s) => s.paramsPartial?.employeeName,
      ).map((s) => [s.id, s.prompt, s.paramsPartial!.employeeName]),
    )('extracts provider from %s', (_id, prompt, expected) => {
      expect(extractSingleProviderNameFromPrompt(prompt)).toBe(expected);
    });

    it('extracts via for provider prefix', () => {
      expect(
        extractSingleProviderNameFromPrompt(
          'Show revenue of provider Gevorg last month',
        ),
      ).toBe('Gevorg');
    });

    it('returns undefined for generic provider revenue', () => {
      expect(
        extractSingleProviderNameFromPrompt(
          'Show service provider revenue today',
        ),
      ).toBeUndefined();
    });

    it('skips reserved action words', () => {
      expect(
        extractSingleProviderNameFromPrompt(
          'Show revenue for service provider today',
        ),
      ).toBeUndefined();
    });
  });

  describe('isUpcomingAppointmentsPrompt', () => {
    it.each(UPCOMING_APPOINTMENTS_SCENARIOS.map((s) => [s.id, s.prompt]))(
      'detects %s',
      (_id, prompt) => {
        expect(isUpcomingAppointmentsPrompt(prompt)).toBe(true);
      },
    );

    it('rejects non-upcoming appointment lists', () => {
      expect(isUpcomingAppointmentsPrompt('Show appointments today')).toBe(
        false,
      );
      expect(isUpcomingAppointmentsPrompt('List bookings yesterday')).toBe(
        false,
      );
      expect(isUpcomingAppointmentsPrompt('upcoming staff meeting')).toBe(
        false,
      );
    });

    it('accepts upcoming bookings without explicit show verb', () => {
      expect(
        isUpcomingAppointmentsPrompt('upcoming appointments this week'),
      ).toBe(true);
      expect(isUpcomingAppointmentsPrompt('upcoming bookings schedule')).toBe(
        true,
      );
    });
  });

  describe('extractUpcomingAppointmentScope', () => {
    it('extracts all providers scope variants', () => {
      expect(
        extractUpcomingAppointmentScope(
          'Show upcoming appointments for all providers',
        ),
      ).toEqual({
        allProviders: true,
        employeeNames: [],
      });
      expect(
        extractUpcomingAppointmentScope(
          'List upcoming bookings for every provider',
        ),
      ).toEqual({
        allProviders: true,
        employeeNames: [],
      });
      expect(
        extractUpcomingAppointmentScope('Show upcoming appointments for all'),
      ).toEqual({
        allProviders: true,
        employeeNames: [],
      });
    });

    it('extracts named providers with and/comma', () => {
      expect(
        extractUpcomingAppointmentScope(
          'List upcoming appointments for Gevorg and Maria',
        ),
      ).toEqual({
        allProviders: false,
        employeeNames: ['Gevorg', 'Maria'],
      });
      expect(
        extractUpcomingAppointmentScope(
          'View upcoming appointments for Gevorg, Maria',
        ),
      ).toEqual({
        allProviders: false,
        employeeNames: ['Gevorg', 'Maria'],
      });
    });

    it('defaults to all providers when scope is unspecified', () => {
      expect(
        extractUpcomingAppointmentScope('Show upcoming appointments'),
      ).toEqual({
        allProviders: true,
        employeeNames: [],
      });
    });

    it('filters some/all/every/providers scope words from names', () => {
      expect(
        extractUpcomingAppointmentScope(
          'Show upcoming appointments for some providers',
        ),
      ).toEqual({
        allProviders: true,
        employeeNames: [],
      });
    });
  });
});
