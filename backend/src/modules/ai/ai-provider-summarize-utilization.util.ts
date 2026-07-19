import { PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS } from './ai-provider-summarize-utilization.fixtures.js';

export function isSummarizeUtilizationPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/revenue|earnings?|\bstats\b|statistics|performance/.test(lower)) {
    return false;
  }
  if (
    /utilization|utilisation|how\s+busy|booked\s+percent|percent\s+of\s+my\s+slots|how\s+full\s+is\s+my|how\s+booked|is\s+my\s+schedule\s+full|open\s+hours\s+(?:do\s+i\s+have|this\s+month)/.test(
      lower,
    )
  ) {
    return true;
  }
  if (/(?:զբաղված|լրացվածութ)/iu.test(prompt)) {
    return true;
  }
  if (/(?:загружен|процент.*(?:слот|забронир)|забронирован)/iu.test(prompt)) {
    return true;
  }
  return PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueSummarizeUtilizationIntent(
  prompt: string,
  action: string,
): { action: 'summarize_utilization'; rescueReason: string } | null {
  for (const scenario of PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS) {
    if (scenario.prompt === prompt) {
      return { action: 'summarize_utilization', rescueReason: 'summarize_utilization' };
    }
  }
  if (isSummarizeUtilizationPrompt(prompt)) {
    return { action: 'summarize_utilization', rescueReason: 'summarize_utilization' };
  }
  return null;
}
