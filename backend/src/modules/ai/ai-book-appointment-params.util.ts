/**
 * Param enrich for public/customer timed `book_appointment` (e2e-bug.192).
 * Kept separate from classifier/rescue detectors to avoid circular imports via
 * ai-intent-heuristics → booking-param-hints.
 */
import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { extractGuestContactFromPrompt } from './ai-get-manage-link.util.js';
import { extractEmployeeNameFromPrompt } from './ai-self-service-booking.util.js';
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';

function extractBookCustomerNameFromPrompt(prompt: string): string | null {
  const labeled = prompt.match(
    /\b(?:my\s+name\s+is|name\s+is|name)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3})(?=\s*(?:,|$|\bemail\b|\bphone\b|\btel\b|\bpay\b))/i,
  );
  if (labeled?.[1]) return labeled[1].trim();
  return null;
}

/** Provider / time / contact hints for timed book_appointment execution. */
export function enrichBookAppointmentParamsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...params,
    ...buildSharedBookingContextFromPrompt(prompt),
  };

  if (!next.employeeName) {
    const employeeName =
      extractEmployeeNameFromPrompt(prompt) ??
      prompt.match(
        /\bwith\s+([A-Za-z][\w'-]+(?:\s+[A-Za-z][\w'-]+)?)(?=\s+(?:tomorrow|today|tonight|on|at|,)|\s*$)/i,
      )?.[1];
    if (employeeName) next.employeeName = employeeName.trim();
  }

  // "schedule Swedish massage Gevorg tomorrow 11:00" — bare name before tomorrow.
  if (!next.employeeName) {
    const bare = prompt.match(
      /\b(?:massage|hairstyle|cut|color|lashes?|facial|treatment)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:tomorrow|today|tonight|on\s+)/,
    );
    if (bare?.[1]) next.employeeName = bare[1].trim();
  }

  if (!next.timeSlot) {
    const timeSlot = extractTimeSlotFromPrompt(prompt);
    if (timeSlot) next.timeSlot = timeSlot;
  }

  if (!next.customerName) {
    const customerName = extractBookCustomerNameFromPrompt(prompt);
    if (customerName) next.customerName = customerName;
  }

  const contact = extractGuestContactFromPrompt(prompt);
  if (!next.customerEmail && contact.email) next.customerEmail = contact.email;
  if (!next.customerPhone && contact.phone) next.customerPhone = contact.phone;

  // Prefer concrete clock time over first-available when both present.
  if (next.timeSlot) {
    delete next.bookingFirstAvailable;
  }

  return next;
}
