import { EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS } from './ai-tour-calendar-span.fixtures.js';
import {
  isExplainTourCalendarSpanPrompt,
  parseExplainTourCalendarSpanFromPrompt,
  rescueExplainTourCalendarSpanIntent,
} from './ai-tour-calendar-span.util.js';

describe('ai-tour-calendar-span.util (ai-cmd-tour-11)', () => {
  it.each(EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS)(
    'recognizes calendar span prompt $id',
    ({ prompt }) => {
      expect(isExplainTourCalendarSpanPrompt(prompt)).toBe(true);
      expect(parseExplainTourCalendarSpanFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS)(
    'rescues unknown action to explain_tour_calendar_span for $id',
    ({ prompt }) => {
      expect(rescueExplainTourCalendarSpanIntent(prompt, 'unknown')).toEqual({
        action: 'explain_tour_calendar_span',
        rescueReason: 'explain_tour_calendar_span',
      });
    },
  );

  it('does not steal per-booking record prompts', () => {
    const prompt =
      'Why does this tour booking span June 11–13 on the provider calendar?';
    expect(isExplainTourCalendarSpanPrompt(prompt)).toBe(false);
    expect(parseExplainTourCalendarSpanFromPrompt(prompt)).toBeNull();
  });

  it('does not steal departure aggregation prompts', () => {
    const prompt =
      'List upcoming tour departures with pax and remaining capacity';
    expect(isExplainTourCalendarSpanPrompt(prompt)).toBe(false);
  });

  it('parses service filter and aspect from fixtures', () => {
    const parsed = parseExplainTourCalendarSpanFromPrompt(
      'Explain how 3-Day Mountain Trek spans show on the provider calendar',
    );
    expect(parsed).toMatchObject({
      serviceName: '3-Day Mountain Trek',
      aspect: 'multiDaySpan',
    });
  });
});
