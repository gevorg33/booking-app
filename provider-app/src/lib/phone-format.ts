import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type Country,
} from 'react-phone-number-input';

const PREFERRED_COUNTRY_BY_CALLING_CODE: Partial<Record<string, Country>> = {
  '374': 'AM',
  '995': 'GE',
  '7': 'RU',
  '1': 'US',
  '44': 'GB',
};

export function defaultCountryFromCallingCode(callingCode?: string): Country {
  const target = (callingCode || '374').replace(/\D/g, '');
  const preferred = PREFERRED_COUNTRY_BY_CALLING_CODE[target];
  const matches = getCountries().filter((country) => getCountryCallingCode(country) === target);
  if (preferred && matches.includes(preferred)) return preferred;
  return matches[0] || 'AM';
}

export function isValidPhone(value?: string): boolean {
  if (!value?.trim()) return false;
  return isValidPhoneNumber(value);
}

export function formatPhoneForApi(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
