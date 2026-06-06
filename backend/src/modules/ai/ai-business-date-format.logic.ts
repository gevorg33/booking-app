import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  BUSINESS_DATE_FORMATS,
  BUSINESS_TIME_FORMATS,
  formatDateKeyWithFormat,
  formatTimeWithFormat,
  readBusinessDateFormatSettings,
  type BusinessDateFormat,
  type BusinessTimeFormat,
} from '../../common/utils/business-date-format.util.js';
import {
  BUSINESS_DATE_FORMAT_EXAMPLES,
  businessDateInputPlaceholder,
  parseBusinessDateToKey,
} from '../../common/utils/business-date-input.util.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  getTodayDateKey,
} from '../../common/utils/date-format.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import {
  formatNotificationDateDisplay,
  formatNotificationExpiresLabel,
  formatNotificationTimeRangeDisplay,
  formatResultReadyNotificationWhen,
} from '../../common/utils/notification-date-format.util.js';
import {
  DASHBOARD_DATE_MIGRATION_STEPS,
  DASHBOARD_DATE_SURFACE_AUDIT_CATALOG,
  DASHBOARD_DATE_SURFACE_DEFERRED,
  DASHBOARD_DATE_SURFACE_MIGRATED,
  type DashboardDateMigrationStep,
} from './ai-dashboard-date-surface-audit.fixtures.js';
import {
  dateFormatLabel,
  extractMigrationSurfaceId,
  parseBusinessDateFormatFromPrompt,
  timeFormatLabel,
} from './ai-business-date-format.util.js';
import { parseDateStringsFromPrompt } from './ai-date-input-format.util.js';
import {
  parseNotificationMessageKind,
  parsePatientResultReadyParams,
  type NotificationMessageKind,
} from './ai-notification-date-format.util.js';

export interface BusinessDateFormatLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
}

const SAMPLE_TIME_ISO = '14:30:00.000Z';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function buildFormatExamples(todayKey: string): Record<BusinessDateFormat, string> {
  return {
    'DD/MM/YYYY': formatDateKeyWithFormat(todayKey, 'DD/MM/YYYY'),
    'MM/DD/YYYY': formatDateKeyWithFormat(todayKey, 'MM/DD/YYYY'),
    'YYYY-MM-DD': formatDateKeyWithFormat(todayKey, 'YYYY-MM-DD'),
  };
}

export async function handleConfigureBusinessDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('configure_business_date_format', 'Business not found.');
  }

  const parsed = parseBusinessDateFormatFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed?.dateFormat && !parsed?.timeFormat) {
    return failure(
      'configure_business_date_format',
      'Specify a date or time format to use (e.g. "Use US date format" or "Switch to 12-hour time").',
      { clarify: true, missing: ['dateFormat', 'timeFormat'] },
    );
  }

  const current = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const nextDateFormat = parsed.dateFormat ?? current.dateFormat;
  const nextTimeFormat = parsed.timeFormat ?? current.timeFormat;

  if (
    nextDateFormat === current.dateFormat &&
    nextTimeFormat === current.timeFormat
  ) {
    return success(
      'configure_business_date_format',
      `Business date/time format is already ${dateFormatLabel(current.dateFormat)} with ${timeFormatLabel(current.timeFormat)}.`,
      {
        dateFormat: current.dateFormat,
        timeFormat: current.timeFormat,
        unchanged: true,
      },
    );
  }

  const patch: Record<string, unknown> = {};
  if (parsed.dateFormat) patch.dateFormat = parsed.dateFormat;
  if (parsed.timeFormat) patch.timeFormat = parsed.timeFormat;

  business.settings = mergeBusinessSettings(
    business.settings as Record<string, unknown> | undefined,
    patch,
  );
  await deps.businessRepo.save(business);

  const changes: string[] = [];
  if (parsed.dateFormat && parsed.dateFormat !== current.dateFormat) {
    changes.push(
      `date format ${dateFormatLabel(current.dateFormat)} → ${dateFormatLabel(parsed.dateFormat)}`,
    );
  }
  if (parsed.timeFormat && parsed.timeFormat !== current.timeFormat) {
    changes.push(
      `time format ${timeFormatLabel(current.timeFormat)} → ${timeFormatLabel(parsed.timeFormat)}`,
    );
  }

  return success(
    'configure_business_date_format',
    `Updated business date/time settings: ${changes.join('; ')}.`,
    {
      dateFormat: nextDateFormat,
      timeFormat: nextTimeFormat,
      previousDateFormat: current.dateFormat,
      previousTimeFormat: current.timeFormat,
    },
  );
}

