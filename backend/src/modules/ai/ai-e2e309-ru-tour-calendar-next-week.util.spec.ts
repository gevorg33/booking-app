import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';
import {
  E2E309_RESCUE_CASES,
  E2E309_RU_CALENDAR_WEEK_POSITIVES,
  E2E309_UPCOMING_NEGATIVES,
} from './ai-e2e309-ru-tour-calendar-next-week.fixtures.js';

function expectedWeekStart(relative: 'next' | 'last' | 'this'): string {
  const today = getTodayDateKey('UTC');
  if (relative === 'next') return addDaysToDateKey(today, 7, 'UTC');
  if (relative === 'last') return addDaysToDateKey(today, -7, 'UTC');
  return today;
}

describe('e2e-bug.309 RU next/last week tour calendar list', () => {
  it.each(
    E2E309_RU_CALENDAR_WEEK_POSITIVES.map((row) => [row.id, row] as const),
  )('%s — detects list_tour_calendar_week', (_id, row) => {
    expect(isListTourCalendarWeekPrompt(row.prompt)).toBe(true);
    const parsed = parseListTourCalendarWeekFromPrompt(row.prompt);
    expect(parsed).toBeTruthy();
    if (row.weekRelative) {
      expect(parsed?.weekStartDate).toBe(expectedWeekStart(row.weekRelative));
    }
    expect(
      rescueListTourCalendarWeekIntent(
        row.prompt,
        'list_upcoming_tour_departures',
      )?.action,
    ).toBe('list_tour_calendar_week');
  });

  it.each(E2E309_UPCOMING_NEGATIVES.map((row) => [row.id, row] as const))(
    '%s — not calendar-week',
    (_id, row) => {
      expect(isListTourCalendarWeekPrompt(row.prompt)).toBe(false);
    },
  );

  describe('rescue from upcoming-departures', () => {
    const rescue = new AiIntentRescueService();

    it.each(E2E309_RESCUE_CASES.map((row) => [row.id, row] as const))(
      '%s',
      (_id, row) => {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: row.fromAction,
          params: {},
          surface: 'dashboard',
        });
        expect(result.action).toBe(row.expectedAction);
        expect(result.action).not.toBe('list_upcoming_tour_departures');
      },
    );
  });

  it('documents scenario ids', () => {
    expect(E2E309_RU_CALENDAR_WEEK_POSITIVES.map((c) => c.id)).toEqual([
      'ai-e2e309-ru-next-week-calendar',
      'ai-e2e309-ru-next-week-short',
      'ai-e2e309-ru-next-week-provider-calendar',
      'ai-e2e309-ru-next-calendar-week-word',
      'ai-e2e309-en-provider-next-no-employee',
      'ai-e2e309-ru-last-week-calendar',
      'ai-e2e309-ru-last-week-question',
      'ai-e2e309-ru-this-week-still-ok',
      'ai-e2e309-ru-this-week-pax',
      'ai-e2e309-ru-excursions-next-week',
    ]);
  });

  it('EN provider next week does not treat "next week" as employeeName', () => {
    const parsed = parseListTourCalendarWeekFromPrompt(
      'Show tours for next week on the provider calendar',
    );
    expect(parsed?.employeeName).toBeUndefined();
    expect(parsed?.weekStartDate).toBe(expectedWeekStart('next'));
  });
});
