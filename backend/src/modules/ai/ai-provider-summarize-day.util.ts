import {
  PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS,
} from './ai-provider-summarize-day.fixtures.js';

export function isSummarizeDayPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /how'?s\s+(?:my\s+day|today|tomorrow)\s+(?:looking|going)|summarize\s+(?:my\s+)?day\b|(?:rundown|breakdown)\s+of\s+(?:today|my\s+day)|status\s+of\s+(?:today|my\s+day)|any\s+no-?shows?\s+(?:yet|today)|any\s+cancellations?\s+today|appointments?\s+(?:are\s+)?completed\s+so\s+far/.test(
      lower,
    )
  ) {
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
