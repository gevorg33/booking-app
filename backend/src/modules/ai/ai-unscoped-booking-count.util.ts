/**
 * e2e-bug.154 — unqualified booking totals ("how many bookings in total?")
 * must not fall through to react_agent list_appointments with a silent empty day.
 */
export function isUnscopedBookingCountPrompt(prompt: string): boolean {
  if (!/\b(bookings?|appointments?)\b/i.test(prompt)) return false;
  if (
    /\b(today|tomorrow|yesterday|this week|last week|this month|last month|next week|next month)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\b(revenue|earn|earnings|sales|income)\b/i.test(prompt)) return false;
  return (
    (/\b(how\s+many|count|number of)\b/i.test(prompt) &&
      /\b(in\s+total|altogether|overall|all[\s-]?time|ever)\b/i.test(prompt)) ||
    /\b(total\s+(number\s+of\s+)?(bookings?|appointments?)|bookings?\s+in\s+total|appointments?\s+in\s+total)\b/i.test(
      prompt,
    )
  );
}
