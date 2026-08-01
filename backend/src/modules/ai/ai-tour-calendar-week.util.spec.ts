import { LIST_TOUR_CALENDAR_WEEK_PROMPTS } from './ai-tour-calendar-week.fixtures.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';

describe('ai-tour-calendar-week.util (ai-cmd-tour-12)', () => {
  it.each(LIST_TOUR_CALENDAR_WEEK_PROMPTS)(
    'recognizes calendar week list prompt $id',
    ({ prompt }) => {
      expect(isListTourCalendarWeekPrompt(prompt)).toBe(true);
      expect(parseListTourCalendarWeekFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(LIST_TOUR_CALENDAR_WEEK_PROMPTS)(
    'rescues unknown action to list_tour_calendar_week for $id',
    ({ prompt }) => {
      expect(rescueListTourCalendarWeekIntent(prompt, 'unknown')).toEqual({
        action: 'list_tour_calendar_week',
        rescueReason: 'list_tour_calendar_week',
      });
    },
  );

  it('does not steal upcoming departures with capacity', () => {
    const prompt =
      'List upcoming tour departures with pax and remaining capacity';
    expect(isListTourCalendarWeekPrompt(prompt)).toBe(false);
  });

  it('does not steal calendar span explain prompts', () => {
    const prompt =
      'Why do tours appear across multiple days on the provider calendar?';
    expect(isListTourCalendarWeekPrompt(prompt)).toBe(false);
  });

  it('parses employee and service filters', () => {
    expect(
      parseListTourCalendarWeekFromPrompt(
        "Summarize tours visible on Maria's calendar this week with dates and pax",
      ),
    ).toMatchObject({ employeeName: 'Maria' });
    expect(
      parseListTourCalendarWeekFromPrompt(
        'Mountain trek tours on this calendar week with pax',
      ),
    ).toMatchObject({ serviceName: 'Mountain trek' });
  });

  // e2e-bug.250 — classifier fragment must not become serviceName.
  it('rejects "I have this week" params.serviceName for unscoped prompt', () => {
    const parsed = parseListTourCalendarWeekFromPrompt(
      'What tour bookings do I have this week?',
      { serviceName: 'I have this week' },
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.serviceName).toBeUndefined();
  });
});
