import { describe, expect, it } from 'vitest';
import {
  computeSegmentWidthPercent,
  formatProviderTimelineDurationMinutes,
  formatProviderTimelineNextClientLabel,
  shouldShowProviderTodayTimeline,
} from './provider-booking-today-timeline';

describe('provider-booking-today-timeline (prov-exp-3.3)', () => {
  const t = (key: string, params?: Record<string, string | number>) => {
    if (key === 'provider.todayTimelineNextMinutes') {
      return `Next in ${params?.minutes}m — ${params?.name}`;
    }
    if (key === 'provider.todayTimelineNextNow') {
      return `Next now — ${params?.name}`;
    }
    if (key === 'provider.todayTimelineUnknownClient') {
      return 'Client';
    }
    return key;
  };

  it('formats duration labels', () => {
    expect(formatProviderTimelineDurationMinutes(45)).toBe('45m');
    expect(formatProviderTimelineDurationMinutes(120)).toBe('2h');
  });

  it('formats next client countdown', () => {
    expect(
      formatProviderTimelineNextClientLabel(
        {
          bookingId: 'b1',
          startTime: '2026-06-09T12:00:00.000Z',
          customerName: 'Jane',
          minutesUntilStart: 23,
        },
        t,
      ),
    ).toBe('Next in 23m — Jane');
  });

  it('computes segment width percent', () => {
    expect(
      computeSegmentWidthPercent(
        '2026-06-09T10:00:00.000Z',
        '2026-06-09T11:00:00.000Z',
        '2026-06-09T10:00:00.000Z',
        '2026-06-09T12:00:00.000Z',
      ),
    ).toBe(50);
  });

  it('shows timeline only when enabled with bookings', () => {
    expect(
      shouldShowProviderTodayTimeline({
        enabled: true,
        date: '2026-06-09',
        rangeStart: '2026-06-09T10:00:00.000Z',
        rangeEnd: '2026-06-09T12:00:00.000Z',
        nowMarkerPercent: 25,
        nextClient: null,
        activeBookingId: null,
        segments: [
          {
            kind: 'booking',
            bookingId: 'b1',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            customerName: 'Jane',
            status: 'confirmed',
          },
        ],
      }),
    ).toBe(true);
    expect(shouldShowProviderTodayTimeline({ enabled: false, date: '2026-06-09', rangeStart: null, rangeEnd: null, segments: [], nowMarkerPercent: null, nextClient: null, activeBookingId: null })).toBe(false);
  });
});
