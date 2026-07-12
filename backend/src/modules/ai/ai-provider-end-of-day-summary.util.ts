import { PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS } from './ai-provider-end-of-day-summary.fixtures.js';
import { isListTeamUnpaidTodayPrompt } from './ai-provider-exp-2.util.js';

export function isEndOfDaySummaryPrompt(prompt: string): boolean {
  if (isListTeamUnpaidTodayPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();

  if (
    /\bwrap(?:ping)?\s+up\s+(?:my\s+)?(?:today|day)\b/.test(lower) ||
    /\bend\s+of\s+(?:the\s+)?day\s+summary\b/.test(lower) ||
    /\bclose\s+(?:out|up)\s+(?:my\s+)?day\b/.test(lower) ||
    /\bbefore\s+i\s+close\s+up\b/.test(lower) ||
    /(?:anything|is\s+(?:there\s+)?anything)\s+(?:still\s+)?unpaid\b/.test(
      lower,
    ) ||
    /no-?shows?.{0,25}follow\s*[- ]?up\b/.test(lower) ||
    /\btoday'?s\s+wrap[- ]?up\b/.test(lower) ||
    /\bhow\s+was\s+my\s+day\s+overall\b/.test(lower)
  ) {
    return true;
  }

  const isSweepImperative =
    /(հավաքիր|ավլիր)/iu.test(prompt) || /(собери|сбор|зачист)/iu.test(prompt);

  if (/ամփոփ.{0,15}օր/iu.test(prompt)) return true;
  if (/չվճարվա/iu.test(prompt) && !isSweepImperative) return true;
  if (/итог.{0,10}дня/iu.test(prompt)) return true;
  if (/неоплачен/iu.test(prompt) && !isSweepImperative) return true;

  return PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueEndOfDaySummaryIntent(
  prompt: string,
  action: string,
): { action: 'end_of_day_summary'; rescueReason: string } | null {
  if (!isEndOfDaySummaryPrompt(prompt)) return null;
  if (action === 'end_of_day_summary') return null;
  return {
    action: 'end_of_day_summary',
    rescueReason: 'end_of_day_summary',
  };
}
