import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';
import {
  E2E310_CLASSIFIER_OVERRIDE_CASES,
  E2E310_HY_LAST_WEEK_POSITIVES,
} from './ai-e2e310-hy-tour-calendar-last-week.fixtures.js';

function expectedWeekStart(relative: 'next' | 'last' | 'this'): string {
  const today = getTodayDateKey('UTC');
  if (relative === 'next') return addDaysToDateKey(today, 7, 'UTC');
  if (relative === 'last') return addDaysToDateKey(today, -7, 'UTC');
  return today;
}

describe('e2e-bug.310 HY last-week tour calendar anchors', () => {
  it.each(
    E2E310_HY_LAST_WEEK_POSITIVES.map((row) => [row.id, row] as const),
  )('%s — detects week list + relative weekStartDate', (_id, row) => {
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

  it.each(
    E2E310_CLASSIFIER_OVERRIDE_CASES.map((row) => [row.id, row] as const),
  )('%s — prompt last week wins over classifier params', (_id, row) => {
    const parsed = parseListTourCalendarWeekFromPrompt(
      row.prompt,
      row.params,
    );
    expect(parsed?.weekStartDate).toBe(expectedWeekStart(row.weekRelative));
  });

  it('documents scenario ids', () => {
    expect(E2E310_HY_LAST_WEEK_POSITIVES.map((c) => c.id)).toEqual([
      'ai-e2e310-hy-ancac-shabatva-canonical',
      'ai-e2e310-hy-ancac-show',
      'ai-e2e310-hy-ancac-lowercase',
      'ai-e2e310-hy-nakhord-shabatva',
      'ai-e2e310-hy-nakhord-show-tours',
      'ai-e2e310-hy-ancyal-shabatva',
      'ai-e2e310-hy-verjin-shabatva',
      'ai-e2e310-hy-next-control',
      'ai-e2e310-hy-this-control',
      'ai-e2e310-en-last-regression',
      'ai-e2e310-ru-last-regression',
    ]);
  });
});
