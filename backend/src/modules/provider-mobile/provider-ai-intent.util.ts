/** Heuristic intent rescue for provider mobile commands (Sprint 19). */
export function rescueProviderAiIntent(prompt: string, action: string): string {
  const lower = prompt.toLowerCase();

  if (
    /payment\s+sweep|mark\s+(?:all\s+)?(?:today(?:'s)?\s+)?(?:as\s+)?paid|mark\s+unpaid|collect\s+outstanding/.test(
      lower,
    )
  ) {
    return 'payment_sweep';
  }
  if (
    /mark\s+no[\s-]?shows?|no[\s-]?shows?\s+for/.test(lower) &&
    !/cancel/.test(lower)
  ) {
    return 'mark_no_shows';
  }
  if (
    /who'?s\s+next|who\s+is\s+next|next\s+(?:appointment|client|booking)/.test(
      lower,
    )
  ) {
    return 'show_appointments';
  }
  if (/utilization|utilisation|how\s+busy|booked\s+percent/.test(lower)) {
    return 'summarize_utilization';
  }
  if (
    /block\s+(?:my\s+)?lunch|lunch\s+break|block\s+.+break|block\s+\d{1,2}:\d{2}/.test(
      lower,
    )
  ) {
    return 'block_schedule';
  }
  if (
    /(?:any\s+)?gaps?\s+(?:this\s+)?afternoon|afternoon\s+gaps?|open\s+slots?\s+(?:this\s+)?afternoon/.test(
      lower,
    )
  ) {
    return 'fill_unused_slots';
  }
  if (
    /(?:check\s+)?availability|(?:am\s+i|are\s+there)\s+(?:open|free)\s+slots?|what\s+(?:slots?|times?)\s+(?:are\s+)?(?:open|free)/.test(
      lower,
    ) &&
    !/fill\s+(?:gaps?|slots?)/.test(lower)
  ) {
    return 'check_availability';
  }
  if (
    /show\s+(?:my\s+)?appointments|list\s+(?:my\s+)?appointments|what'?s\s+on\s+(?:my\s+)?schedule/.test(
      lower,
    )
  ) {
    return 'show_appointments';
  }

  return action;
}

export const PROVIDER_MOBILE_READ_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'summarize_day',
  'check_availability',
  'summarize_utilization',
]);
