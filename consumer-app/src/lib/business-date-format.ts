export type BusinessDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type BusinessTimeFormat = '24h' | '12h';

export const DEFAULT_BUSINESS_DATE_FORMAT: BusinessDateFormat = 'DD/MM/YYYY';
export const DEFAULT_BUSINESS_TIME_FORMAT: BusinessTimeFormat = '24h';

export function tenantDateFormatPreference(tenant?: {
  dateFormat?: string;
  timeFormat?: string;
} | null): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  const dateFormat =
    tenant?.dateFormat === 'MM/DD/YYYY' ||
    tenant?.dateFormat === 'YYYY-MM-DD' ||
    tenant?.dateFormat === 'DD/MM/YYYY'
      ? tenant.dateFormat
      : DEFAULT_BUSINESS_DATE_FORMAT;
  const timeFormat = tenant?.timeFormat === '12h' ? '12h' : DEFAULT_BUSINESS_TIME_FORMAT;
  return { dateFormat, timeFormat };
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

let activeDateFormat: BusinessDateFormat | undefined;
let activeTimeFormat: BusinessTimeFormat | undefined;

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
