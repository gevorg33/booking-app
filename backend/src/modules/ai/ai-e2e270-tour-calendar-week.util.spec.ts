import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { normalizeTourWeekAnchorDateKey } from '../../common/utils/tour-calendar.util.js';
import {
  E2E270_CRASH_PROMPTS,
  E2E270_WEEK_START_GARBAGE,
} from './ai-e2e270-tour-calendar-week.fixtures.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
} from './ai-tour-calendar-week.util.js';

describe('e2e-bug.270 list_tour_calendar_week weekStartDate garbage', () => {
  it.each(E2E270_WEEK_START_GARBAGE.map((row) => [row.id, row] as const))(
    '%s — normalizeTourWeekAnchorDateKey never returns non-ISO',
    (_id, row) => {
      const normalized = normalizeTourWeekAnchorDateKey(row.weekStartDate);
      if (normalized != null) {
        expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    },
  );

  it.each(E2E270_WEEK_START_GARBAGE.map((row) => [row.id, row] as const))(
    '%s — parse drops/normalizes garbage weekStartDate without nulling scope',
    (_id, row) => {
      const prompt = 'What tour bookings do I have this week?';
      const parsed = parseListTourCalendarWeekFromPrompt(prompt, {
        weekStartDate: row.weekStartDate,
      });
      if (row.expectParse) {
        expect(parsed).not.toBeNull();
      }
      if (parsed?.weekStartDate != null) {
        expect(parsed.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Phrase garbage maps to today (not left as "this week").
        if (/\bweek\b/i.test(row.weekStartDate)) {
          expect(parsed.weekStartDate).toBe(getTodayDateKey());
        }
      }
    },
  );

  it.each(E2E270_CRASH_PROMPTS.map((row) => [row.id, row] as const))(
    '%s — crash-phrasing still recognized as calendar-week list',
    (_id, row) => {
      expect(isListTourCalendarWeekPrompt(row.prompt)).toBe(true);
      const parsed = parseListTourCalendarWeekFromPrompt(row.prompt, {
        // Simulate classifier stuffing the phrase into weekStartDate.
        weekStartDate: 'this week',
      });
      expect(parsed).not.toBeNull();
      expect(parsed?.weekStartDate).toBe(getTodayDateKey());
    },
  );

  it('keeps explicit ISO weekStartDate', () => {
    const parsed = parseListTourCalendarWeekFromPrompt(
      'Week of 2026-06-09 — tour departures on the provider calendar',
      { weekStartDate: '2026-06-09' },
    );
    expect(parsed?.weekStartDate).toBe('2026-06-09');
  });
});
