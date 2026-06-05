import { describe, expect, it } from 'vitest';
import {
  TOUR_SERVICE_COLORS,
  buildServiceColorMap,
  buildTourCalendarSpans,
  formatTourSpanLabel,
  mergeServiceColorMaps,
  tourSpanRowHeight,
  type CalendarWeekBooking,
} from './tour-calendar';

const weekKeys = [
  '2026-06-09',
  '2026-06-10',
  '2026-06-11',
  '2026-06-12',
  '2026-06-13',
  '2026-06-14',
  '2026-06-15',
];

/** Simulates GET /bookings?startDate&endDate rows returned to the calendar page. */
function apiBooking(input: {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName?: string;
  tourStartDate: string;
  tourEndDate: string;
  paxCount?: number;
  specialRequirements?: string;
  status?: string;
}): CalendarWeekBooking {
  return {
    id: input.id,
    startTime: `${input.tourStartDate}T08:00:00.000Z`,
    endTime: `${input.tourEndDate}T18:00:00.000Z`,
    status: input.status ?? 'confirmed',
    serviceId: input.serviceId,
    service: { id: input.serviceId, name: input.serviceName },
    customer: input.customerName ? { name: input.customerName } : null,
    metadata: {
      paxCount: input.paxCount,
      tourStartDate: input.tourStartDate,
      tourEndDate: input.tourEndDate,
      specialRequirements: input.specialRequirements,
    },
  };
}

const t = (key: string, params?: Record<string, string | number>) => {
  if (key === 'calendarPage.tourSpanPax') return `${params?.count ?? ''} pax`;
  return key;
};

describe('Sprint 30 — vert-tour-1.10 end-to-end calendar pipeline', () => {
  it('maps API week bookings to clipped spans, colors, labels, and row height', () => {
    const apiRows: CalendarWeekBooking[] = [
      apiBooking({
        id: 'pre-week',
        serviceId: 'epic',
        serviceName: 'Epic Trek',
        customerName: 'Marta',
        tourStartDate: '2026-06-08',
        tourEndDate: '2026-06-16',
        paxCount: 6,
        specialRequirements: 'Gluten-free',
      }),
      apiBooking({
        id: 'mid-week',
        serviceId: 'trek',
        serviceName: '3-Day Trek',
        customerName: 'Leo',
        tourStartDate: '2026-06-11',
        tourEndDate: '2026-06-13',
        paxCount: 4,
      }),
      apiBooking({
        id: 'post-week',
        serviceId: 'coast',
        serviceName: 'Coastal Walk',
        tourStartDate: '2026-06-14',
        tourEndDate: '2026-06-18',
        paxCount: 2,
      }),
      {
        id: 'haircut',
        startTime: '2026-06-10T10:00:00.000Z',
        endTime: '2026-06-10T11:00:00.000Z',
        status: 'confirmed',
        serviceId: 'hair',
        service: { name: 'Haircut' },
        metadata: {},
      },
    ];

    const spans = buildTourCalendarSpans(apiRows, weekKeys);
    expect(spans).toHaveLength(3);

    const epic = spans.find((s) => s.bookingId === 'pre-week')!;
    expect(epic).toMatchObject({
      colStart: 0,
      colEnd: 6,
      serviceId: 'epic',
      specialRequirements: 'Gluten-free',
    });
    expect(formatTourSpanLabel(epic, t)).toBe('Epic Trek · 6 pax · Marta');

    const trek = spans.find((s) => s.bookingId === 'mid-week')!;
    expect(trek).toMatchObject({ colStart: 2, colEnd: 4, paxCount: 4 });

    const coast = spans.find((s) => s.bookingId === 'post-week')!;
    expect(coast).toMatchObject({ colStart: 5, colEnd: 6 });

    const slotColors = buildServiceColorMap(['slot-a', 'slot-b']);
    const tourColors = buildServiceColorMap(['epic', 'trek', 'coast']);
    const merged = mergeServiceColorMaps(slotColors, tourColors);
    expect(Object.keys(merged)).toHaveLength(5);
    expect(merged.epic).not.toBe(merged.trek);
    expect(tourSpanRowHeight(Math.max(...spans.map((s) => s.lane)) + 1)).toBeGreaterThan(0);
  });

  it('assigns three lanes when three tours overlap the same departure window', () => {
    const spans = buildTourCalendarSpans(
      [
        apiBooking({
          id: 'a',
          serviceId: 'a',
          serviceName: 'Tour A',
          tourStartDate: '2026-06-10',
          tourEndDate: '2026-06-12',
          paxCount: 2,
        }),
        apiBooking({
          id: 'b',
          serviceId: 'b',
          serviceName: 'Tour B',
          tourStartDate: '2026-06-10',
          tourEndDate: '2026-06-11',
          paxCount: 3,
        }),
        apiBooking({
          id: 'c',
          serviceId: 'c',
          serviceName: 'Tour C',
          tourStartDate: '2026-06-10',
          tourEndDate: '2026-06-13',
          paxCount: 1,
        }),
      ],
      weekKeys,
    );

    expect(spans).toHaveLength(3);
    expect(new Set(spans.map((s) => s.lane)).size).toBe(3);
    expect(tourSpanRowHeight(3)).toBe(92);
  });

  it('returns no spans when every booking is outside the visible week', () => {
    const spans = buildTourCalendarSpans(
      [
        apiBooking({
          id: 'future',
          serviceId: 'x',
          serviceName: 'Future Trek',
          tourStartDate: '2026-06-20',
          tourEndDate: '2026-06-22',
        }),
      ],
      weekKeys,
    );
    expect(spans).toHaveLength(0);
    expect(tourSpanRowHeight(0)).toBe(0);
  });

  it('cycles service colors beyond the palette length', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `svc-${i}`);
    const colors = buildServiceColorMap(ids);
    expect(colors['svc-0']).toBe(TOUR_SERVICE_COLORS[0]);
    expect(colors['svc-10']).toBe(TOUR_SERVICE_COLORS[0]);
    expect(colors['svc-11']).toBe(TOUR_SERVICE_COLORS[1]);
  });

  it('preserves cancelled tour status on spans for calendar detail modal', () => {
    const spans = buildTourCalendarSpans(
      [
        apiBooking({
          id: 'cancelled',
          serviceId: 'trek',
          serviceName: 'Mountain Trek',
          tourStartDate: '2026-06-10',
          tourEndDate: '2026-06-12',
          status: 'cancelled',
        }),
      ],
      weekKeys,
    );
    expect(spans[0].status).toBe('cancelled');
  });
});