export async function handleExplainBusinessDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_business_date_format', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const displayOptions = { dateFormat, timeFormat, timeZone };
  const examples = buildFormatExamples(todayKey);

  const exampleLines = BUSINESS_DATE_FORMATS.map(
    (format) => `${dateFormatLabel(format)}: ${examples[format]}`,
  ).join('; ');

  const summary = [
    `Business date format is ${dateFormatLabel(dateFormat)} and time format is ${timeFormatLabel(timeFormat)}.`,
    `Today (${todayKey}) displays as ${formatDateDisplay(todayKey, undefined, displayOptions)}.`,
    `A sample booking time displays as ${formatTimeDisplay(sampleInstant, displayOptions)}.`,
    `Examples for today — ${exampleLines}.`,
  ].join(' ');

  return success('explain_business_date_format', summary, {
    dateFormat,
    timeFormat,
    todayKey,
    todayDisplay: formatDateDisplay(todayKey, undefined, displayOptions),
    sampleTimeDisplay: formatTimeDisplay(sampleInstant, displayOptions),
    examplesByFormat: examples,
  });
}

export async function handleExplainBookingDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_booking_date_format', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const displayOptions = { dateFormat, timeFormat, timeZone };
  const examples = buildFormatExamples(todayKey);
  const todayDisplay = formatDateDisplay(todayKey, undefined, displayOptions);
  const sampleTimeDisplay = formatTimeDisplay(sampleInstant, displayOptions);

  const contrastNote =
    dateFormat === 'MM/DD/YYYY'
      ? 'European DD/MM/YYYY is not used on this page unless the salon changes settings.'
      : dateFormat === 'DD/MM/YYYY'
        ? 'US MM/DD/YYYY is not used on this page unless the salon changes settings.'
        : 'Slash-separated DD/MM or MM/DD orders are not used unless the salon changes settings.';

  const summary = [
    `This booking page shows dates in ${dateFormatLabel(dateFormat)} because the salon configured that format in dashboard settings — not your browser locale.`,
    `Today displays as ${todayDisplay}; booking times use ${timeFormatLabel(timeFormat)} (sample: ${sampleTimeDisplay}).`,
    contrastNote,
    `For comparison today — European (DD/MM/YYYY): ${examples['DD/MM/YYYY']}; US (MM/DD/YYYY): ${examples['MM/DD/YYYY']}; ISO (YYYY-MM-DD): ${examples['YYYY-MM-DD']}.`,
  ].join(' ');

  return success('explain_booking_date_format', summary, {
    dateFormat,
    timeFormat,
    todayKey,
    todayDisplay,
    sampleTimeDisplay,
    examplesByFormat: examples,
  });
}

function buildPreviewVariants(
  currentDateFormat: BusinessDateFormat,
  currentTimeFormat: BusinessTimeFormat,
  parsed: ReturnType<typeof parseBusinessDateFormatFromPrompt>,
): Array<{ dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat }> {
  if (parsed?.dateFormat || parsed?.timeFormat) {
    return [
      {
        dateFormat: parsed.dateFormat ?? currentDateFormat,
        timeFormat: parsed.timeFormat ?? currentTimeFormat,
      },
    ];
  }

  const variants: Array<{
    dateFormat: BusinessDateFormat;
    timeFormat: BusinessTimeFormat;
  }> = [];
  for (const dateFormat of BUSINESS_DATE_FORMATS) {
    if (dateFormat === currentDateFormat) continue;
    variants.push({ dateFormat, timeFormat: currentTimeFormat });
  }
  for (const timeFormat of BUSINESS_TIME_FORMATS) {
    if (timeFormat === currentTimeFormat) continue;
    variants.push({ dateFormat: currentDateFormat, timeFormat });
  }
  return variants;
}

