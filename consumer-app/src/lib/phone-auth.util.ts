const NON_DIGIT = /\D/g;

export function normalizeConsumerPhone(
  value: string,
  defaultCountryCode = '374',
): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(NON_DIGIT, '')}`;
  }
  const digits = trimmed.replace(NON_DIGIT, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `+${defaultCountryCode}${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export function isValidConsumerPhone(value: string): boolean {
  const normalized = normalizeConsumerPhone(value);
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export function isValidSmsOtpCode(value: string): boolean {
  const digits = value.replace(NON_DIGIT, '');
  return digits.length >= 4 && digits.length <= 8;
}

export function sanitizeSmsOtpCode(value: string): string {
  return value.replace(NON_DIGIT, '').slice(0, 8);
}

export function phoneOtpAutocompleteToken(): string {
  return 'one-time-code';
}

export function buildPhoneAuthJwtEmail(phone: string, email?: string | null): string {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) return normalizedEmail;
  const digits = normalizeConsumerPhone(phone).replace(NON_DIGIT, '');
  return `${digits || 'unknown'}@phone.local`;
}
