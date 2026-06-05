export type BusinessDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type BusinessTimeFormat = '24h' | '12h';

export const DEFAULT_BUSINESS_DATE_FORMAT: BusinessDateFormat = 'DD/MM/YYYY';
export const DEFAULT_BUSINESS_TIME_FORMAT: BusinessTimeFormat = '24h';

export function normalizeBusinessDateFormat(
  value: string | null | undefined,
): BusinessDateFormat | null {
  if (value === 'DD/MM/YYYY' || value === 'MM/DD/YYYY' || value === 'YYYY-MM-DD') {
    return value;
  }
  return null;
}

export function normalizeBusinessTimeFormat(
  value: string | null | undefined,
): BusinessTimeFormat | null {
  if (value === '24h' || value === '12h') return value;
  return null;
}

export function formatDateWithFormat(input: Date, format: BusinessDateFormat): string {
  const dd = String(input.getUTCDate()).padStart(2, '0');
  const mm = String(input.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(input.getUTCFullYear());
  if (format === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}/${mm}/${yyyy}`;
}

export function formatTimeWithFormat(
  input: Date,
  format: BusinessTimeFormat,
  timeZone = 'UTC',
): string {
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

export interface BusinessDateFormatPreference {
  dateFormat?: string | null;
  timeFormat?: string | null;
}

export function readAuthBusinessDateFormats(
  business?: BusinessDateFormatPreference | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return {
    dateFormat:
      normalizeBusinessDateFormat(business?.dateFormat ?? undefined) ??
      DEFAULT_BUSINESS_DATE_FORMAT,
    timeFormat:
      normalizeBusinessTimeFormat(business?.timeFormat ?? undefined) ??
      DEFAULT_BUSINESS_TIME_FORMAT,
  };
}

export const BUSINESS_DATE_FORMAT_EXAMPLES: Record<BusinessDateFormat, string> = {
  'DD/MM/YYYY': '31/12/2026',
  'MM/DD/YYYY': '12/31/2026',
  'YYYY-MM-DD': '2026-12-31',
};

export function businessDateInputPlaceholder(
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string {
  return BUSINESS_DATE_FORMAT_EXAMPLES[format];
}

export function businessDateFormatPattern(
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): BusinessDateFormat {
  return format;
}

function validateUtcDateParts(yyyy: string, mm: string, dd: string): Date | null {
  const y = Number.parseInt(yyyy, 10);
  const m = Number.parseInt(mm, 10);
  const d = Number.parseInt(dd, 10);
  if (!Number.isFinite(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(`${yyyy}-${mm}-${dd}T12:00:00.000Z`);
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() + 1 !== m ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

function slashPartsToUtcDate(
  partA: string,
  partB: string,
  yyyy: string,
  format: BusinessDateFormat,
): Date | null {
  const a = partA.padStart(2, '0');
  const b = partB.padStart(2, '0');
  if (format === 'MM/DD/YYYY') {
    return validateUtcDateParts(yyyy, a, b);
  }
  return validateUtcDateParts(yyyy, b, a);
}

export function parseBusinessDateInput(
  value: string,
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const underscore = trimmed.match(/^(\d{1,2})_(\d{1,2})_(\d{4})$/);
  if (underscore) {
    return slashPartsToUtcDate(underscore[1], underscore[2], underscore[3], 'DD/MM/YYYY');
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return slashPartsToUtcDate(slash[1], slash[2], slash[3], format);
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return validateUtcDateParts(iso[1], iso[2], iso[3]);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function businessDateToKey(input: Date): string {
  const yyyy = String(input.getUTCFullYear());
  const mm = String(input.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(input.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseBusinessDateToKey(
  value: string,
  format?: BusinessDateFormat,
): string | null {
  const resolved = format ?? DEFAULT_BUSINESS_DATE_FORMAT;
  const parsed = parseBusinessDateInput(value, resolved);
  return parsed ? businessDateToKey(parsed) : null;
}
