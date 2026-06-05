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
});
