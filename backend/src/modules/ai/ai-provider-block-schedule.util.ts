import { PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS } from './ai-provider-block-schedule.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.0.1 — block a chunk of the calendar for a meeting/closure/admin (not the provider's own break/lunch). */
export function isProviderBlockSchedulePrompt(prompt: string): boolean {
  if (
    PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS.some(
      (scenario) => scenario.prompt === prompt,
    )
  ) {
    return true;
  }

  const lower = prompt.toLowerCase();
  if (/\bblock\s+my\b/i.test(lower)) return false;
  if (/\bblock\b/i.test(lower)) {
    if (/\bschedule\b/i.test(lower) || /\bteam\s+meeting\b/i.test(lower)) {
      return true;
    }
  }

  if (
    containsArmenianScript(prompt) &&
    /(փակիր|արգելափակ)/i.test(prompt) &&
    /(գրաֆիկ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(заблокир)/i.test(prompt) &&
    /(расписан)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function rescueProviderBlockScheduleIntent(
  prompt: string,
  action: string,
): { action: 'block_schedule'; rescueReason: string } | null {
  if (action === 'block_schedule') return null;
  if (isProviderBlockSchedulePrompt(prompt)) {
    return { action: 'block_schedule', rescueReason: 'provider_block_schedule' };
  }
  return null;
}
