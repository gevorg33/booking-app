import {
  PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS,
} from './ai-provider-visit-status-explainers.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.16.5 — what a booking status badge means. */
export function isExplainBookingStatusBadgePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|set|update|confirm|accept|approve)\b/.test(lower)) return false;
  if (/\bfloor\b/.test(lower)) return false;
  if (/\b(payment|paid|stripe|cash|deposit)\b/.test(lower)) return false;

  if (
    /\b(what\s+does|what'?s|why)\b.{0,30}\b(pending|confirmed|in[\s-]?progress|completed|no[\s-]?show|status|badge)\b/i.test(
      lower,
    ) ||
    /\bexplain\b.{0,20}\b(booking\s+status(?:es)?|status\s+badge)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    !/floor/i.test(prompt) &&
    /(ի՞նչ|ինչու)/i.test(prompt) &&
    /(կարգավիճակ|նշանակում)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(что\s+означает|почему)/i.test(prompt) &&
    /(статус|запис|брон)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

/** ai-cmd-provider-5.16.6 — what the check-in floor strip states mean. */
export function isExplainFloorStatusPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|set|update|confirm|accept|approve|check\s+in)\b/.test(lower)) {
    return false;
  }

  if (
    /\bwaiting\s+vs\.?\s+in\s+service\b/i.test(lower) ||
    /\bwhat'?s\s+checked\s+in\b/i.test(lower) ||
    /\bexplain\b.{0,20}\bfloor\s+status\b/i.test(lower) ||
    /\bwhat\s+does\b.{0,20}\bfloor\s+(?:status|strip)\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(ի՞նչ|ինչու)/i.test(prompt) &&
    /floor\s+status/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(что\s+показывает|почему)/i.test(prompt) &&
    /floor\s+status/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainBookingStatusBadgeSummary(): string {
  return [
    'Pending: the client booked but you have not confirmed the appointment yet.',
    'Confirmed: you have accepted the booking.',
    'In progress: the visit has started — you tapped "Start service" or "Begin".',
    'Completed: the visit is finished.',
    'No-show: the client did not arrive and the appointment window passed.',
  ].join(' ');
}

export function buildExplainFloorStatusSummary(): string {
  return [
    "The floor strip shows where each of today's clients is right now.",
    'Waiting / checked in: the client has arrived but their service has not started.',
    'In service: a provider is actively working with them.',
    'Done: their visit is complete and they have left the floor.',
  ].join(' ');
}

export function rescueVisitStatusExplainersIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_booking_status_badge' | 'explain_floor_status';
  rescueReason: string;
} | null {
  if (
    isExplainBookingStatusBadgePrompt(prompt) &&
    action !== 'explain_booking_status_badge'
  ) {
    return {
      action: 'explain_booking_status_badge',
      rescueReason: 'explain_booking_status_badge',
    };
  }
  if (isExplainFloorStatusPrompt(prompt) && action !== 'explain_floor_status') {
    return {
      action: 'explain_floor_status',
      rescueReason: 'explain_floor_status',
    };
  }
  return null;
}
