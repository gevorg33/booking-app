import {
  buildProviderRecentCompletedVisits,
  PROVIDER_RECENT_VISIT_LIMIT,
} from './provider-booking-visit-history.util.js';

describe('provider-booking-visit-history.util (prov-exp-1.2)', () => {
  it('maps completed bookings to visit strip rows', () => {
    const visits = buildProviderRecentCompletedVisits([
      {
        id: 'bk-3',
        endTime: new Date('2026-05-01T14:00:00.000Z'),
        service: { name: 'Color' },
        employee: { name: 'Sam' },
      },
      {
        id: 'bk-2',
        endTime: new Date('2026-04-01T10:00:00.000Z'),
        service: { name: '  ' },
        employee: { name: '' },
      },
    ]);

    expect(visits).toEqual([
      {
        bookingId: 'bk-3',
        serviceName: 'Color',
        providerName: 'Sam',
        completedAt: '2026-05-01T14:00:00.000Z',
      },
      {
        bookingId: 'bk-2',
        serviceName: 'Service',
        providerName: 'Provider',
        completedAt: '2026-04-01T10:00:00.000Z',
      },
    ]);
  });

  it('limits to three visits by default', () => {
    const visits = buildProviderRecentCompletedVisits(
      Array.from({ length: 5 }, (_, index) => ({
        id: `bk-${index}`,
        endTime: new Date(`2026-0${index + 1}-01T10:00:00.000Z`),
        service: { name: `Service ${index}` },
        employee: { name: `Provider ${index}` },
      })),
    );

    expect(visits).toHaveLength(PROVIDER_RECENT_VISIT_LIMIT);
    expect(visits[0]?.bookingId).toBe('bk-0');
    expect(visits[2]?.bookingId).toBe('bk-2');
  });
});
