/** prov-exp-6.1 — quick customer contact actions (mirrors backend util). */

export const STAFF_CONTACT_CHANNELS = ['call', 'sms', 'whatsapp'] as const;

export type StaffContactChannel = (typeof STAFF_CONTACT_CHANNELS)[number];

export function normalizeCustomerPhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

export function buildCustomerTelLink(phone: string): string | null {
  const trimmed = phone.trim();
  return trimmed ? `tel:${trimmed}` : null;
}

export function buildCustomerSmsLink(phone: string): string | null {
  const trimmed = phone.trim();
  return trimmed ? `sms:${trimmed}` : null;
}

export function buildCustomerWhatsAppLink(phone: string): string | null {
  const digits = normalizeCustomerPhoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

export function buildCustomerSmsLinkWithBody(
  phone: string,
  body: string,
): string | null {
  const base = buildCustomerSmsLink(phone);
  const trimmedBody = body.trim();
  if (!base || !trimmedBody) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}body=${encodeURIComponent(trimmedBody)}`;
}

export function buildCustomerWhatsAppLinkWithBody(
  phone: string,
  body: string,
): string | null {
  const digits = normalizeCustomerPhoneDigits(phone);
  const trimmedBody = body.trim();
  if (!digits) return null;
  if (!trimmedBody) return buildCustomerWhatsAppLink(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(trimmedBody)}`;
}

export function buildStaffContactedCustomerAnalyticsProps(
  bookingId: string,
  channel: StaffContactChannel,
): { bookingId: string; contactChannel: StaffContactChannel } {
  return {
    bookingId: bookingId.trim(),
    contactChannel: channel,
  };
}
