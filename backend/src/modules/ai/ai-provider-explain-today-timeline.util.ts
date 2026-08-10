import { PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS } from './ai-provider-explain-today-timeline.fixtures.js';

export function isExplainTodayTimelinePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // fill_unused_slots owns "afternoon gap" phrasing (mutate-adjacent offer-to-fill flow).
  if (/afternoon/.test(lower) && /gaps?/.test(lower)) return false;

  if (
    /\b(?:walk|talk)\s+me\s+through\s+(?:my\s+)?(?:day|schedule|today)\b/.test(
      lower,
    ) ||
    /\bwhat\s+does\s+my\s+day\s+look\s+like\b/.test(lower) ||
    /\b(?:any\s+)?(?:gaps?|breaks?|downtime)\s+(?:between\s+(?:my\s+)?(?:clients?|appointments?)|today)\b/.test(
      lower,
    ) ||
    /\bdo\s+i\s+have\s+(?:any\s+)?breaks?\s+between\s+clients?\b/.test(lower) ||
    /\bmy\s+timeline\s+for\s+today\b/.test(lower) ||
    /\bwhat'?s\s+my\s+downtime\b/.test(lower)
  ) {
    return true;
  }

  if (/պատմիր.{0,10}օրվա/iu.test(prompt)) return true;
  if (/դադարներ.{0,20}հաճախորդ/iu.test(prompt)) return true;
  if (/расскажи.{0,15}(?:дне|дню)\b/iu.test(prompt)) return true;
  if (/окна?\s+между\s+клиент/iu.test(prompt)) return true;

  return PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueExplainTodayTimelineIntent(
  prompt: string,
  action: string,
): { action: 'explain_today_timeline'; rescueReason: string } | null {
  if (!isExplainTodayTimelinePrompt(prompt)) return null;
  if (action === 'explain_today_timeline') return null;
  return {
    action: 'explain_today_timeline',
    rescueReason: 'explain_today_timeline',
  };
}
