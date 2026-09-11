import { PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS } from './ai-provider-end-of-day-summary.fixtures.js';
import {
  isEndOfDaySummaryPrompt,
  rescueEndOfDaySummaryIntent,
} from './ai-provider-end-of-day-summary.util.js';

describe('ai-provider-end-of-day-summary.util', () => {
  it.each(
    PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects end_of_day_summary prompt %s', (_id, prompt) => {
    expect(isEndOfDaySummaryPrompt(prompt)).toBe(true);
  });

  it('does not misdetect summarize_day (mid-day status check)', () => {
    expect(isEndOfDaySummaryPrompt("How's today looking?")).toBe(false);
    expect(isEndOfDaySummaryPrompt('Give me a rundown of today')).toBe(false);
    expect(isEndOfDaySummaryPrompt('Summarize my day')).toBe(false);
    expect(isEndOfDaySummaryPrompt('Any no-shows yet today?')).toBe(false);
  });

  it.each(
    PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('rescues end_of_day_summary from unknown for %s', (_id, prompt) => {
    const rescued = rescueEndOfDaySummaryIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('end_of_day_summary');
    expect(rescued?.rescueReason).toBe('end_of_day_summary');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueEndOfDaySummaryIntent("How's today looking?", 'unknown'),
    ).toBeNull();
  });

  it('returns null when already classified as end_of_day_summary', () => {
    expect(
      rescueEndOfDaySummaryIntent('Wrap up today', 'end_of_day_summary'),
    ).toBeNull();
  });
});
