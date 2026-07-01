/** prov-exp-6.1 — quick customer contact actions on provider booking detail. */

export const STAFF_CONTACT_CHANNELS = ['call', 'sms', 'whatsapp'] as const;

export type StaffContactChannel = (typeof STAFF_CONTACT_CHANNELS)[number];

export interface ProviderCustomerContactView {
  phone: string | null;
  callEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}

export interface BuildProviderCustomerContactInput {
  customerPhone?: string | null;
  whatsappEnabledSetting: boolean;
  whatsappConfigured: boolean;
}

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

/** Opens WhatsApp chat with the customer — no prefilled body (prov-exp-6.2 adds templates). */
export function buildCustomerWhatsAppLink(phone: string): string | null {
  const digits = normalizeCustomerPhoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

export function isStaffContactChannel(
  value: string,
): value is StaffContactChannel {
  return (STAFF_CONTACT_CHANNELS as readonly string[]).includes(value);
}

export function buildStaffContactedCustomerAnalyticsProps(
  bookingId: string,
  channel: StaffContactChannel,
  templateId?: string | null,
): {
  bookingId: string;
  contactChannel: StaffContactChannel;
  templateId?: string;
} {
  const payload: {
    bookingId: string;
    contactChannel: StaffContactChannel;
    templateId?: string;
  } = {
    bookingId: bookingId.trim(),
    contactChannel: channel,
  };
  const trimmedTemplateId = templateId?.trim();
  if (trimmedTemplateId) payload.templateId = trimmedTemplateId;
  return payload;
}

export function buildProviderCustomerContactView(
  input: BuildProviderCustomerContactInput,
): ProviderCustomerContactView | null {
  const phone = input.customerPhone?.trim() || null;
  if (!phone) return null;

  const whatsappEnabled =
    input.whatsappEnabledSetting && input.whatsappConfigured;

  return {
    phone,
    callEnabled: true,
    smsEnabled: true,
    whatsappEnabled,
  };
}
