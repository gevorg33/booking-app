import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E249_DASHBOARD_CREATE_BOOKING_SCENARIOS,
  E2E249_PUBLIC_BOOK_APPOINTMENT_SCENARIOS,
} from './ai-e2e249-check-book-create-booking.fixtures.js';
import { disambiguateMisclassifiedAvailabilityIntent } from './ai-intent-disambiguation.util.js';

describe('e2e-bug.249 check-then-book stays create_booking (not book_appointment)', () => {
  const rescue = new AiIntentRescueService();
  const employees = [{ id: 'e1', name: 'Gevorg Gasparyan' }];

  it('does not remap create_booking → book_appointment via public availability', () => {
    const prompt =
      'check who is free tomorrow evening for permanent lashes, book the nearest slot';
    expect(
      disambiguateMisclassifiedAvailabilityIntent(
        'public',
        prompt,
        'create_booking',
        {},
      ),
    ).toBeNull();
  });

  it.each(
    E2E249_DASHBOARD_CREATE_BOOKING_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('dashboard/check-book %s → create_booking', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.fromAction,
      params: {},
      employees,
      ...(row.surface ? { surface: row.surface } : {}),
    });
    expect(result?.action).toBe(row.expectedAction);
    expect(result?.action).not.toBe('book_appointment');
    if (row.expectBookingFirstAvailable) {
      expect(result?.params?.bookingFirstAvailable).toBe(true);
    }
    if (row.expectRescueReason) {
      expect(result?.rescueReason).toBe(row.expectRescueReason);
    }
  });

  it.each(
    E2E249_PUBLIC_BOOK_APPOINTMENT_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('public nearest %s → book_appointment', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.fromAction,
      params: {},
      employees,
      surface: row.surface,
    });
    expect(result?.action).toBe(row.expectedAction);
    if (row.expectBookingFirstAvailable) {
      expect(result?.params?.bookingFirstAvailable).toBe(true);
    }
  });
});
