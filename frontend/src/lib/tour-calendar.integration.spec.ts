import { describe, expect, it } from 'vitest';
import {
  buildTourCalendarSpans,
  computeWeekColumnSpan,
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

function tourBooking(
  id: string,
  serviceId: string,
  name: string,
  tourStartDate: string,
  tourEndDate: string,
  paxCount: number,
): CalendarWeekBooking {
  return {
    id,
    startTime: `${tourStartDate}T08:00:00.000Z`,
    endTime: `${tourEndDate}T18:00:00.000Z`,
    status: 'confirmed',
    serviceId,
    service: { id: serviceId, name },
    customer: { name: `Guest ${id}` },
    metadata: { paxCount, tourStartDate, tourEndDate },
  };
}

describe('Sprint 30 — vert-tour-1.10 calendar span matrix', () => {
  it('renders 3-day trek across Wed–Fri columns', () => {
    const spans = buildTourCalendarSpans(
      [tourBooking('t1', 'trek', '3-Day Trek', '2026-06-11', '2026-06-13', 4)],
      weekKeys,
    );
    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({
      colStart: 2,
      colEnd: 4,
      serviceId: 'trek',
      paxCount: 4,
    });
  });

  it('clips a 7-day tour to the visible week', () => {
    const placement = computeWeekColumnSpan(
      '2026-06-08',
      '2026-06-16',
      weekKeys,
    );
    expect(placement).toEqual({ colStart: 0, colEnd: 6 });

    const spans = buildTourCalendarSpans(
      [tourBooking('t2', 'epic', 'Epic Trek', '2026-06-08', '2026-06-16', 6)],
      weekKeys,
    );
    expect(spans[0].colStart).toBe(0);
    expect(spans[0].colEnd).toBe(6);
  });

  it('stacks two tours departing the same day on separate lanes', () => {
    const spans = buildTourCalendarSpans(
      [
        tourBooking('t3', 'a', 'Tour A', '2026-06-10', '2026-06-11', 2),
        tourBooking('t4', 'b', 'Tour B', '2026-06-10', '2026-06-12', 3),
      ],
      weekKeys,
    );
    expect(spans.map((s) => s.lane)).toEqual([0, 1]);
    expect(spans.map((s) => s.serviceId)).toEqual(['a', 'b']);
  });

  it('ignores standard appointments without tour metadata', () => {
    const spans = buildTourCalendarSpans(
      [
        {
          id: 'appt-1',
          startTime: '2026-06-10T10:00:00.000Z',
          endTime: '2026-06-10T11:00:00.000Z',
          status: 'confirmed',
          serviceId: 'hair',
          service: { name: 'Haircut' },
          metadata: { packageName: 'Gold' },
        },
      ],
      weekKeys,
    );
    expect(spans).toHaveLength(0);
  });

  it('shows single-day tour as one-column span', () => {
    const spans = buildTourCalendarSpans(
      [tourBooking('t5', 'day', 'Day Hike', '2026-06-12', '2026-06-12', 1)],
      weekKeys,
    );
    expect(spans[0].colStart).toBe(3);
    expect(spans[0].colEnd).toBe(3);
  });

  it('clips tour that starts before the week to Monday column', () => {
    const spans = buildTourCalendarSpans(
      [tourBooking('t6', 'early', 'Early Trek', '2026-06-07', '2026-06-10', 5)],
      weekKeys,
    );
    expect(spans[0]).toMatchObject({ colStart: 0, colEnd: 1 });
  });

  it('clips tour that ends after the week to Sunday column', () => {
    const spans = buildTourCalendarSpans(
      [tourBooking('t7', 'late', 'Late Trek', '2026-06-14', '2026-06-18', 3)],
      weekKeys,
    );
    expect(spans[0]).toMatchObject({ colStart: 5, colEnd: 6 });
  });

  it('returns empty spans for tours completely outside the week', () => {
    expect(
      buildTourCalendarSpans(
        [tourBooking('t8', 'away', 'Away Trek', '2026-06-20', '2026-06-22', 2)],
        weekKeys,
      ),
    ).toHaveLength(0);
  });

  it('carries special requirements through to span detail payload', () => {
    const spans = buildTourCalendarSpans(
      [
        {
          ...tourBooking('t9', 'req', 'Custom Trek', '2026-06-10', '2026-06-11', 2),
          metadata: {
            paxCount: 2,
            tourStartDate: '2026-06-10',
            tourEndDate: '2026-06-11',
            specialRequirements: 'Wheelchair access',
          },
        },
      ],
      weekKeys,
    );
    expect(spans[0].specialRequirements).toBe('Wheelchair access');
  });
});
