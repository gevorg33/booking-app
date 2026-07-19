import { PROVIDER_CALENDAR_UTILIZATION_BAND_THRESHOLDS } from '../provider-mobile/provider-calendar-month.util.js';
import {
  PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS,
} from './ai-provider-calendar-scheduling-explainers.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.23.2 — what the calendar month view's utilization color bands mean. */
export function isExplainCalendarUtilizationBandsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|set|update|block|cancel|reschedule)\b/.test(lower)) return false;

  if (
    /\bwhat\s+do(?:es)?\s+the\b.{0,25}\b(colou?rs?|bands?|shading)\b.{0,20}\bmean\b/i.test(
      lower,
    ) ||
    /\bfully\s+booked\s+day\??\b/i.test(lower) ||
    /\bcalendar\s+(?:colou?rs?|bands?|shading)\b/i.test(lower) ||
    /\bexplain\b.{0,25}\b(calendar\s+(?:colou?rs?|bands?)|utilization\s+bands?)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(օրացույց)/i.test(prompt) &&
    /(գույն|նշանակում)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(календар)/i.test(prompt) &&
    /(цвет|означа)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

/** ai-cmd-provider-5.23.4 — self-service FAQ: instant block vs approval-based time off. */
export function isExplainBlockVsTimeOffPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (
    /\bblock\b.{0,20}\bvs\.?\b.{0,20}\btime\s*off\b/i.test(lower) ||
    /\btime\s*off\b.{0,20}\bvs\.?\b.{0,20}\bblock\b/i.test(lower) ||
    /\bdifference\s+between\b.{0,20}\bblock\b.{0,20}\btime\s*off\b/i.test(
      lower,
    ) ||
    /\bwhich\s+should\s+i\s+use\s+for\s+(?:vacation|pto|time\s*off)\b/i.test(
      lower,
    ) ||
    /\bblock\s+or\s+(?:request\s+)?time\s*off\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(արգելափակ)/i.test(prompt) &&
    /(արձակուրդ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(блокир)/i.test(prompt) &&
    /(отпуск)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainCalendarUtilizationBandsSummary(): string {
  const { medium, high } = PROVIDER_CALENDAR_UTILIZATION_BAND_THRESHOLDS;
  return [
    'The calendar month view color-codes each day by how booked it is.',
    'Empty: no appointments scheduled.',
    `Low: under ${medium}% of your working hours booked.`,
    `Medium: ${medium}-${high - 1}% booked.`,
    `High: ${high}% or more booked — fully booked or close to it.`,
  ].join(' ');
}

export function buildExplainBlockVsTimeOffSummary(): string {
  return [
    'Block schedule instantly blocks time on your calendar with no approval needed — use it for short things like a team meeting or an errand.',
    'Request time off submits a date range for your manager to approve — use it for vacation or longer absences that need sign-off.',
  ].join(' ');
}

export function rescueCalendarSchedulingExplainersIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_calendar_utilization_bands' | 'explain_block_vs_time_off';
  rescueReason: string;
} | null {
  if (
    isExplainCalendarUtilizationBandsPrompt(prompt) &&
    action !== 'explain_calendar_utilization_bands'
  ) {
    return {
      action: 'explain_calendar_utilization_bands',
      rescueReason: 'explain_calendar_utilization_bands',
    };
  }
  if (
    isExplainBlockVsTimeOffPrompt(prompt) &&
    action !== 'explain_block_vs_time_off'
  ) {
    return {
      action: 'explain_block_vs_time_off',
      rescueReason: 'explain_block_vs_time_off',
    };
  }
  return null;
}
