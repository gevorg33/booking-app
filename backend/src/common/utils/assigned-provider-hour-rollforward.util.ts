/**
 * e2e-bug.315 — owner-facing gate for the assigned-provider hour roll-forward
 * materialize step on booking POST. Defaults to true (current behavior
 * unchanged) so existing businesses relying on e2e-bug.254's auto-fill keep
 * working; owners who intentionally leave a specialist off the calendar can
 * set this to false to make booking fail closed instead of silently writing
 * real scheduling_periods/scheduling_slots rows for that specialist.
 */
export function resolveAssignedProviderHourRollForwardAllowed(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  const publicBooking =
    (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  return publicBooking.allowAssignedProviderHourRollForward !== false;
}
