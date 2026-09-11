import { handleListMyUpcomingAppointmentsLogic } from './ai-list-my-upcoming-appointments.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

function makeDeps(
  bookings: Array<Record<string, unknown>> = [],
): SelfServiceBookingLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
    } as unknown as SelfServiceBookingLogicDeps['businessRepo'],
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings })),
    } as unknown as SelfServiceBookingLogicDeps['publicCustomerAuthService'],
  } as SelfServiceBookingLogicDeps;
}

/**
 * e2e-bug.423 — the clock is frozen because these fixtures name real dates.
 *
 * The fixtures book visits on 2026-08-15 and 2026-08-22 and the assertion counts
 * two upcoming. Both fall into the past within a fortnight, at which point the
 * count silently becomes one and then zero.
 *
 * Only `Date` is faked: timers stay real, so this changes what the code thinks
 * today is and nothing about how it runs. Freezing rather than rewriting the
 * fixtures to offsets from `Date.now()` — an offset-computed fixture becomes a
 * second implementation of the resolver it is meant to check.
 *
 * Found by `TIME_TRAVEL_DAYS` (e2e-bug.422) before it broke, not after.
 */
const FROZEN_NOW = new Date('2026-08-01T09:00:00.000Z');

beforeAll(() => {
  jest.useFakeTimers({
    now: FROZEN_NOW,
    doNotFake: [
      'nextTick',
      'setImmediate',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
    ],
  });
});

afterAll(() => {
  jest.useRealTimers();
});

describe('ai-list-my-upcoming-appointments.logic (ai-cmd-customer-4.4.1)', () => {
  const sampleBookings = [
    {
      id: 'book-1',
      serviceName: 'Massage',
      employeeName: 'Anna',
      startTime: '2026-08-15T14:00:00.000Z',
      status: BookingStatus.CONFIRMED,
      canCancel: true,
      canReschedule: true,
    },
    {
      id: 'book-2',
      serviceName: 'Facial',
      employeeName: 'Kim',
      startTime: '2026-08-22T10:00:00.000Z',
      status: BookingStatus.CONFIRMED,
      canCancel: true,
      canReschedule: true,
    },
  ];

  it('returns next upcoming appointment', async () => {
    const result = await handleListMyUpcomingAppointmentsLogic(
      makeDeps(sampleBookings),
      'biz-1',
      { sessionCustomerId: 'cust-1', _timeZone: 'UTC' },
      "What's my next appointment?",
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_my_upcoming_appointments');
    expect(result.details.scope).toBe('next');
    expect(result.details.upcomingCount).toBe(1);
    expect(result.details.bookings).toHaveLength(1);
  });

  it('returns all upcoming appointments', async () => {
    const result = await handleListMyUpcomingAppointmentsLogic(
      makeDeps(sampleBookings),
      'biz-1',
      { sessionCustomerId: 'cust-1', _timeZone: 'UTC' },
      'Show my upcoming appointments',
    );

    expect(result.success).toBe(true);
    expect(result.details.scope).toBe('all_upcoming');
    expect(result.details.upcomingCount).toBe(2);
  });

  it('requires sign-in', async () => {
    const result = await handleListMyUpcomingAppointmentsLogic(
      makeDeps(sampleBookings),
      'biz-1',
      {},
      "What's my next appointment?",
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });

  it('returns clarify for non-upcoming prompts', async () => {
    const result = await handleListMyUpcomingAppointmentsLogic(
      makeDeps(sampleBookings),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'List my appointments',
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });
});
