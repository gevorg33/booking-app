import { PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS } from './ai-provider-summarize-day.fixtures.js';
import {
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
