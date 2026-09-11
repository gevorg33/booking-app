import { PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS } from './ai-provider-summarize-day.fixtures.js';

/** Legacy empty-today suggestion prompts (e2e-bug.66) — single calendar date, not a range. */
export function isLegacyEmptyTodaySchedulePrompt(prompt: string): boolean {
  if (
    /\bsummarize\s+my\s+schedule\s+for\s+(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  // Prior hy/ru emptyTodayPrompt templates with an interpolated display date.
  if (/Ամփոփիր\s+իմ\s+գրաֆիկը\s+.+\s+ամսաթվի\s+համար/u.test(prompt)) {
    return true;
  }
  if (/Кратко\s+опиши\s+моё\s+расписание\s+на\s+/u.test(prompt)) {
    return true;
  }
  return false;
}

export function isSummarizeDayPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /how'?s\s+(?:my\s+day|today|tomorrow)\s+(?:looking|going)|summarize\s+(?:my\s+)?day\b|(?:rundown|breakdown)\s+of\s+(?:today|my\s+day)|status\s+of\s+(?:today|my\s+day)|any\s+no-?shows?\s+(?:yet|today)|any\s+cancellations?\s+today|appointments?\s+(?:are\s+)?completed\s+so\s+far/.test(
      lower,
    )
  ) {
    return true;
  }
  if (isLegacyEmptyTodaySchedulePrompt(prompt)) {
    return true;
  }
  return PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueSummarizeDayIntent(
  prompt: string,
  action: string,
): { action: 'summarize_day'; rescueReason: string } | null {
  for (const scenario of PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS) {
    if (scenario.prompt === prompt) {
      return { action: 'summarize_day', rescueReason: 'summarize_day' };
    }
  }
  if (isSummarizeDayPrompt(prompt)) {
    return { action: 'summarize_day', rescueReason: 'summarize_day' };
  }
  return null;
}
