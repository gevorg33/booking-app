/** Owner-only compliance workflows (breach + PHI audit). */

export const GDPR_BREACH_NOTIFICATION_HOURS = 72;

export function isBusinessOwner(
  membershipRole: string | undefined | null,
): boolean {
  return membershipRole === 'owner';
}

export function resolveBreachDeadlineAlerts(
  deadlineIso: string,
  nowMs = Date.now(),
): { approaching: boolean; overdue: boolean } {
  const msRemaining = new Date(deadlineIso).getTime() - nowMs;
  return {
    approaching: msRemaining > 0 && msRemaining <= 24 * 60 * 60 * 1000,
    overdue: msRemaining <= 0,
  };
}

export function canSubmitBreachReport(description: string): boolean {
  return description.trim().length >= 10;
}
