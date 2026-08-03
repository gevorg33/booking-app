import {
  applyBookingRescheduleActionHints,
  applyCreateBookingPromptHints,
  applyRescheduleBookingPromptHints,
  resolveFirstAvailableNotBeforeTime,
} from './ai-booking-reschedule-hints.util.js';

describe('ai-booking-reschedule-hints.util (ai-cmd-h3.1)', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Mary Torgomyan' },
  ];
  const customers = [
    { id: 'c1', name: 'Gevorg G' },
    { id: 'c2', name: 'Jujo' },
  ];

  it('extracts provider fallback chain for conditional booking', () => {
    const params: Record<string, unknown> = { serviceName: 'facemassage' };
    applyCreateBookingPromptHints(
      params,
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; if not whoever is free',
      employees,
    );
    expect(params.providerFallbackNames).toEqual([
      'Gevorg Gasparyan',
      'Mary Torgomyan',
    ]);
    expect(params.fallbackAnyProvider).toBe(true);
    expect(params.timeSlot).toBeUndefined();
    expect(params.bookingFirstAvailable).toBeUndefined();
  });

  it('sets first-available flags without fixed timeSlot', () => {
    const params: Record<string, unknown> = {
      serviceName: 'massage',
      timeSlot: '10:00',
    };
    applyCreateBookingPromptHints(
      params,
      'Book first available massage tomorrow evening on any provider',
      employees,
    );
    expect(params.bookingFirstAvailable).toBe(true);
    expect(params.allProviders).toBe(true);
    expect(params.timeOfDay).toBe('evening');
    expect(params.timeSlot).toBeUndefined();
    expect(resolveFirstAvailableNotBeforeTime(params, '')).toBe('17:00');
  });

  it('treats possessive provider as employee on reschedule nearest-free', () => {
    const params: Record<string, unknown> = {};
    // Year-qualified dates — bare "June 15" rolls to next year after mid-year.
    const prompt =
      "Move Gevorg's appointment on June 15 2027 to June 16th 2027 nearest free time";
    applyRescheduleBookingPromptHints(
      params,
      prompt,
      employees,
      customers,
      'UTC',
    );
    expect(params.employeeName).toBe('Gevorg Gasparyan');
    expect(params.employeeId).toBe('e1');
    expect(params.customerName).toBeNull();
    expect(params.bookingFirstAvailable).toBe(true);
    expect(params.date).toBe('16/06/2027');
    expect(params.fromDate).toBe('15/06/2027');
  });

  it('re-applies hints after rescue action flip via dispatcher', () => {
    const params: Record<string, unknown> = {
      customerName: 'Gevorg G',
      employeeName: 'Gevorg Gasparyan',
    };
    applyBookingRescheduleActionHints(
      'reschedule_booking',
      params,
      "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      { employees, customers, timeZone: 'UTC' },
    );
    expect(params.employeeName).toBe('Gevorg Gasparyan');
    expect(params.customerName).toBeNull();
    expect(params.bookingFirstAvailable).toBe(true);
  });
});
