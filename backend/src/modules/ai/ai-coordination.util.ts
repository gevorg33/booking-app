export interface CoordinationParams {
  employeeName?: string | null;
  waitlistCustomerName?: string | null;
  customerName?: string | null;
  date?: string | null;
  timeSlot?: string | null;
  trigger?: 'cancel' | 'reschedule' | null;
  reason?: string | null;
}

const COORDINATION_PROMPT_PATTERNS = [
  /if\s+.+\s+cancel/i,
  /when\s+.+\s+cancel/i,
  /offer\s+(?:the\s+)?slot\s+to\s+waitlist/i,
  /waitlist\s+customer/i,
  /cancel.+offer.+waitlist/i,
];

export function isCoordinationPrompt(prompt: string): boolean {
  return COORDINATION_PROMPT_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function rescueCoordinationIntent(prompt: string, action: string): string {
  if (action !== 'unknown' && action !== 'cancel_bookings') return action;
  return isCoordinationPrompt(prompt) ? 'coordinate_waitlist_offer' : action;
}

export function normalizeCoordinationParams(params: Record<string, unknown>): CoordinationParams {
  return {
    employeeName: (params.employeeName as string | null | undefined) ?? null,
    waitlistCustomerName:
      (params.waitlistCustomerName as string | null | undefined) ??
      (params.customerName as string | null | undefined) ??
      null,
    customerName: (params.customerName as string | null | undefined) ?? null,
    date: (params.date as string | null | undefined) ?? null,
    timeSlot: (params.timeSlot as string | null | undefined) ?? null,
    trigger: (params.trigger as CoordinationParams['trigger']) ?? 'cancel',
    reason: (params.reason as string | null | undefined) ?? null,
  };
}

export function canRunCoordinationOnProvider(viewMode: string): boolean {
  return viewMode === 'team';
}

export function buildCoordinationPreviewSummary(input: {
  employeeName: string;
  waitlistCustomerName: string;
  bookingLabel: string;
  bookingCount: number;
}): string {
  const { employeeName, waitlistCustomerName, bookingLabel, bookingCount } = input;
  const plural = bookingCount > 1 ? `${bookingCount} appointments` : bookingLabel;
  return (
    `If ${employeeName} cancels ${plural}, offer the freed slot to waitlist customer ${waitlistCustomerName}? ` +
    `This will cancel the appointment(s) and create a waitlist offer for ${waitlistCustomerName}.`
  );
}

export function buildCoordinationDeniedSummary(viewMode: string): string {
  if (viewMode !== 'team') {
    return 'Cross-provider waitlist coordination requires manager team view. Switch to team schedule and try again.';
  }
  return 'Coordination is not available for your role.';
}
