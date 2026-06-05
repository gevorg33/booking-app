import { describe, expect, it } from 'vitest';
import {
  assignTourSpanLanes,
  buildServiceColorMap,
  buildTourCalendarSpans,
  computeWeekColumnSpan,
  dateKeysOverlap,
  extractTourBookingMetadata,
  formatTourSpanLabel,
  isTourCalendarBooking,
  mergeServiceColorMaps,
  resolveTourBookingDateRange,
  tourSpanRowHeight,
} from './tour-calendar';

const week = [
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
  '2026-08-17',
];

describe('tour-calendar', () => {
  it('detects overlap and tour metadata', () => {
    expect(dateKeysOverlap('2026-08-10', '2026-08-12', '2026-08-11', '2026-08-17')).toBe(true);
    expect(dateKeysOverlap('2026-08-18', '2026-08-20', '2026-08-11', '2026-08-17')).toBe(false);
    expect(
      extractTourBookingMetadata({
        paxCount: 4,
        tourStartDate: '2026-08-15',
        tourEndDate: '2026-08-17',
        specialRequirements: 'Vegan meals',
      }),
    ).toEqual({
      paxCount: 4,
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-17',
      specialRequirements: 'Vegan meals',
    });
    expect(extractTourBookingMetadata({ paxCount: 0, tourStartDate: '2026-08-15' })).toEqual({
      tourStartDate: '2026-08-15',
    });
    expect(extractTourBookingMetadata(null)).toEqual({});
  });

  it('computes visible week columns for full and clipped spans', () => {
    expect(computeWeekColumnSpan('2026-08-15', '2026-08-17', week)).toEqual({
      colStart: 4,
      colEnd: 6,
    });
    expect(computeWeekColumnSpan('2026-08-10', '2026-08-12', week)).toEqual({
      colStart: 0,
      colEnd: 1,
    });
    expect(computeWeekColumnSpan('2026-08-20', '2026-08-22', week)).toBeNull();
  });

  it('builds stacked tour spans color-coded by service', () => {
    const bookings = [
      {
        id: 'b1',
        startTime: '2026-08-15T09:00:00.000Z',
        endTime: '2026-08-17T17:00:00.000Z',
        status: 'confirmed',
        serviceId: 'svc-trek',
        service: { id: 'svc-trek', name: 'Mountain Trek' },
        customer: { name: 'Anna' },
        metadata: {
          paxCount: 3,
          tourStartDate: '2026-08-15',
          tourEndDate: '2026-08-17',
        },
      },
      {
        id: 'b2',
        startTime: '2026-08-15T09:00:00.000Z',
        endTime: '2026-08-16T17:00:00.000Z',
        status: 'confirmed',
        serviceId: 'svc-hike',
        service: { id: 'svc-hike', name: 'Day Hike' },
        metadata: {
          paxCount: 2,
          tourStartDate: '2026-08-15',
          tourEndDate: '2026-08-16',
        },
      },
      {
        id: 'b3',
        startTime: '2026-08-12T10:00:00.000Z',
        endTime: '2026-08-12T18:00:00.000Z',
        status: 'confirmed',
        serviceId: 'svc-regular',
        service: { name: 'Haircut' },
        metadata: {},
      },
    ];

    expect(isTourCalendarBooking(bookings[0])).toBe(true);
    expect(isTourCalendarBooking(bookings[2])).toBe(false);
    expect(resolveTourBookingDateRange(bookings[0])).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-17',
    });

    const spans = buildTourCalendarSpans(bookings, week);
    expect(spans).toHaveLength(2);
    const trek = spans.find((span) => span.bookingId === 'b1');
    const hike = spans.find((span) => span.bookingId === 'b2');
    expect(trek).toMatchObject({ colStart: 4, colEnd: 6, lane: 1 });
    expect(hike).toMatchObject({ colStart: 4, colEnd: 5, lane: 0 });

    const colors = buildServiceColorMap(['svc-trek', 'svc-hike']);
    expect(colors['svc-trek']).toBeTruthy();
    expect(colors['svc-hike']).toBeTruthy();
    expect(colors['svc-trek']).not.toBe(colors['svc-hike']);

    const merged = mergeServiceColorMaps(
      buildServiceColorMap(['svc-a']),
      { 'svc-b': 'custom-color' },
    );
    expect(merged).toEqual({
      'svc-a': buildServiceColorMap(['svc-a'])['svc-a'],
      'svc-b': 'custom-color',
    });
  });

  it('assigns lanes for overlapping spans', () => {
    expect(
      assignTourSpanLanes([
        { colStart: 0, colEnd: 2 },
        { colStart: 1, colEnd: 3 },
        { colStart: 3, colEnd: 4 },
      ]),
    ).toEqual([0, 1, 0]);
  });

  it('formats labels and row height', () => {
    const t = (key: string, params?: Record<string, string | number>) =>
      key === 'calendarPage.tourSpanPax'
        ? `${params?.count ?? ''} pax`
        : key;

    expect(
      formatTourSpanLabel(
        { serviceName: 'Trek', paxCount: 5, customerName: 'Sam' },
        t,
      ),
    ).toBe('Trek · 5 pax · Sam');
    expect(
      formatTourSpanLabel(
        { serviceName: 'Trek', paxCount: null, customerName: null },
        t,
      ),
    ).toBe('Trek');
    expect(tourSpanRowHeight(0)).toBe(0);
    expect(tourSpanRowHeight(2)).toBe(64);
  });

  it('handles empty weeks, invalid columns, and service fallbacks', () => {
    expect(computeWeekColumnSpan('2026-08-15', '2026-08-17', [])).toBeNull();
    expect(computeWeekColumnSpan('2026-08-15', '2026-08-17', week)).not.toBeNull();
    expect(
      computeWeekColumnSpan('2026-08-12', '2026-08-12', ['2026-08-11', '2026-08-13']),
    ).toBeNull();

    expect(resolveTourBookingDateRange({
      id: 'x',
      startTime: '2026-08-15T09:00:00.000Z',
      endTime: '2026-08-15T17:00:00.000Z',
      status: 'confirmed',
      metadata: { tourStartDate: '2026-08-15' },
    })).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-15',
    });

    expect(
      assignTourSpanLanes([
        { colStart: 0, colEnd: 1 },
        { colStart: 2, colEnd: 3 },
      ]),
    ).toEqual([0, 0]);

    const spans = buildTourCalendarSpans(
      [
        {
          id: 'with-service-id',
          startTime: '2026-08-15T09:00:00.000Z',
          endTime: '2026-08-16T17:00:00.000Z',
          status: 'pending',
          serviceId: 'direct-service-id',
          service: { id: 'from-service', name: 'Direct Trek' },
          metadata: { tourStartDate: '2026-08-15', tourEndDate: '2026-08-16' },
        },
        {
          id: 'fallback-id',
          startTime: '2026-08-15T09:00:00.000Z',
          endTime: '2026-08-16T17:00:00.000Z',
          status: 'pending',
          service: { id: 'from-service', name: 'Service Trek' },
          metadata: { tourStartDate: '2026-08-15', tourEndDate: '2026-08-16' },
        },
        {
          id: 'booking-id-only',
          startTime: '2026-08-16T09:00:00.000Z',
          endTime: '2026-08-16T17:00:00.000Z',
          status: 'pending',
          metadata: { tourStartDate: '2026-08-16', tourEndDate: '2026-08-16' },
        },
        {
          id: 'outside-week',
          startTime: '2026-09-01T09:00:00.000Z',
          endTime: '2026-09-03T17:00:00.000Z',
          status: 'confirmed',
          serviceId: 'svc-x',
          metadata: { tourStartDate: '2026-09-01', tourEndDate: '2026-09-03' },
        },
      ],
      week,
    );
    expect(spans).toHaveLength(3);
    expect(spans.find((s) => s.bookingId === 'with-service-id')).toMatchObject({
      serviceId: 'direct-service-id',
      serviceName: 'Direct Trek',
    });
    expect(spans.find((s) => s.bookingId === 'fallback-id')).toMatchObject({
      serviceId: 'from-service',
      serviceName: 'Service Trek',
    });
    expect(spans.find((s) => s.bookingId === 'booking-id-only')).toMatchObject({
      serviceId: 'booking-id-only',
      serviceName: 'Tour',
      paxCount: null,
      specialRequirements: null,
    });
  });
});
