/**
 * e2e-bug.263 — visit-status aliases are single-target (or unique match).
 * Never bulk-mutate the provider's day when multiple appointments match.
 */

export type VisitStatusAlias = 'mark_visit_in_progress' | 'mark_visit_complete';

/** After findMatchingBookings filters, >1 match always needs client/booking clarify. */
export function shouldClarifyVisitStatusTarget(matchedCount: number): boolean {
  return matchedCount > 1;
}

export function buildVisitStatusTargetClarifySummary(
  matchedCount: number,
): string {
  if (matchedCount > 1) {
    return `Which client? I found ${matchedCount} appointments — name the customer or open their appointment, then try again.`;
  }
  return 'Open the appointment or name the client, then try again.';
}

export function buildVisitStatusTargetClarifyDetails(
  action: VisitStatusAlias,
  matchedCount: number,
): Record<string, unknown> {
  return {
    clarify: true,
    action,
    matchedCount,
    missing: ['customerName', 'bookingId'],
  };
}
