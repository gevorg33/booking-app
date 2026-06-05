export type SupportedLocale = 'en' | 'hy' | 'ru';

const LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-GB',
  hy: 'hy-AM',
  ru: 'ru-RU',
};

export function resolveIntlLocale(locale?: string | null): string {
  if (!locale) return 'en-GB';
  const key = locale.toLowerCase().slice(0, 2) as SupportedLocale;
  return LOCALE_MAP[key] ?? 'en-GB';
}

export function formatLocalizedDate(
  input: Date | string,
  locale?: string | null,
  timeZone = 'UTC',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(d);
}

export function formatLocalizedDateShort(
  input: Date | string,
  locale?: string | null,
  timeZone = 'UTC',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).format(d);
}

export function formatLocalizedTime(
  input: Date | string,
  locale?: string | null,
  timeZone = 'UTC',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(d);
}

export function formatLocalizedCurrency(
  amount: number,
  currency = 'USD',
  locale?: string | null,
): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getBusinessDefaultCurrency(
  settings?: Record<string, unknown>,
): string {
  const locale = settings?.locale as Record<string, unknown> | undefined;
  const fromLocale =
    typeof locale === 'object'
      ? (locale.currency as string | undefined)
      : undefined;
  const direct = settings?.defaultCurrency as string | undefined;
  return (direct || fromLocale || 'USD').toUpperCase();
}