export async function handlePreviewBusinessDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('preview_business_date_format', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const current = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const parsed = parseBusinessDateFormatFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  const variants = buildPreviewVariants(
    current.dateFormat,
    current.timeFormat,
    parsed,
  );

  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const currentDisplay = {
    date: formatDateDisplay(todayKey, undefined, {
      dateFormat: current.dateFormat,
      timeFormat: current.timeFormat,
      timeZone,
    }),
    time: formatTimeDisplay(sampleInstant, {
      dateFormat: current.dateFormat,
      timeFormat: current.timeFormat,
      timeZone,
    }),
  };

  const alternateLines = variants.map((variant) => {
    const display = {
      date: formatDateDisplay(todayKey, undefined, {
        dateFormat: variant.dateFormat,
        timeFormat: variant.timeFormat,
        timeZone,
      }),
      time: formatTimeDisplay(sampleInstant, {
        dateFormat: variant.dateFormat,
        timeFormat: variant.timeFormat,
        timeZone,
      }),
    };
    return `${dateFormatLabel(variant.dateFormat)} + ${timeFormatLabel(variant.timeFormat)}: ${display.date} · ${display.time}`;
  });

  const summary = [
    `Current settings (${dateFormatLabel(current.dateFormat)}, ${timeFormatLabel(current.timeFormat)}): sample booking on ${todayKey} displays as ${currentDisplay.date} · ${currentDisplay.time}.`,
    variants.length > 0
      ? `Alternate preview — ${alternateLines.join('; ')}.`
      : 'No alternate formats to preview.',
    'This is a read-only preview — use configure_business_date_format to save changes.',
  ].join(' ');

  return success('preview_business_date_format', summary, {
    currentDateFormat: current.dateFormat,
    currentTimeFormat: current.timeFormat,
    todayKey,
    currentDisplay,
    alternatePreviews: variants.map((variant) => ({
      dateFormat: variant.dateFormat,
      timeFormat: variant.timeFormat,
      dateDisplay: formatDateDisplay(todayKey, undefined, {
        dateFormat: variant.dateFormat,
        timeFormat: variant.timeFormat,
        timeZone,
      }),
      timeDisplay: formatTimeDisplay(sampleInstant, {
        dateFormat: variant.dateFormat,
        timeFormat: variant.timeFormat,
        timeZone,
      }),
    })),
  });
}

export async function handleAuditDashboardDateSurfacesLogic(
  _deps: BusinessDateFormatLogicDeps,
  _businessId: string,
): Promise<CommandResult> {
  const migratedCount = DASHBOARD_DATE_SURFACE_MIGRATED.length;
  const deferredCount = DASHBOARD_DATE_SURFACE_DEFERRED.length;
  const localeFallback = DASHBOARD_DATE_SURFACE_DEFERRED.filter(
    (entry) => entry.status === 'locale_fallback',
  );
  const intlHelpers = DASHBOARD_DATE_SURFACE_DEFERRED.filter(
    (entry) => entry.status === 'intl_helper',
  );

  const deferredLines = DASHBOARD_DATE_SURFACE_DEFERRED.map(
    (entry) =>
      `${entry.page} / ${entry.component} (${entry.mechanism})`,
  ).join('; ');

  const summary = [
    `Dashboard date-format audit (fmt-1.6): ${migratedCount} surfaces use business format cache; ${deferredCount} remain on locale/Intl (${localeFallback.length} toLocaleString/locale fallback, ${intlHelpers.length} Intl calendar helpers).`,
    deferredCount > 0
      ? `Deferred sweep targets — ${deferredLines}.`
      : 'All tracked dashboard surfaces use business format cache.',
    'Use migrate_dashboard_date_display for the guided replacement sweep.',
  ].join(' ');

  return success('audit_dashboard_date_surfaces', summary, {
    migratedCount,
    deferredCount,
    migratedSurfaces: DASHBOARD_DATE_SURFACE_MIGRATED,
    deferredSurfaces: DASHBOARD_DATE_SURFACE_DEFERRED,
    catalog: DASHBOARD_DATE_SURFACE_AUDIT_CATALOG,
  });
}

function resolveMigrationSteps(
  surfaceId?: string | null,
): DashboardDateMigrationStep[] {
  const steps = DASHBOARD_DATE_MIGRATION_STEPS;
  if (!surfaceId) return steps;
  return steps.filter((step) => step.surfaceId === surfaceId);
}

