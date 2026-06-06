import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { MULTILINGUAL_TOUR_CALENDAR_EVAL_SCENARIOS } from './ai-tour-calendar-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  parseExplainTourCalendarSpanFromPrompt,
  rescueExplainTourCalendarSpanIntent,
} from './ai-tour-calendar-span.util.js';
import {
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';

describe('ai-tour-calendar-multilingual.util (ai-cmd-tour-13)', () => {
  const rescueService = new AiIntentRescueService();

  it('rescues tour calendar intents through AiIntentRescueService', () => {
    const spanRescued = rescueService.rescue({
      prompt:
        'Why do tours appear across multiple days on the provider calendar?',
      action: 'unknown',
      params: {},
    });
    expect(spanRescued?.action).toBe('explain_tour_calendar_span');

    const weekRescued = rescueService.rescue({
      prompt: 'List tour departures on the provider calendar this week',
      action: 'unknown',
      params: {},
    });
    expect(weekRescued?.action).toBe('list_tour_calendar_week');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(MULTILINGUAL_TOUR_CALENDAR_EVAL_SCENARIOS)(
    'rescues multilingual tour calendar scenario $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'explain_tour_calendar_span') {
        expect(rescueExplainTourCalendarSpanIntent(prompt, 'unknown')).toEqual({
          action: 'explain_tour_calendar_span',
          rescueReason: 'explain_tour_calendar_span',
        });
        expect(
          parseExplainTourCalendarSpanFromPrompt(prompt, paramsPartial ?? {}),
        ).not.toBeNull();
        return;
      }

      expect(rescueListTourCalendarWeekIntent(prompt, 'unknown')).toEqual({
        action: 'list_tour_calendar_week',
        rescueReason: 'list_tour_calendar_week',
      });
      expect(
        parseListTourCalendarWeekFromPrompt(prompt, paramsPartial ?? {}),
      ).not.toBeNull();
    },
  );
});
