import { t, type AppLocale } from '../i18n/messages.js';
import { getBusinessDefaultLocale } from './business-locale.util.js';
import {
  formatDateWithFormat,
  formatTimeWithFormat,
  readBusinessDateFormatSettings,
  type BusinessDateFormat,
  type BusinessTimeFormat,
} from './business-date-format.util.js';

export interface ClinicAfterVisitSummaryPdfContext {
  businessName: string;
  patientName: string;
  providerName: string | null;
  serviceName: string | null;
  visitStart: Date;
  description: string;
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
  timeZone?: string;
  locale?: AppLocale;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDescriptionHtml(description: string): string {
  return escapeHtml(description).replace(/\n/g, '<br/>');
}

function pdfLabel(locale: AppLocale, key: string): string {
  return t(locale, `pdf.clinicAfterVisitSummary.${key}`);
}

export function buildClinicAfterVisitSummaryPdfHtml(
  context: ClinicAfterVisitSummaryPdfContext,
): string {
  const locale = context.locale ?? 'en';
  const dateFormat = context.dateFormat ?? 'DD/MM/YYYY';
  const timeFormat = context.timeFormat ?? '24h';
  const timeZone = context.timeZone ?? 'UTC';
  const visitDate = formatDateWithFormat(context.visitStart, dateFormat);
  const visitTime = formatTimeWithFormat(
    context.visitStart,
    timeFormat,
    timeZone,
  );
  const provider =
    context.providerName?.trim() || pdfLabel(locale, 'defaultProvider');
  const service =
    context.serviceName?.trim() || pdfLabel(locale, 'defaultService');
  const title = pdfLabel(locale, 'title');

  return `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title><style>
    body{font-family:sans-serif;padding:24px;color:#111;line-height:1.5}
    h1{font-size:22px;margin:0 0 8px}
    .meta{color:#444;margin:0 0 20px}
    .section{margin:20px 0}
    .section h2{font-size:16px;margin:0 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    .summary{white-space:normal}
    @media print{button{display:none}}
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta"><strong>${escapeHtml(context.businessName)}</strong></p>
    <p class="meta">${escapeHtml(pdfLabel(locale, 'patientLabel'))} ${escapeHtml(context.patientName)}</p>
    <p class="meta">${escapeHtml(pdfLabel(locale, 'visitLabel'))} ${escapeHtml(visitDate)} ${escapeHtml(visitTime)}</p>
    <p class="meta">${escapeHtml(pdfLabel(locale, 'serviceLabel'))} ${escapeHtml(service)}</p>
    <p class="meta">${escapeHtml(pdfLabel(locale, 'providerLabel'))} ${escapeHtml(provider)}</p>
    <div class="section">
      <h2>${escapeHtml(pdfLabel(locale, 'summaryHeading'))}</h2>
      <div class="summary">${formatDescriptionHtml(context.description)}</div>
    </div>
    <button onclick="window.print()">${escapeHtml(pdfLabel(locale, 'printButton'))}</button>
  </body></html>`;
}

export function buildClinicAfterVisitSummaryPdfHtmlFromBusinessSettings(
  context: Omit<
    ClinicAfterVisitSummaryPdfContext,
    'dateFormat' | 'timeFormat'
  > & { businessSettings?: Record<string, unknown> },
): string {
  const formats = readBusinessDateFormatSettings(context.businessSettings);
  const locale =
    context.locale ?? getBusinessDefaultLocale(context.businessSettings);
  return buildClinicAfterVisitSummaryPdfHtml({
    ...context,
    dateFormat: formats.dateFormat,
    timeFormat: formats.timeFormat,
    locale,
  });
}
