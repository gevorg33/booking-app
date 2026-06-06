import {
  DEFAULT_BUSINESS_DATE_FORMAT,
  type BusinessDateFormat,
} from './business-date-format.util.js';

export const BUSINESS_DATE_FORMAT_EXAMPLES: Record<BusinessDateFormat, string> = {
  'DD/MM/YYYY': '31/12/2026',
  'MM/DD/YYYY': '12/31/2026',
  'YYYY-MM-DD': '2026-12-31',
};

/** Placeholder for typed date inputs matching business format. */
export function businessDateInputPlaceholder(
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string {
  return BUSINESS_DATE_FORMAT_EXAMPLES[format];
}

function validateUtcDateParts(
  yyyy: string,
  mm: string,
  dd: string,
): Date | null {
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
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const underscore = trimmed.match(/^(\d{1,2})_(\d{1,2})_(\d{4})$/);
  if (underscore) {
    return slashPartsToUtcDate(
      underscore[1],
      underscore[2],
      underscore[3],
      'DD/MM/YYYY',
    );
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
  format: BusinessDateFormat = DEFAULT_BUSINESS_DATE_FORMAT,
): string | null {
  const parsed = parseBusinessDateInput(value, format);
  return parsed ? businessDateToKey(parsed) : null;
}
