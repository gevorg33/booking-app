const LOCALE_DIAL_CODES: Record<string, string> = {
  hy: '374',
  ru: '7',
  en: '374',
};

const TIMEZONE_DIAL_CODES: Record<string, string> = {
  'Asia/Yerevan': '374',
  'Asia/Tbilisi': '995',
  'Europe/Moscow': '7',
  'Europe/London': '44',
  'America/New_York': '1',
  'America/Los_Angeles': '1',
};

/** Default dial code for public booking country pre-selection (not for local-number guessing). */
export function inferDefaultPhoneCountryCode(
  settings?: Record<string, unknown>,
  timezone?: string,
): string {
  if (timezone && TIMEZONE_DIAL_CODES[timezone]) {
    return TIMEZONE_DIAL_CODES[timezone];
  }
  const locale = typeof settings?.locale === 'string' ? settings.locale : 'en';
  return LOCALE_DIAL_CODES[locale] || '374';
}

/** E.164 digits only — numbers must already include country code. */
export function normalizeE164Phone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  return digits;
}

/** Store phones as E.164 with leading + (e.g. +37491234567). */
export function normalizeStoredPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return trimmed.startsWith('+') ? `+${digits}` : `+${digits}`;
}

/** Compare phones by digits only. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
