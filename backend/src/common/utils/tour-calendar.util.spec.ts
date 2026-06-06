import {
  dateKeysOverlap,
  resolveTourBookingDateRange,
  tourBookingOverlapsDateRange,
} from './tour-calendar.util';

describe('tour-calendar.util', () => {
  it('detects date key overlap', () => {
    expect(
      dateKeysOverlap('2026-08-10', '2026-08-12', '2026-08-11', '2026-08-17'),
    ).toBe(true);
    expect(
      dateKeysOverlap('2026-08-18', '2026-08-20', '2026-08-11', '2026-08-17'),
    ).toBe(false);
  });

  it('resolves tour booking date range from metadata', () => {
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: {
          tourStartDate: '2026-08-15',
          tourEndDate: '2026-08-17',
        },
      }),
    ).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-17',
    });
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: { tourStartDate: '2026-08-15' },
      }),
    ).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-15',
    });
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: {},
      }),
    ).toBeNull();
  });

  it('checks tour and standard booking overlap against calendar week', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-10T09:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-08-10',
            tourEndDate: '2026-08-12',
          },
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(true);

    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-12T10:00:00.000Z'),
          metadata: {},
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(true);

    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-20T10:00:00.000Z'),
          metadata: {},
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(false);
  });

  it('excludes tours that end the day before the week starts', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-06-07T08:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-06-07',
            tourEndDate: '2026-06-08',
          },
        },
        '2026-06-09',
        '2026-06-15',
      ),
    ).toBe(false);
  });

  it('includes tours that start the day after the week ends when metadata spans backward', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-06-16T08:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-06-14',
            tourEndDate: '2026-06-16',
          },
        },
        '2026-06-09',
        '2026-06-15',
      ),
    ).toBe(true);
  });
});
