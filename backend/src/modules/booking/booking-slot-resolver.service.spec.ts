import { BookingSlotResolverService } from './booking-slot-resolver.service.js';

describe('BookingSlotResolverService.describeUnavailable', () => {
  const resolver = Object.create(
    BookingSlotResolverService.prototype,
  ) as BookingSlotResolverService;

  it('explains provider not assigned to service', () => {
    const msg = resolver.describeUnavailable(
      {
        employeeId: 'e1',
        employeeName: 'Gevorg Gasparyan',
        available: false,
        hasSchedule: false,
        openSlots: [],
        reason: 'provider_not_assigned',
      },
      'permanent lips',
      '13:00',
      '30_05_2026',
    );
    expect(msg).toMatch(/does not provide permanent lips/i);
  });

  it('explains slot unavailable', () => {
    const msg = resolver.describeUnavailable(
      {
        employeeId: 'e1',
        employeeName: 'Gevorg Gasparyan',
        available: false,
        hasSchedule: true,
        openSlots: [{ start: '09:00', end: '12:00' }],
        reason: 'slot_unavailable',
      },
      'full body massage',
      '13:00',
      '30_05_2026',
    );
    expect(msg).toMatch(/not free at 13:00/i);
  });

  // e2e-bug.343 — a malformed isoDay (e.g. "2026-19-08" from an upstream
  // DD/MM-vs-MM/DD misinterpretation) must degrade to a clear clarification
  // message, not a crash.
  it('explains invalid date', () => {
    const msg = resolver.describeUnavailable(
      {
        employeeId: 'e1',
        employeeName: 'Gevorg Gasparyan',
        available: false,
        hasSchedule: false,
        openSlots: [],
        reason: 'invalid_date',
      },
      'Deep tissue massage',
      '09:30',
      '2026-19-08',
    );
    expect(msg).toMatch(/could not understand the date/i);
    expect(msg).not.toMatch(/something went wrong/i);
  });
});

describe('BookingSlotResolverService.checkSlotAvailability — e2e-bug.343 invalid date guard', () => {
  const resolver = Object.create(
    BookingSlotResolverService.prototype,
  ) as BookingSlotResolverService;

  it('returns invalid_date immediately for a malformed pseudo-ISO isoDay, without touching any repo', async () => {
    const result = await resolver.checkSlotAvailability(
      'biz-1',
      'emp-1',
      'Gevorg Gasparyan',
      'svc-1',
      '2026-19-08',
      '09:30',
      'UTC',
    );
    expect(result).toEqual({
      employeeId: 'emp-1',
      employeeName: 'Gevorg Gasparyan',
      available: false,
      hasSchedule: false,
      openSlots: [],
      reason: 'invalid_date',
    });
  });

  it('returns invalid_date for a slash date with both segments > 12', async () => {
    const result = await resolver.checkSlotAvailability(
      'biz-1',
      'emp-1',
      'Gevorg Gasparyan',
      'svc-1',
      '13/14/2026',
      '09:30',
      'UTC',
    );
    expect(result.reason).toBe('invalid_date');
  });
});
