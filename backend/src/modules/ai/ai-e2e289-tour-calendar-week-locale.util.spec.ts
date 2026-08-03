import {
  E2E289_EMPTY_LOCALE_CASES,
  E2E289_ENGLISH_EMPTY_CUES,
  E2E289_SKIP_ENRICH_ACTION,
} from './ai-e2e289-tour-calendar-week-locale.fixtures.js';
import {
  buildTourCalendarWeekSummary,
  handleListTourCalendarWeekLogic,
  resolveTourCalendarWeekLocale,
} from './ai-tour-calendar-week.logic.js';
import { isAiDateGroundedBookingAction } from './ai-date-label.util.js';
import { CommandReasoningService } from './command-reasoning.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('e2e-bug.289 tour calendar week locale summaries', () => {
  const emptyDeps = {
    bookingService: { findAll: jest.fn(async () => []) },
    serviceService: { findAll: jest.fn(async () => []) },
    employeeService: { findAll: jest.fn(async () => []) },
  };

  it.each(E2E289_EMPTY_LOCALE_CASES.map((row) => [row.id, row] as const))(
    'resolveTourCalendarWeekLocale for $id',
    (_id, row) => {
      expect(
        resolveTourCalendarWeekLocale(
          row.locale ? { locale: row.locale } : {},
          row.prompt,
        ),
      ).toBe(row.expectLocale);
    },
  );

  it.each(E2E289_EMPTY_LOCALE_CASES.map((row) => [row.id, row] as const))(
    'empty summary locale for $id',
    async (_id, row) => {
      const result = await handleListTourCalendarWeekLogic(
        emptyDeps,
        'biz-tour',
        {
          weekStartDate: '2026-08-03',
          ...(row.locale ? { locale: row.locale } : {}),
        },
        row.prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_tour_calendar_week');
      expect(result.details?.locale).toBe(row.expectLocale);
      expect(result.summary).toMatch(row.expectSummaryMatch);
      if (row.forbidEnglishEmpty && row.expectLocale !== 'en') {
        for (const cue of E2E289_ENGLISH_EMPTY_CUES) {
          expect(result.summary).not.toContain(cue);
        }
      }
      if (row.forbidSlashDdMm) {
        expect(result.summary).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
      }
    },
  );

  it('success summary uses Armenian when prompt is HY', async () => {
    const booking = {
      id: 'bk-1',
      serviceId: 'svc-1',
      employeeId: 'emp-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-08-05T08:00:00.000Z'),
      endTime: new Date('2026-08-05T18:00:00.000Z'),
      metadata: {
        paxCount: 3,
        tourStartDate: '2026-08-05',
        tourEndDate: '2026-08-05',
      },
      service: {
        id: 'svc-1',
        name: 'City Tour',
        metadata: { serviceType: 'tour' },
      },
      employee: { id: 'emp-1', name: 'Maria' },
      customer: { name: 'Anna' },
    };
    const deps = {
      bookingService: { findAll: jest.fn(async () => [booking]) },
      serviceService: {
        findAll: jest.fn(async () => [booking.service]),
      },
      employeeService: { findAll: jest.fn(async () => [booking.employee]) },
    };
    const result = await handleListTourCalendarWeekLogic(
      deps,
      'biz-tour',
      { weekStartDate: '2026-08-03' },
      'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/էքսկուրսիայի մեկնարկ/u);
    expect(result.summary).toMatch(/City Tour/);
    expect(result.summary).toMatch(/ուղևոր/u);
    expect(result.summary).not.toMatch(/tour departure/i);
    expect(result.summary).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('buildTourCalendarWeekSummary empty EN uses month-name week labels', () => {
    const summary = buildTourCalendarWeekSummary({
      parsed: { weekStartDate: '2026-07-27' },
      weekStart: '2026-07-27',
      weekEnd: '2026-08-02',
      entries: [],
      employeeLabel: null,
      locale: 'en',
    });
    expect(summary).toMatch(/27 July 2026/);
    expect(summary).toMatch(/2 August 2026/);
    expect(summary).not.toMatch(/27\/07\/2026/);
    expect(summary).not.toMatch(/02\/08\/2026/);
  });

  it('isAiDateGroundedBookingAction covers list_tour_calendar_week', () => {
    expect(isAiDateGroundedBookingAction(E2E289_SKIP_ENRICH_ACTION)).toBe(
      true,
    );
  });

  it('CommandReasoningService skips enrich for list_tour_calendar_week', async () => {
    const openAi = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        summary:
          'There are no confirmed tour departures visible on the calendar for this week.',
        reasoning: 'rewrote to English',
      })),
    };
    const service = new CommandReasoningService(openAi as any);
    const grounded =
      'Տրամադրողի օրացույցում 27 July 2026–2 August 2026 շաբաթվա համար հաստատված էքսկուրսիայի մեկնարկներ չկան։';
    const result = await service.enrichResult(
      'biz-1',
      'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
      {
        success: true,
        action: 'list_tour_calendar_week',
        summary: grounded,
        details: { locale: 'hy' },
      },
    );
    expect(result.summary).toBe(grounded);
    expect(result.summary).not.toMatch(/There are no confirmed/i);
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });
});
