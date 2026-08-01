/**
 * e2e-bug.212 — public checkout must not default WhatsApp reminders ON for
 * guests without a phone (that blocked book with a hard phone required error).
 *
 * Default ON only when a phone is already present (signed-in profile / prefill).
 */
export function resolveDefaultPublicCheckoutWhatsappReminders(
  existingPhone?: string | null,
): boolean {
  return Boolean(existingPhone?.trim());
}

/** Phone is required only when the guest explicitly opts into WhatsApp. */
export function isWhatsappRemindersPhoneRequired(
  whatsappReminders: boolean,
  phone?: string | null,
): boolean {
  return whatsappReminders && !Boolean(phone?.trim());
}

/**
 * When auth hydrates a phone into an empty field, enable WhatsApp by default.
 * Never flip the toggle if the guest already typed a phone or changed it.
 */
export function resolveWhatsappRemindersAfterPhonePrefill(options: {
  previousPhone?: string | null;
  nextPhone?: string | null;
  previousWhatsappReminders: boolean;
}): boolean {
  const hadPhone = Boolean(options.previousPhone?.trim());
  const nextHasPhone = Boolean(options.nextPhone?.trim());
  if (hadPhone || !nextHasPhone) {
    return options.previousWhatsappReminders;
  }
  return resolveDefaultPublicCheckoutWhatsappReminders(options.nextPhone);
}
