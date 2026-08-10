import { buildPackageVisitLinesFromTarget } from './ai-package-visit-lines.util.js';

describe('ai-package-visit-lines.util', () => {
  function buildDeps() {
    return {
      serviceRepo: {
        find: jest.fn(async () => [
          { id: 'svc-1', durationMinutes: 60, bufferMinutes: 0 },
          { id: 'svc-2', durationMinutes: 30, bufferMinutes: 0 },
        ]),
      },
      businessRepo: {
        findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
      },
      multiServiceBookingsService: {
        resolveSettingsFromBusiness: jest.fn(() => ({
          maxServiceCount: 5,
          turnoverBufferMinutes: 5,
          schedulingMode: 'same_visit',
        })),
      },
    } as any;
  }

  it('builds sequential lines preserving original order and provider', async () => {
    const deps = buildDeps();
    const lines = await buildPackageVisitLinesFromTarget(
      deps,
      'biz-1',
      [
        {
          bookingId: 'book-2',
          serviceId: 'svc-2',
          employeeId: 'emp-1',
          startTime: '2026-07-03T11:00:00.000Z',
        },
        {
          bookingId: 'book-1',
          serviceId: 'svc-1',
          employeeId: 'emp-1',
          startTime: '2026-07-03T10:00:00.000Z',
        },
      ],
      '2026-07-10T09:00:00.000Z',
    );

    expect(lines).toEqual([
      {
        bookingId: 'book-1',
        startTime: '2026-07-10T09:00:00.000Z',
        employeeId: 'emp-1',
      },
      {
        bookingId: 'book-2',
        startTime: '2026-07-10T10:05:00.000Z',
        employeeId: 'emp-1',
      },
    ]);
  });

  it('returns an empty array for an empty visit', async () => {
    const deps = buildDeps();
    const lines = await buildPackageVisitLinesFromTarget(
      deps,
      'biz-1',
      [],
      '2026-07-10T09:00:00.000Z',
    );
    expect(lines).toEqual([]);
  });

  it('falls back to default duration when the service is missing', async () => {
    const deps = buildDeps();
    deps.serviceRepo.find = jest.fn(async () => []);
    const lines = await buildPackageVisitLinesFromTarget(
      deps,
      'biz-1',
      [
        {
          bookingId: 'book-1',
          serviceId: 'unknown-svc',
          employeeId: 'emp-1',
          startTime: '2026-07-03T10:00:00.000Z',
        },
      ],
      '2026-07-10T09:00:00.000Z',
    );
    expect(lines).toEqual([
      {
        bookingId: 'book-1',
        startTime: '2026-07-10T09:00:00.000Z',
        employeeId: 'emp-1',
      },
    ]);
  });
});
