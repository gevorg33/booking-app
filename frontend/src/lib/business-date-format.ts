/** Business date/time display preferences (mirrors backend). */
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

export function readBusinessDateFormat(
  settings?: Record<string, unknown> | null,
): BusinessDateFormat {
  return (
    normalizeBusinessDateFormat(settings?.dateFormat as string | undefined) ??
    DEFAULT_BUSINESS_DATE_FORMAT
  );
}

export function readBusinessTimeFormat(
  settings?: Record<string, unknown> | null,
): BusinessTimeFormat {
  return (
    normalizeBusinessTimeFormat(settings?.timeFormat as string | undefined) ??
    DEFAULT_BUSINESS_TIME_FORMAT
  );
}

export function readBusinessDateFormatSettings(
  settings?: Record<string, unknown> | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return {
    dateFormat: readBusinessDateFormat(settings),
    timeFormat: readBusinessTimeFormat(settings),
  };
}

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

export function formatDateWithFormat(
  input: Date,
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string {
  const dd = String(input.getUTCDate()).padStart(2, '0');
  const mm = String(input.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(input.getUTCFullYear());
  return formatDateKeyWithFormat(`${yyyy}-${mm}-${dd}`, format);
}

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

export interface BusinessDateFormatPreference {
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
}

export function tenantDateFormatPreference(
  tenant?: BusinessDateFormatPreference | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return {
    dateFormat:
      normalizeBusinessDateFormat(tenant?.dateFormat) ?? DEFAULT_BUSINESS_DATE_FORMAT,
    timeFormat:
      normalizeBusinessTimeFormat(tenant?.timeFormat) ?? DEFAULT_BUSINESS_TIME_FORMAT,
  };
}

/** Read normalized formats from auth business summary (dashboard / provider login). */
export function readAuthBusinessDateFormats(
  business?: BusinessDateFormatPreference | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return tenantDateFormatPreference(business);
}

/** Prefer explicit formats (public tenant) over auth business summary (dashboard). */
export function resolveBootstrapDateFormatPreference(input: {
  business?: BusinessDateFormatPreference | null;
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
}): BusinessDateFormatPreference | null | undefined {
  if (input.dateFormat !== undefined || input.timeFormat !== undefined) {
    return { dateFormat: input.dateFormat, timeFormat: input.timeFormat };
  }
  return input.business;
}

/** Hydrate module cache from active auth business — used by dashboard layout bootstrap. */
export function bootstrapAuthBusinessDateFormats(
  business?: BusinessDateFormatPreference | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  const formats = readAuthBusinessDateFormats(business);
  setActiveBusinessDateFormats(formats.dateFormat, formats.timeFormat);
  return formats;
}

let activeDateFormat: BusinessDateFormat | undefined;
let activeTimeFormat: BusinessTimeFormat | undefined;

/** Cache active tenant formats for dashboard/provider formatting helpers. */
export function setActiveBusinessDateFormats(
  dateFormat?: BusinessDateFormat,
  timeFormat?: BusinessTimeFormat,
): void {
  activeDateFormat = dateFormat;
  activeTimeFormat = timeFormat;
}

export function getActiveBusinessDateFormats(): {
  dateFormat: BusinessDateFormat;
  timeFormat: BusinessTimeFormat;
} {
  return {
    dateFormat: activeDateFormat ?? DEFAULT_BUSINESS_DATE_FORMAT,
    timeFormat: activeTimeFormat ?? DEFAULT_BUSINESS_TIME_FORMAT,
  };
}

export const BUSINESS_DATE_FORMAT_EXAMPLES: Record<BusinessDateFormat, string> = {
  'DD/MM/YYYY': '31/12/2026',
  'MM/DD/YYYY': '12/31/2026',
  'YYYY-MM-DD': '2026-12-31',
};

/** Placeholder for typed date inputs matching active or explicit business format. */
export function businessDateInputPlaceholder(
  format?: BusinessDateFormat,
): string {
  const resolved = format ?? getActiveBusinessDateFormats().dateFormat;
  return BUSINESS_DATE_FORMAT_EXAMPLES[resolved];
}

/** Pattern label shown under date inputs, e.g. DD/MM/YYYY. */
export function businessDateFormatPattern(
  format?: BusinessDateFormat,
): BusinessDateFormat {
  return format ?? getActiveBusinessDateFormats().dateFormat;
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

/** Parse user-typed dates according to business dateFormat (ISO always accepted). */
export function parseBusinessDateInput(
  value: string,
  format: BusinessDateFormat = getActiveBusinessDateFormats().dateFormat,
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

/** Normalize typed user input to YYYY-MM-DD for APIs and date pickers. */
export function parseBusinessDateToKey(
  value: string,
  format?: BusinessDateFormat,
): string | null {
  const resolved = format ?? getActiveBusinessDateFormats().dateFormat;
  const parsed = parseBusinessDateInput(value, resolved);
  return parsed ? businessDateToKey(parsed) : null;
}
