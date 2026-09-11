import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleExplainTourCalendarSpanLogic,
  resolveExplainTourCalendarSpanLocale,
} from './ai-tour-calendar-span.logic.js';
import {
  E2E336_LOCALE_CASES,
  E2E336_SLASH_DATE_RE,
} from './ai-e2e336-tour-calendar-span-slash-date.fixtures.js';

describe('e2e-bug.336: explain_tour_calendar_span avoids DD/MM slash dates', () => {
  const bookingService = { findAll: jest.fn(async () => []) };

  it.each(E2E336_LOCALE_CASES.map((row) => [row.id, row] as const))(
    '%s',
    async (_id, scenario) => {
      const result = await handleExplainTourCalendarSpanLogic(
        { bookingService },
        'biz-tour',
        { weekStartDate: '2026-06-08', aspect: 'multiDaySpan' },
        scenario.prompt,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain(scenario.expectContains);
      expect(result.summary).not.toContain(scenario.forbidSlash);
      expect(result.summary).not.toMatch(E2E336_SLASH_DATE_RE);
    },
  );

  it('reproduces the exact reported ticket scenario (RU multi-day span, empty week)', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      { weekStartDate: '2026-07-27', aspect: 'multiDaySpan' },
      'Почему тур отображается на несколько дней на календаре провайдера',
    );
    expect(result.success).toBe(true);
    expect(result.summary).not.toMatch(E2E336_SLASH_DATE_RE);
    expect(result.summary).toContain('27 июля 2026');
    expect(result.summary).toContain('2 августа 2026');
  });

  it('clippedWeek aspect also avoids slash dates (span-range label)', async () => {
    const clippedBooking = {
      id: 'bk-clip-1',
      businessId: 'biz-tour',
      serviceId: 'svc-clip',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-06T08:00:00.000Z'),
      endTime: new Date('2026-06-10T18:00:00.000Z'),
      metadata: {
        paxCount: 2,
        tourStartDate: '2026-06-06',
        tourEndDate: '2026-06-10',
      },
      service: {
        id: 'svc-clip',
        name: 'Clipped Tour',
        metadata: { serviceType: 'tour' },
      },
      customer: { name: 'Jane Doe' },
    };
    const clippedBookingService = {
      findAll: jest.fn(async () => [clippedBooking]),
    };
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService: clippedBookingService },
      'biz-tour',
      { weekStartDate: '2026-06-08', aspect: 'clippedWeek' },
      'How are tours clipped at the week boundary?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('6 June 2026');
    expect(result.summary).not.toMatch(E2E336_SLASH_DATE_RE);
  });

  it('resolveExplainTourCalendarSpanLocale prefers prompt script over params.locale', () => {
    expect(
      resolveExplainTourCalendarSpanLocale({ locale: 'en' }, 'Почему тур?'),
    ).toBe('ru');
    expect(resolveExplainTourCalendarSpanLocale({ locale: 'en' }, 'Why?')).toBe(
      'en',
    );
  });
});
