import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E288_CALENDAR_WEEK_POSITIVES,
  E2E288_UPCOMING_NEGATIVES,
} from './ai-e2e288-tour-calendar-next-last-week.fixtures.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';
import { isListUpcomingTourDeparturesPrompt } from './ai-upcoming-tour-departures.util.js';

function expectedWeekAnchor(relative: 'next' | 'last' | 'this'): string {
  const today = getTodayDateKey();
  if (relative === 'next') return addDaysToDateKey(today, 7);
  if (relative === 'last') return addDaysToDateKey(today, -7);
  return today;
}

describe('e2e-bug.288 tour calendar next/last week (not upcoming clarify)', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E288_CALENDAR_WEEK_POSITIVES.map((row) => [row.id, row] as const),
  )('detector $id → calendar week', (_id, row) => {
    expect(isListTourCalendarWeekPrompt(row.prompt)).toBe(
      row.expectCalendarWeek,
    );
    expect(isListUpcomingTourDeparturesPrompt(row.prompt)).toBe(
      row.expectUpcoming,
    );
  });

  it.each(
    E2E288_CALENDAR_WEEK_POSITIVES.map((row) => [row.id, row] as const),
  )('parse/rescue $id from upcoming misroute', (_id, row) => {
    const parsed = parseListTourCalendarWeekFromPrompt(row.prompt);
    expect(parsed).not.toBeNull();
    if (row.weekRelative) {
      expect(parsed?.weekStartDate).toBe(
        expectedWeekAnchor(row.weekRelative),
      );
    }
    expect(
      rescueListTourCalendarWeekIntent(
        row.prompt,
        'list_upcoming_tour_departures',
      ),
    ).toEqual({
      action: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
    });
  });

  it.each(
    E2E288_CALENDAR_WEEK_POSITIVES.map((row) => [row.id, row] as const),
  )('AiIntentRescueService $id → list_tour_calendar_week', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: 'list_upcoming_tour_departures',
      params: {},
      surface: 'dashboard',
    });
    expect(result?.action ?? 'list_upcoming_tour_departures').toBe(
      'list_tour_calendar_week',
    );
  });

  it.each(E2E288_UPCOMING_NEGATIVES.map((row) => [row.id, row] as const))(
    'negative $id keeps calendar=%s upcoming=%s',
    (_id, row) => {
      expect(isListTourCalendarWeekPrompt(row.prompt)).toBe(
        row.expectCalendarWeek,
      );
      expect(isListUpcomingTourDeparturesPrompt(row.prompt)).toBe(
        row.expectUpcoming,
      );
      if (!row.expectCalendarWeek) {
        expect(
          rescueListTourCalendarWeekIntent(
            row.prompt,
            'list_upcoming_tour_departures',
          ),
        ).toBeNull();
      }
    },
  );
});