export async function handleMigrateDashboardDateDisplayLogic(
  _deps: BusinessDateFormatLogicDeps,
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const surfaceId =
    (typeof params.surfaceId === 'string' ? params.surfaceId : null) ??
    extractMigrationSurfaceId(String(prompt ?? params._prompt ?? ''));
  const steps = resolveMigrationSteps(surfaceId);

  if (steps.length === 0) {
    return failure(
      'migrate_dashboard_date_display',
      surfaceId
        ? `No deferred migration step matches surface "${surfaceId}".`
        : 'No deferred dashboard date-display surfaces to migrate.',
      { surfaceId, clarify: true },
    );
  }

  const stepLines = steps.map(
    (step) =>
      `Step ${step.order}: ${step.page} (${step.path}) — replace ${step.beforeExample} with ${step.afterExample}. ${step.replacement}`,
  );

  if (!confirmed) {
    const summary = [
      `Guided fmt-1.7 migration sweep for ${steps.length} deferred surface(s): ${steps.map((step) => step.page).join(', ')}.`,
      stepLines.join(' '),
      'Confirm below to acknowledge the sweep checklist.',
    ].join(' ');

    return success('migrate_dashboard_date_display', summary, {
      requiresExecutionConfirmation: true,
      confirmationPrompt: String(prompt ?? params._prompt ?? ''),
      interpretedAction: 'migrate_dashboard_date_display',
      surfaceId,
      surfaceCount: steps.length,
      migrationSteps: steps,
      previewOnly: true,
    });
  }

  const summary = [
    `Migration sweep acknowledged for ${steps.length} deferred dashboard date-display surface(s).`,
    stepLines.join(' '),
    'Apply each replacement in the listed frontend files, then re-run audit_dashboard_date_surfaces to verify.',
  ].join(' ');

  return success('migrate_dashboard_date_display', summary, {
    surfaceId,
    surfaceCount: steps.length,
    migrationSteps: steps,
    sweepAcknowledged: true,
  });
}

const SAMPLE_SERVICE_NAME = 'Sample Haircut';
const SAMPLE_GIFT_CARD_EXPIRY = '2027-06-01';

function resolveNotificationMessageKind(
  params: Record<string, unknown>,
  prompt?: string,
): NotificationMessageKind {
  const fromParams = params.messageKind;
  if (
    fromParams === 'confirmation' ||
    fromParams === 'reminder' ||
    fromParams === 'gift_card' ||
    fromParams === 'cancellation'
  ) {
    return fromParams;
  }
  return parseNotificationMessageKind(String(prompt ?? params._prompt ?? ''));
}

function buildNotificationSampleLines(
  messageKind: NotificationMessageKind,
  settings: Record<string, unknown> | undefined,
  locale: string,
  todayKey: string,
  sampleInstant: Date,
  endInstant: Date,
): { emailLine: string; whatsappLine: string } {
  const dateLabel = formatNotificationDateDisplay(todayKey, settings, locale);
  const timeLabel = formatNotificationTimeRangeDisplay(
    sampleInstant,
    endInstant,
    settings,
    locale,
  );

  switch (messageKind) {
    case 'gift_card': {
      const expiryLabel = formatNotificationExpiresLabel(
        SAMPLE_GIFT_CARD_EXPIRY,
        settings,
        locale,
      );
      return {
        emailLine: `Your gift card expires on ${expiryLabel}.`,
        whatsappLine: `Gift card reminder — expires ${expiryLabel}.`,
      };
    }
    case 'cancellation':
      return {
        emailLine: `Your ${SAMPLE_SERVICE_NAME} appointment on ${dateLabel} at ${timeLabel} was cancelled.`,
        whatsappLine: `Booking cancelled — ${SAMPLE_SERVICE_NAME} on ${dateLabel} ${timeLabel}.`,
      };
    case 'reminder':
      return {
        emailLine: `Reminder: your ${SAMPLE_SERVICE_NAME} appointment is on ${dateLabel} at ${timeLabel}.`,
        whatsappLine: `Reminder — ${SAMPLE_SERVICE_NAME} on ${dateLabel} ${timeLabel}.`,
      };
    default:
      return {
        emailLine: `Your ${SAMPLE_SERVICE_NAME} appointment is confirmed for ${dateLabel} at ${timeLabel}.`,
        whatsappLine: `Booking confirmed — ${SAMPLE_SERVICE_NAME} on ${dateLabel} ${timeLabel}.`,
      };
  }
}

