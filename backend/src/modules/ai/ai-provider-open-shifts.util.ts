/** prov-exp-7.3 — AI intent helpers for provider open shifts / gap waitlist. */

export const PROVIDER_OPEN_SHIFTS_INTENTS = [
  'suggest_waitlist_for_gap',
] as const;

export function rescueProviderOpenShiftsIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    action !== 'unknown' &&
    PROVIDER_OPEN_SHIFTS_INTENTS.includes(action as (typeof PROVIDER_OPEN_SHIFTS_INTENTS)[number])
  ) {
    return null;
  }
  const normalized = prompt.toLowerCase();
  if (
    /fill\s+(?:this\s+)?gap|suggest\s+waitlist.*(?:gap|slot)|waitlist.*(?:for|fill).*(?:gap|slot)|who\s+(?:on|from)\s+waitlist.*gap/.test(
      normalized,
    )
  ) {
    return {
      action: 'suggest_waitlist_for_gap',
      rescueReason: 'fill_gap_waitlist',
    };
  }
  return null;
}
