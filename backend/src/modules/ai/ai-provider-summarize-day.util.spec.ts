import { t } from '../../common/i18n/messages.js';
import { PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS } from './ai-provider-summarize-day.fixtures.js';
import { isGetScheduleSummaryPrompt } from './ai-provider-schedule-reads.util.js';
import {
  isLegacyEmptyTodaySchedulePrompt,
  isSummarizeDayPrompt,
  rescueSummarizeDayIntent,
} from './ai-provider-summarize-day.util.js';

describe('ai-provider-summarize-day.util', () => {
  it.each(PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]))(
    'detects summarize_day prompt %s',
    (_id, prompt) => {
      expect(isSummarizeDayPrompt(prompt)).toBe(true);
    },
  );

  it('does not misdetect unrelated prompts', () => {
    expect(isSummarizeDayPrompt('Show me my appointments today')).toBe(false);
    expect(isSummarizeDayPrompt('How much did I make this week?')).toBe(false);
  });

  it('does not steal multi-day get_schedule_summary phrasing (e2e-bug.66)', () => {
    expect(
      isSummarizeDayPrompt('Summarize my schedule for the next two weeks'),
    ).toBe(false);
    expect(
      isGetScheduleSummaryPrompt('Summarize my schedule for the next two weeks'),
    ).toBe(true);
  });

  it.each(['en', 'hy', 'ru'] as const)(
    'emptyTodayPrompt (%s) is recognized as summarize_day (e2e-bug.66)',
    (locale) => {
      const prompt = t(locale, 'providerSuggestions.emptyTodayPrompt');
      expect(isSummarizeDayPrompt(prompt)).toBe(true);
      expect(rescueSummarizeDayIntent(prompt, 'unknown')?.action).toBe(
        'summarize_day',
      );
      expect(isGetScheduleSummaryPrompt(prompt)).toBe(false);
    },
  );

  it.each([
    'Summarize my schedule for 15/07/2026',
    'Summarize my schedule for 2026-07-15',
    'Ամփոփիր իմ գրաֆիկը 15/07/2026 ամսաթվի համար',
    'Кратко опиши моё расписание на 15/07/2026',
  ])('rescues legacy empty-today schedule prompt: %s (e2e-bug.66)', (prompt) => {
    expect(isLegacyEmptyTodaySchedulePrompt(prompt)).toBe(true);
    expect(rescueSummarizeDayIntent(prompt, 'unknown')).toEqual({
      action: 'summarize_day',
      rescueReason: 'summarize_day',
    });
    expect(isGetScheduleSummaryPrompt(prompt)).toBe(false);
  });

  it.each(PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]))(
    'rescues summarize_day from unknown for %s',
    (_id, prompt) => {
      const rescued = rescueSummarizeDayIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('summarize_day');
      expect(rescued?.rescueReason).toBe('summarize_day');
    },
  );

  it('returns null for unrelated prompts', () => {
    expect(rescueSummarizeDayIntent('Show me my appointments', 'unknown')).toBeNull();
  });
});