export async function handleExplainNotificationDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_notification_date_format', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const settings = business.settings as Record<string, unknown> | undefined;
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const endInstant = new Date(sampleInstant.getTime() + 60 * 60 * 1000);
  const locale = 'en';

  const dateLabel = formatNotificationDateDisplay(todayKey, settings, locale);
  const timeLabel = formatNotificationTimeRangeDisplay(
    sampleInstant,
    endInstant,
    settings,
    locale,
  );
  const dashboardDate = formatDateDisplay(todayKey, undefined, {
    dateFormat,
    timeFormat,
    timeZone,
  });
  const dashboardTime = formatTimeDisplay(sampleInstant, {
    dateFormat,
    timeFormat,
    timeZone,
  });

  const summary = [
    `Booking confirmation emails, appointment reminders, WhatsApp/SMS, and gift-card messages use the salon business dateFormat (${dateFormatLabel(dateFormat)}) and timeFormat (${timeFormatLabel(timeFormat)}) via formatNotificationDateDisplay — the same settings that drive dashboard display.`,
    `They do not use the browser locale; both channels read dateFormat/timeFormat from business settings.`,
    `Sample appointment on ${todayKey}: notification date ${dateLabel}, time ${timeLabel}; dashboard shows ${dashboardDate} · ${dashboardTime}.`,
    'Gift-card expiry lines use the same business dateFormat.',
  ].join(' ');

  return success('explain_notification_date_format', summary, {
    dateFormat,
    timeFormat,
    todayKey,
    notificationDateLabel: dateLabel,
    notificationTimeLabel: timeLabel,
    dashboardDateDisplay: dashboardDate,
    dashboardTimeDisplay: dashboardTime,
    usesBusinessSettings: true,
    channels: ['email', 'whatsapp', 'sms'],
  });
}

export async function handlePreviewNotificationDatetimeLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('preview_notification_datetime', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const settings = business.settings as Record<string, unknown> | undefined;
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  const messageKind = resolveNotificationMessageKind(params, prompt);
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const endInstant = new Date(sampleInstant.getTime() + 60 * 60 * 1000);
  const locale = 'en';
  const samples = buildNotificationSampleLines(
    messageKind,
    settings,
    locale,
    todayKey,
    sampleInstant,
    endInstant,
  );

  const summary = [
    `Sample ${messageKind.replace('_', ' ')} notification (${dateFormatLabel(dateFormat)}, ${timeFormatLabel(timeFormat)}):`,
    `Email — ${samples.emailLine}`,
    `WhatsApp — ${samples.whatsappLine}`,
    'Read-only preview using current business settings.',
  ].join(' ');

  return success('preview_notification_datetime', summary, {
    messageKind,
    dateFormat,
    timeFormat,
    todayKey,
    emailSample: samples.emailLine,
    whatsappSample: samples.whatsappLine,
  });
}

function readBusinessType(
  settings: Record<string, unknown> | undefined,
): string | undefined {
  const value = settings?.businessType;
  return typeof value === 'string' ? value : undefined;
}

export async function handleNotifyPatientResultReadyLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('notify_patient_result_ready', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType = readBusinessType(settings);
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'notify_patient_result_ready',
      'Result-ready notifications are only available for clinic vertical businesses (vert-clinic-1.7).',
      { businessType, clinicOnly: true },
    );
  }

  const timeZone = business.timezone ?? 'UTC';
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  const parsedParams = parsePatientResultReadyParams(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  const todayKey = getTodayDateKey(timeZone);
  const completedAt = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const locale = 'en';
  const whenLabel = formatResultReadyNotificationWhen(
    completedAt,
    settings,
    locale,
  );
  const patientLabel =
    typeof parsedParams.customerName === 'string'
      ? parsedParams.customerName
      : 'the patient';
  const emailLine = `Your test results are ready (completed ${whenLabel}).`;
  const whatsappLine = `Results ready — completed ${whenLabel}.`;

  if (!confirmed) {
    const summary = [
      `Ready to notify ${patientLabel} that results are ready (vert-clinic-1.7).`,
      `Email — ${emailLine}`,
      `WhatsApp — ${whatsappLine}`,
      `Date label uses formatResultReadyNotificationWhen (${dateFormatLabel(dateFormat)}, ${timeFormatLabel(timeFormat)}).`,
      'Confirm below to send the result-ready notification.',
    ].join(' ');

    return success('notify_patient_result_ready', summary, {
      requiresExecutionConfirmation: true,
      confirmationPrompt: String(prompt ?? params._prompt ?? ''),
      interpretedAction: 'notify_patient_result_ready',
      previewOnly: true,
      completedAt: completedAt.toISOString(),
      whenLabel,
      emailSample: emailLine,
      whatsappSample: whatsappLine,
      ...parsedParams,
    });
  }

  const summary = [
    `Result-ready notification acknowledged for ${patientLabel}.`,
    `Email — ${emailLine}`,
    `WhatsApp — ${whatsappLine}`,
    'Delivery hooks via vert-clinic-1.7 Results tab will send through the standard notification service.',
  ].join(' ');

  return success('notify_patient_result_ready', summary, {
    notificationSent: true,
    completedAt: completedAt.toISOString(),
    whenLabel,
    emailSample: emailLine,
    whatsappSample: whatsappLine,
    dateFormat,
    timeFormat,
    ...parsedParams,
  });
}

export async function handleExplainDateInputFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_date_input_format', 'Business not found.');
  }

  const { dateFormat } = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const placeholder = businessDateInputPlaceholder(dateFormat);
  const orderNote =
    dateFormat === 'MM/DD/YYYY'
      ? 'Slash-separated input is read as month/day/year (MM/DD/YYYY).'
      : dateFormat === 'YYYY-MM-DD'
        ? 'Slash-separated input still follows European day/month order (DD/MM/YYYY); ISO YYYY-MM-DD is accepted as typed.'
        : 'Slash-separated input is read as day/month/year (DD/MM/YYYY).';

  const summary = [
    `Typed dashboard date fields use parseBusinessDateInput with the salon business dateFormat (${dateFormatLabel(dateFormat)}).`,
    orderNote,
    'ISO dates (YYYY-MM-DD) are always accepted unambiguously; legacy DD_MM_YYYY underscore input is always day/month/year.',
    `Input placeholder shows ${placeholder} (${BUSINESS_DATE_FORMAT_EXAMPLES[dateFormat]}).`,
    'The calendar picker selects an ISO calendar day directly — no slash-order ambiguity — while typed fields must disambiguate DD/MM vs MM/DD using business settings.',
    'Ambiguous example: 04/06/2026 resolves differently under European vs US order.',
  ].join(' ');

  return success('explain_date_input_format', summary, {
    dateFormat,
    placeholder,
    orderNote,
    acceptsIso: true,
    underscoreOrder: 'DD/MM/YYYY',
    calendarPickerUsesIsoDay: true,
    parseFunction: 'parseBusinessDateInput',
  });
}

export async function handlePreviewDateInputParseLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('preview_date_input_parse', 'Business not found.');
  }

  const { dateFormat } = readBusinessDateFormatSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const dateStrings = parseDateStringsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  const results = dateStrings.map((typed) => {
    const isoDay = parseBusinessDateToKey(typed, dateFormat);
    return { typed, isoDay, valid: isoDay !== null };
  });
  const resultLines = results
    .map((entry) =>
      entry.valid
        ? `${entry.typed} → ${entry.isoDay}`
        : `${entry.typed} → invalid (does not match ${dateFormatLabel(dateFormat)} order)`,
    )
    .join('; ');

  const summary = [
    `Date input parse preview (${dateFormatLabel(dateFormat)}): ${resultLines}.`,
    'Slash-separated values use business dateFormat order; ISO YYYY-MM-DD is unambiguous.',
    'Read-only preview — does not change settings.',
  ].join(' ');

  return success('preview_date_input_parse', summary, {
    dateFormat,
    dateStrings,
    parseResults: results,
  });
}

const SAMPLE_PUSH_CUSTOMER = 'Sam';
const SAMPLE_PUSH_SERVICE = 'Haircut';

export async function handleExplainProviderDateDisplayLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_provider_date_display', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const settings = business.settings as Record<string, unknown> | undefined;
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const displayOptions = { dateFormat, timeFormat, timeZone };
  const cardDate = formatDateDisplay(todayKey, undefined, displayOptions);
  const cardTime = formatTimeDisplay(sampleInstant, displayOptions);
  const cardRange = formatTimeRangeDisplay(
    sampleInstant,
    new Date(sampleInstant.getTime() + 60 * 60 * 1000),
    undefined,
    displayOptions,
  );

  const summary = [
    `Provider mobile schedule and booking cards read dateFormat (${dateFormatLabel(dateFormat)}) and timeFormat (${timeFormatLabel(timeFormat)}) from auth business settings at login (fmt-1.8) — the same salon settings as the dashboard.`,
    'Cards use formatDateDisplay / formatTimeDisplay with those settings, not the device browser locale.',
    `Sample booking card for today: ${cardDate} · ${cardRange} (${cardTime} start).`,
    'Changing formats in dashboard business settings updates provider display after the next login refresh.',
  ].join(' ');

  return success('explain_provider_date_display', summary, {
    dateFormat,
    timeFormat,
    todayKey,
    cardDateDisplay: cardDate,
    cardTimeDisplay: cardTime,
    cardTimeRangeDisplay: cardRange,
    usesAuthBusinessSettings: true,
    fmt18AuthBootstrap: true,
  });
}

export async function handleConfigureProviderPushDateFormatLogic(
  deps: BusinessDateFormatLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('configure_provider_push_date_format', 'Business not found.');
  }

  const timeZone = business.timezone ?? 'UTC';
  const settings = business.settings as Record<string, unknown> | undefined;
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  const requestedTimeFormat =
    typeof params.timeFormat === 'string' &&
    (params.timeFormat === '12h' || params.timeFormat === '24h')
      ? params.timeFormat
      : undefined;
  const effectiveTimeFormat = requestedTimeFormat ?? timeFormat;
  const todayKey = getTodayDateKey(timeZone);
  const sampleInstant = new Date(`${todayKey}T${SAMPLE_TIME_ISO}`);
  const timeLabel = formatTimeWithFormat(
    sampleInstant,
    effectiveTimeFormat,
    timeZone,
  );
  const fcmBody = `${SAMPLE_PUSH_CUSTOMER} — ${SAMPLE_PUSH_SERVICE} at ${timeLabel}`;
  const foregroundHint = `New booking ${timeLabel} — Add buffer?`;

  if (!confirmed) {
    const summary = [
      `Ready to wire provider FCM push bodies (fmt-1.8) to format booking times with business timeFormat (${timeFormatLabel(effectiveTimeFormat)}).`,
      `Sample new-booking body — ${fcmBody}.`,
      `Foreground hint — ${foregroundHint}.`,
      requestedTimeFormat && requestedTimeFormat !== timeFormat
        ? `Note: salon business settings are still ${timeFormatLabel(timeFormat)} — update configure_business_date_format to change the default.`
        : 'Uses current salon business timeFormat from settings.',
      'Confirm below to acknowledge push time-format wiring.',
    ]
      .filter(Boolean)
      .join(' ');

    return success('configure_provider_push_date_format', summary, {
      requiresExecutionConfirmation: true,
      confirmationPrompt: String(prompt ?? params._prompt ?? ''),
      interpretedAction: 'configure_provider_push_date_format',
      previewOnly: true,
      timeFormat: effectiveTimeFormat,
      businessTimeFormat: timeFormat,
      fcmBodySample: fcmBody,
      foregroundHintSample: foregroundHint,
      deferredFmt18Push: true,
    });
  }

  const summary = [
    `Provider push time-format wiring acknowledged (fmt-1.8).`,
    `FCM booking notifications will format times with ${timeFormatLabel(effectiveTimeFormat)} via formatTimeWithFormat.`,
    `Sample body — ${fcmBody}.`,
    'Deploy ProviderPushListener fmt-1.8 body formatter to apply in production.',
  ].join(' ');

  return success('configure_provider_push_date_format', summary, {
    pushTimeFormatWiringAcknowledged: true,
    timeFormat: effectiveTimeFormat,
    businessTimeFormat: timeFormat,
    dateFormat,
    fcmBodySample: fcmBody,
    foregroundHintSample: foregroundHint,
    deferredFmt18Push: true,
  });
}
