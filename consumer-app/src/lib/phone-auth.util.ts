export function phoneOtpAutocompleteToken(): string {
  return 'one-time-code';
}

export function isValidConsumerPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8;
}

export function normalizeConsumerPhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return trimmed.replace(/\D/g, '');
}

export function sanitizeSmsOtpCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}
