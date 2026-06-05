export const BUSINESS_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
] as const;

export type BusinessDateFormat = (typeof BUSINESS_DATE_FORMATS)[number];

export const BUSINESS_TIME_FORMATS = ['24h', '12h'] as const;

export type BusinessTimeFormat = (typeof BUSINESS_TIME_FORMATS)[number];

export const DEFAULT_BUSINESS_DATE_FORMAT: BusinessDateFormat = 'DD/MM/YYYY';
export const DEFAULT_BUSINESS_TIME_FORMAT: BusinessTimeFormat = '24h';

const DATE_FORMAT_SET = new Set<string>(BUSINESS_DATE_FORMATS);
const TIME_FORMAT_SET = new Set<string>(BUSINESS_TIME_FORMATS);

export function normalizeBusinessDateFormat(
  value: string | null | undefined,
): BusinessDateFormat | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return DATE_FORMAT_SET.has(trimmed) ? (trimmed as BusinessDateFormat) : null;
}

export function normalizeBusinessTimeFormat(
  value: string | null | undefined,
): BusinessTimeFormat | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return TIME_FORMAT_SET.has(trimmed) ? (trimmed as BusinessTimeFormat) : null;
}

export function getBusinessDateFormat(
  settings?: Record<string, unknown>,
): BusinessDateFormat {
  return (
    normalizeBusinessDateFormat(settings?.dateFormat as string | undefined) ??
    DEFAULT_BUSINESS_DATE_FORMAT
  );
}

export function getBusinessTimeFormat(
  settings?: Record<string, unknown>,
): BusinessTimeFormat {
  return (
    normalizeBusinessTimeFormat(settings?.timeFormat as string | undefined) ??
    DEFAULT_BUSINESS_TIME_FORMAT
  );
}

export function readBusinessDateFormatSettings(
  settings?: Record<string, unknown>,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return {
    dateFormat: getBusinessDateFormat(settings),
    timeFormat: getBusinessTimeFormat(settings),
  };
}

/** Format YYYY-MM-DD calendar key with a business date format. */
export function formatDateKeyWithFormat(
  dateKey: string,
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string {
  const [yyyy, mm, dd] = dateKey.split('-');
  if (!yyyy || !mm || !dd) return dateKey;
  switch (format) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD':
      return dateKey;
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

/** Format a UTC calendar date with a business date format. */
export function formatDateWithFormat(
  input: Date,
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string {
  const dd = String(input.getUTCDate()).padStart(2, '0');
  const mm = String(input.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(input.getUTCFullYear());
  return formatDateKeyWithFormat(`${yyyy}-${mm}-${dd}`, format);
}

/** Format time using business 24h or 12h preference. */
export function formatTimeWithFormat(
  input: Date,
  format: BusinessTimeFormat = DEFAULT_BUSINESS_TIME_FORMAT,
  timeZone = 'UTC',
): string {
  if (Number.isNaN(input.getTime())) return '';
  if (format === '12h') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(input);
  }
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(input);
}
