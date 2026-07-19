import {
  PROVIDER_TODAY_TIMELINE_DURATION_SCENARIOS,
  PROVIDER_TODAY_TIMELINE_NEXT_CLIENT_SCENARIOS,
  PROVIDER_TODAY_TIMELINE_NOW_MARKER_SCENARIOS,
  PROVIDER_TODAY_TIMELINE_SEGMENT_SCENARIOS,
  PROVIDER_TODAY_TIMELINE_VIEW_SCENARIOS,
} from './provider-booking-today-timeline.fixtures.js';
import {
  buildExplainTodayTimelineGapChips,
  buildExplainTodayTimelineSummary,
  buildProviderTodayTimelineSegments,
  buildProviderTodayTimelineView,
  computeProviderTodayNowMarkerPercent,
  formatProviderTimelineDurationMinutes,
  minutesBetween,
  providerMobileShowTodayTimeline,
  resolveProviderTodayActiveBookingId,
  resolveProviderTodayNextClient,
} from './provider-booking-today-timeline.util.js';

describe('provider-booking-today-timeline.util (prov-exp-3.3)', () => {
  it.each(PROVIDER_TODAY_TIMELINE_NOW_MARKER_SCENARIOS)(
    'computeProviderTodayNowMarkerPercent — $id',
    ({ rangeStartMs, rangeEndMs, nowMs, expected }) => {
      expect(
        computeProviderTodayNowMarkerPercent(rangeStartMs, rangeEndMs, nowMs),
      ).toBe(expected);
    },
  );

  it.each(PROVIDER_TODAY_TIMELINE_DURATION_SCENARIOS)(
    'formatProviderTimelineDurationMinutes — $id',
    ({ minutes, expected }) => {
      expect(formatProviderTimelineDurationMinutes(minutes)).toBe(expected);
    },
  );

  it.each(PROVIDER_TODAY_TIMELINE_SEGMENT_SCENARIOS)(
    'buildProviderTodayTimelineSegments — $id',
    ({ bookings, expectedKinds, gapMinutes }) => {
      const segments = buildProviderTodayTimelineSegments(bookings);
      expect(segments.map((segment) => segment.kind)).toEqual(expectedKinds);
      const gaps = segments.filter((segment) => segment.kind === 'gap');
      expect(gaps.map((gap) => gap.durationMinutes)).toEqual(gapMinutes);
    },
  );

  it.each(PROVIDER_TODAY_TIMELINE_NEXT_CLIENT_SCENARIOS)(
    'resolveProviderTodayNextClient — $id',
    ({ bookings, now, expectedBookingId, expectedMinutes }) => {
      const next = resolveProviderTodayNextClient(
        bookings,
        'UTC',
        new Date(now),
      );
      if (!expectedBookingId) {
        expect(next).toBeNull();
        return;
      }
      expect(next?.bookingId).toBe(expectedBookingId);
      expect(next?.minutesUntilStart).toBe(expectedMinutes);
    },
  );

  it.each(PROVIDER_TODAY_TIMELINE_VIEW_SCENARIOS)(
    'buildProviderTodayTimelineView — $id',
    ({
      enabled,
      bookings,
      now,
      expectEmpty,
      activeBookingId,
      nextBookingId,
    }) => {
      const view = buildProviderTodayTimelineView({
        enabled,
        date: '2026-06-09',
        bookings,
        now: now ? new Date(now) : undefined,
        timeZone: 'UTC',
      });
      if (expectEmpty) {
        expect(view.segments).toEqual([]);
        expect(view.rangeStart).toBeNull();
        return;
      }
      expect(view.segments.length).toBeGreaterThan(0);
      expect(view.activeBookingId).toBe(activeBookingId ?? null);
      expect(view.nextClient?.bookingId).toBe(nextBookingId ?? null);
    },
  );

  it('providerMobileShowTodayTimeline defaults to enabled', () => {
    expect(providerMobileShowTodayTimeline(undefined)).toBe(true);
    expect(
      providerMobileShowTodayTimeline({
        providerMobile: { showTodayTimeline: false },
      }),
    ).toBe(false);
  });

  it('resolveProviderTodayNextClient picks earliest upcoming booking', () => {
    const next = resolveProviderTodayNextClient(
      [
        {
          id: 'later',
          startTime: '2026-06-09T14:00:00.000Z',
          endTime: '2026-06-09T15:00:00.000Z',
          status: 'confirmed',
          customer: { name: 'Later' },
        },
        {
          id: 'sooner',
          startTime: '2026-06-09T12:00:00.000Z',
          endTime: '2026-06-09T13:00:00.000Z',
          status: 'confirmed',
          customer: { name: 'Sooner' },
        },
      ],
      'UTC',
      new Date('2026-06-09T10:00:00.000Z'),
    );
    expect(next?.bookingId).toBe('sooner');
  });

  it('excludes past wall-clock bookings in Asia/Yerevan', () => {
    const next = resolveProviderTodayNextClient(
      [
        {
          id: 'past',
          startTime: '2026-06-29T16:30:00.000Z',
          endTime: '2026-06-29T17:00:00.000Z',
          status: 'confirmed',
          customer: { name: 'Gevorg Gasparyan' },
        },
        {
          id: 'future',
          startTime: '2026-06-29T18:00:00.000Z',
          endTime: '2026-06-29T18:30:00.000Z',
          status: 'confirmed',
          customer: { name: 'Later Client' },
        },
      ],
      'Asia/Yerevan',
      new Date('2026-06-29T13:01:00.000Z'),
    );
    expect(next?.bookingId).toBe('future');
    expect(next?.minutesUntilStart).toBe(59);
  });

  it('resolveProviderTodayActiveBookingId returns null when between visits', () => {
    expect(
      resolveProviderTodayActiveBookingId(
        [
          {
            id: 'b1',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'confirmed',
          },
        ],
        'UTC',
        new Date('2026-06-09T11:30:00.000Z'),
      ),
    ).toBeNull();
  });

  it('buildProviderTodayTimelineSegments skips invalid booking times', () => {
    expect(
      buildProviderTodayTimelineSegments([
        {
          id: 'bad',
          startTime: 'invalid',
          endTime: '2026-06-09T11:00:00.000Z',
          status: 'confirmed',
        },
        {
          id: 'good',
          startTime: '2026-06-09T12:00:00.000Z',
          endTime: '2026-06-09T13:00:00.000Z',
          status: 'confirmed',
          customer: { name: 'Alex' },
        },
      ]),
    ).toHaveLength(1);
  });

  it('minutesBetween returns zero for non-positive ranges', () => {
    expect(minutesBetween(100, 50)).toBe(0);
  });

  it('computeProviderTodayNowMarkerPercent returns null for zero-length range', () => {
    expect(computeProviderTodayNowMarkerPercent(100, 100, 100)).toBeNull();
  });

  it('resolveProviderTodayActiveBookingId skips completed visits', () => {
    expect(
      resolveProviderTodayActiveBookingId(
        [
          {
            id: 'done',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'completed',
          },
        ],
        'UTC',
        new Date('2026-06-09T10:30:00.000Z'),
      ),
    ).toBeNull();
  });

  it('buildProviderTodayTimelineSegments skips invalid Date objects', () => {
    expect(
      buildProviderTodayTimelineSegments([
        {
          id: 'bad-date',
          startTime: new Date('invalid'),
          endTime: new Date('2026-06-09T11:00:00.000Z'),
          status: 'confirmed',
        },
      ]),
    ).toEqual([]);
  });

  it('buildProviderTodayTimelineView returns empty timeline when enabled but no bookings', () => {
    const view = buildProviderTodayTimelineView({
      enabled: true,
      date: '2026-06-09',
      bookings: [],
    });
    expect(view.segments).toEqual([]);
    expect(view.rangeStart).toBeNull();
  });

  describe('buildExplainTodayTimelineSummary (ai-cmd-provider-5.1.5)', () => {
    const formatTime = (iso: string) => new Date(iso).toISOString().slice(11, 16);

    it('returns an empty-day message with no bookings', () => {
      const view = buildProviderTodayTimelineView({
        enabled: true,
        date: '2026-06-09',
        bookings: [],
      });
      expect(buildExplainTodayTimelineSummary(view, formatTime)).toBe(
        'No appointments scheduled today.',
      );
    });

    it('narrates bookings and calls out a gap between clients', () => {
      const view = buildProviderTodayTimelineView({
        enabled: true,
        date: '2026-06-09',
        bookings: [
          {
            id: 'first',
            startTime: '2026-06-09T09:00:00.000Z',
            endTime: '2026-06-09T09:30:00.000Z',
            status: 'confirmed',
            customer: { name: 'Maria' },
          },
          {
            id: 'second',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'confirmed',
            customer: { name: 'John' },
          },
        ],
      });
      const summary = buildExplainTodayTimelineSummary(view, formatTime);
      expect(summary).toContain('2 appointments today');
      expect(summary).toContain('09:00–09:30 Maria');
      expect(summary).toContain('10:00–11:00 John');
      expect(summary).toContain('Gaps: 09:30–10:00 (30m)');
    });

    it('reports no gaps for a back-to-back day', () => {
      const view = buildProviderTodayTimelineView({
        enabled: true,
        date: '2026-06-09',
        bookings: [
          {
            id: 'first',
            startTime: '2026-06-09T09:00:00.000Z',
            endTime: '2026-06-09T09:30:00.000Z',
            status: 'confirmed',
            customer: { name: 'Maria' },
          },
        ],
      });
      expect(buildExplainTodayTimelineSummary(view, formatTime)).toContain(
        'No gaps — back-to-back day.',
      );
    });
  });

  describe('buildExplainTodayTimelineGapChips (ai-cmd-provider-5.1.5)', () => {
    it('extracts gap chips with formatted labels', () => {
      const formatTime = (iso: string) =>
        new Date(iso).toISOString().slice(11, 16);
      const view = buildProviderTodayTimelineView({
        enabled: true,
        date: '2026-06-09',
        bookings: [
          {
            id: 'first',
            startTime: '2026-06-09T09:00:00.000Z',
            endTime: '2026-06-09T09:30:00.000Z',
            status: 'confirmed',
            customer: { name: 'Maria' },
          },
          {
            id: 'second',
            startTime: '2026-06-09T10:00:00.000Z',
            endTime: '2026-06-09T11:00:00.000Z',
            status: 'confirmed',
            customer: { name: 'John' },
          },
        ],
      });
      const chips = buildExplainTodayTimelineGapChips(view, formatTime);
      expect(chips).toHaveLength(1);
      expect(chips[0].durationMinutes).toBe(30);
      expect(chips[0].label).toBe('09:30–10:00 (30m)');
    });
  });
});
