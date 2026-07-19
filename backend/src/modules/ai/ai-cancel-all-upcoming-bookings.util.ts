/**
 * e2e-bug.78 — cancel_all_upcoming_bookings two-turn confirm must not rely on
 * the LLM setting params.confirm from freeform history alone.
 */

export type CancelAllUpcomingHistoryMessage = {
  role: string;
  content: string;
};

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

/** Bare "yes" / "confirm" or "yes, cancel them all" style affirmations. */
export function isCancelAllUpcomingAffirmativePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    /^(yes|y|yeah|yep|confirm|confirmed|go\s+ahead|do\s+it|proceed|ok|okay|sure|please\s+do|absolutely)[.!]?$/iu.test(
      text,
    )
  ) {
    return true;
  }
  return (
    /\b(yes|yeah|yep|confirm|confirmed|go\s+ahead|sure|ok|okay)\b/i.test(
      text,
    ) &&
    /\bcancel\b/i.test(text) &&
    /\b(all|them|everything|every)\b/i.test(text)
  );
}

/** Prior assistant preview from handleCancelAllUpcomingBookingsLogic. */
export function isCancelAllUpcomingPreviewAssistantMessage(
  content: string,
): boolean {
  const text = content.trim();
  if (!text) return false;
  return (
    /this will cancel\s+\d+\s+upcoming booking/i.test(text) &&
    /reply yes to confirm/i.test(text)
  );
}

export function lastCancelAllUpcomingPreviewFromHistory(
  history?: readonly CancelAllUpcomingHistoryMessage[] | null,
): string | null {
  if (!history?.length) return null;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (message?.role !== 'assistant') continue;
    if (isCancelAllUpcomingPreviewAssistantMessage(message.content ?? '')) {
      return message.content;
    }
  }
  return null;
}

export function isCancelAllUpcomingPendingParams(
  params: Record<string, unknown> = {},
  history?: readonly CancelAllUpcomingHistoryMessage[] | null,
): boolean {
  if (isTruthyFlag(params.cancelAllUpcomingPending)) return true;
  if (params.pendingAction === 'cancel_all_upcoming_bookings') return true;
  if (
    isTruthyFlag(params.requiresConfirmation) &&
    (params.pendingAction === 'cancel_all_upcoming_bookings' ||
      isTruthyFlag(params.cancelAllUpcomingPending))
  ) {
    return true;
  }
  return lastCancelAllUpcomingPreviewFromHistory(history) != null;
}

export function isCancelAllUpcomingConfirmed(
  params: Record<string, unknown> = {},
): boolean {
  return params.confirm === true;
}

/**
 * Force confirm=true when the customer affirms after a preview (session pending
 * and/or the prior assistant turn was the cancel-all preview).
 */
export function enrichCancelAllUpcomingConfirmFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
  history?: readonly CancelAllUpcomingHistoryMessage[] | null,
): Record<string, unknown> {
  if (params.confirm === true) return params;
  if (!isCancelAllUpcomingAffirmativePrompt(prompt)) return params;
  if (!isCancelAllUpcomingPendingParams(params, history)) return params;
  return { ...params, confirm: true };
}

/**
 * Rescue a bare affirmative onto cancel_all_upcoming_bookings when a preview
 * is pending in session/params or visible in conversation history.
 */
export function rescueCancelAllUpcomingConfirmIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown> = {},
  history?: readonly CancelAllUpcomingHistoryMessage[] | null,
): {
  action: 'cancel_all_upcoming_bookings';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isCancelAllUpcomingPendingParams(params, history)) return null;
  if (!isCancelAllUpcomingAffirmativePrompt(prompt)) return null;
  if (action === 'cancel_all_upcoming_bookings' && params.confirm === true) {
    return null;
  }
  return {
    action: 'cancel_all_upcoming_bookings',
    rescueReason: 'cancel_all_upcoming_confirm',
    params: { ...params, confirm: true },
  };
}

export function buildCancelAllUpcomingPendingSessionContext(
  bookingIds?: string[],
): Record<string, unknown> {
  return {
    cancelAllUpcomingPending: true,
    requiresConfirmation: true,
    pendingAction: 'cancel_all_upcoming_bookings',
    ...(bookingIds?.length ? { bookingIds } : {}),
  };
}

export function buildCancelAllUpcomingClearedSessionContext(): Record<
  string,
  unknown
> {
  return {
    cancelAllUpcomingPending: false,
    requiresConfirmation: false,
    pendingAction: null,
    confirm: false,
  };
}
