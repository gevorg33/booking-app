import { inferDefaultPhoneCountryCode } from '../../common/utils/phone-country.util.js';

const TIMEZONE_ISO: Record<string, string> = {
  'Asia/Yerevan': 'AM',
  'Asia/Tbilisi': 'GE',
  'Asia/Dubai': 'AE',
  'Asia/Muscat': 'OM',
  'Europe/Moscow': 'RU',
  'Europe/London': 'GB',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
};

const DIAL_CODE_ISO: Record<string, string> = {
  '374': 'AM',
  '995': 'GE',
  '971': 'AE',
  '968': 'OM',
  '1': 'US',
  '7': 'RU',
  '44': 'GB',
};

function readExplicitCountry(settings?: Record<string, unknown>): string | null {
  if (!settings) return null;
  const candidates = [settings.stripeConnectCountry, settings.country];
  for (const value of candidates) {
    if (typeof value === 'string' && /^[A-Za-z]{2}$/.test(value.trim())) {
      return value.trim().toUpperCase();
    }
  }
  return null;
}

/** ISO 3166-1 alpha-2 country for a tenant's Stripe Connect account. */
export function resolveStripeConnectCountry(
  business: { settings?: Record<string, unknown>; timezone: string },
  platformDefault: string,
): string {
  const explicit = readExplicitCountry(business.settings);
  if (explicit) return explicit;

  const fromTimezone = business.timezone ? TIMEZONE_ISO[business.timezone] : undefined;
  if (fromTimezone) return fromTimezone;

  const platform = platformDefault.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(platform)) return platform;

  const dialCode = inferDefaultPhoneCountryCode(business.settings, business.timezone);
  const fromDial = DIAL_CODE_ISO[dialCode];
  if (fromDial) return fromDial;

  return 'US';
}
