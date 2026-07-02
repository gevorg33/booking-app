import type {
  ClinicPatientAlertType,
  ClinicPatientAlertView,
} from '../../common/utils/clinic-patient-alert.types.js';
import { CLINIC_PATIENT_ALERT_TYPES } from '../../common/utils/clinic-patient-alert.types.js';
import {
  EXPLAIN_PATIENT_ALERT_PROMPTS,
  type ExplainPatientAlertAspect,
  type ExplainPatientAlertFixture,
} from './ai-explain-patient-alert.fixtures.js';
import { EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS } from './ai-explain-patient-alert-multilingual.fixtures.js';
import { isBookLabCollectionPrompt } from './ai-clinic-lab-booking.util.js';
import {
  isExplainResultStatusPrompt,
  isListMyTestResultsPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { isExplainMyNotificationsPrompt } from './ai-explain-my-notifications.util.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';

export const EXPLAIN_PATIENT_ALERT_INTENTS = ['explain_patient_alert'] as const;

export type ExplainPatientAlertIntent =
  (typeof EXPLAIN_PATIENT_ALERT_INTENTS)[number];

export { CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES } from './ai-explain-patient-alert.fixtures.js';

const PATIENT_ALERT_BANNER_CUE =
  /\b(red|yellow|amber)\s+(banner|alert|bar|strip)|clinic\s+alert|patient\s+alert|alert\s+banner|patientAlertsRegionLabel\b/i;

const RESULTS_READY_ALERT_CUE =
  /\bresults?\s+ready.{0,40}(what\s+(?:do\s+i|should\s+i)\s+do|next\s+step)|new\s+lab\s+result\s+alert\b/i;

const DISMISS_ALERT_CUE =
  /\b(dismiss|hide|close|clear|remove).{0,30}(patient|clinic)\s+alert|dismiss.{0,20}banner\b/i;

const INTAKE_ALERT_CUE =
  /\b(pre[-\s]?visit|account)\s+intake\s+alert|intake\s+(?:form\s+)?alert|incomplete\s+intake\s+alert\b/i;

const LAB_BOOK_ALERT_CUE =
  /\blab\s+collection\s+to\s+book|book\s+(?:my\s+)?lab\s+collection.{0,20}banner|pending\s+lab\s+(?:booking|collection)\s+alert\b/i;

const WHAT_TO_DO_ALERT_CUE =
  /\bwhat\s+(?:should\s+i\s+do|to\s+do).{0,30}(clinic\s+)?alerts?|where\s+does\s+view\s+take\s+me.{0,20}alert\b/i;

const HOW_ALERTS_WORK_CUE =
  /\b(how\s+do|what\s+are).{0,30}(clinic\s+)?patient\s+alerts?|patient\s+alerts?.{0,20}home\s+screen\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function isClinicPatientAlertType(
  value: unknown,
): value is ClinicPatientAlertType {
  return (
    typeof value === 'string' &&
    (CLINIC_PATIENT_ALERT_TYPES as readonly string[]).includes(value)
  );
}

function matchExplainPatientAlertScenario(
  prompt: string,
): ExplainPatientAlertFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PATIENT_ALERT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainPatientAlertAspect(
  prompt: string,
): ExplainPatientAlertAspect {
  const scenario = matchExplainPatientAlertScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (DISMISS_ALERT_CUE.test(prompt)) return 'dismiss_alert';
  if (RESULTS_READY_ALERT_CUE.test(prompt)) return 'results_ready';
  if (INTAKE_ALERT_CUE.test(prompt)) return 'intake_incomplete';
  if (LAB_BOOK_ALERT_CUE.test(prompt)) return 'lab_booking_pending';
  if (WHAT_TO_DO_ALERT_CUE.test(prompt)) return 'what_to_do';
  if (HOW_ALERTS_WORK_CUE.test(prompt)) return 'how_it_works';
  if (PATIENT_ALERT_BANNER_CUE.test(prompt)) return 'what_is_banner';
  return 'what_is_banner';
}

export function resolveExplainPatientAlertType(
  prompt: string,
): ClinicPatientAlertType | null {
  const scenario = matchExplainPatientAlertScenario(prompt);
  if (scenario?.alertType) return scenario.alertType;
  if (RESULTS_READY_ALERT_CUE.test(prompt)) return 'TestResultReleased';
  if (INTAKE_ALERT_CUE.test(prompt)) return 'IntakeIncomplete';
  if (LAB_BOOK_ALERT_CUE.test(prompt)) return 'LabBookingRequestPending';
  return null;
}

function shouldStealFromPatientAlert(prompt: string): boolean {
  if (isBookLabCollectionPrompt(prompt)) return true;
  if (isExplainPublicIntakeFormPrompt(prompt)) return true;
  if (isExplainMyNotificationsPrompt(prompt)) return true;
  if (
    isListMyTestResultsPrompt(prompt) &&
    !RESULTS_READY_ALERT_CUE.test(prompt) &&
    !PATIENT_ALERT_BANNER_CUE.test(prompt)
  ) {
    return true;
  }
  if (
    isExplainResultStatusPrompt(prompt) &&
    !RESULTS_READY_ALERT_CUE.test(prompt) &&
    !/\balert\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isExplainPatientAlertPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainPatientAlertScenario(text)) return true;
  if (shouldStealFromPatientAlert(text)) return false;

  if (
    (containsArmenianScript(text) &&
      /(բաներ|ծանուցում|կլինիկ)/i.test(text) &&
      /(կարմիր|արդյունք|փակել|ինչ)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(баннер|уведомлен|клиник|алерт)/i.test(text) &&
      /(красн|результат|скрыть|что|забор)/i.test(text))
  ) {
    return true;
  }

  return (
    PATIENT_ALERT_BANNER_CUE.test(text) ||
    RESULTS_READY_ALERT_CUE.test(text) ||
    DISMISS_ALERT_CUE.test(text) ||
    INTAKE_ALERT_CUE.test(text) ||
    LAB_BOOK_ALERT_CUE.test(text) ||
    WHAT_TO_DO_ALERT_CUE.test(text) ||
    HOW_ALERTS_WORK_CUE.test(text)
  );
}

export function isExplainPatientAlertIntent(
  action: string,
): action is ExplainPatientAlertIntent {
  return (EXPLAIN_PATIENT_ALERT_INTENTS as readonly string[]).includes(action);
}

export interface ParsedExplainPatientAlert {
  aspect: ExplainPatientAlertAspect;
  alertType: ClinicPatientAlertType | null;
}

export function parseExplainPatientAlertFromPrompt(
  prompt: string,
): ParsedExplainPatientAlert | null {
  if (!isExplainPatientAlertPrompt(prompt)) return null;
  return {
    aspect: resolveExplainPatientAlertAspect(prompt),
    alertType: resolveExplainPatientAlertType(prompt),
  };
}

export function rescueExplainPatientAlertIntent(
  prompt: string,
  action: string,
): { action: ExplainPatientAlertIntent; rescueReason: string } | null {
  if (isExplainPatientAlertIntent(action)) return null;
  if (!parseExplainPatientAlertFromPrompt(prompt)) return null;
  return {
    action: 'explain_patient_alert',
    rescueReason: 'patient_alert',
  };
}

export interface ConsumerPatientAlertExplainContext {
  alertCount: number;
  activeAlerts: ClinicPatientAlertView[];
  activeTypes: ClinicPatientAlertType[];
  primaryAlert: ClinicPatientAlertView | null;
}

function parsePatientAlertView(raw: unknown): ClinicPatientAlertView | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;
  if (!isClinicPatientAlertType(entry.type)) return null;
  if (typeof entry.id !== 'string' || typeof entry.title !== 'string') {
    return null;
  }
  const chartTab = entry.chartTab;
  if (
    chartTab !== 'results' &&
    chartTab !== 'intake' &&
    chartTab !== 'orders'
  ) {
    return null;
  }
  const messages = Array.isArray(entry.messages)
    ? entry.messages
        .filter(
          (message): message is { title: string } =>
            !!message &&
            typeof message === 'object' &&
            typeof (message as { title?: unknown }).title === 'string',
        )
        .map((message) => ({ title: message.title }))
    : [];
  return {
    id: entry.id,
    type: entry.type,
    sourceId: typeof entry.sourceId === 'string' ? entry.sourceId : entry.id,
    bookingId: typeof entry.bookingId === 'string' ? entry.bookingId : null,
    title: entry.title,
    messages,
    chartTab,
    createdAt:
      typeof entry.createdAt === 'string'
        ? entry.createdAt
        : new Date().toISOString(),
    testName: typeof entry.testName === 'string' ? entry.testName : null,
    questionnaireTitle:
      typeof entry.questionnaireTitle === 'string'
        ? entry.questionnaireTitle
        : null,
    orderDisplayNames:
      typeof entry.orderDisplayNames === 'string'
        ? entry.orderDisplayNames
        : null,
    collectionServiceName:
      typeof entry.collectionServiceName === 'string'
        ? entry.collectionServiceName
        : null,
  };
}

export function resolveConsumerPatientAlertExplainContext(
  params: Record<string, unknown>,
): ConsumerPatientAlertExplainContext {
  const fromArray = Array.isArray(params.patientAlerts)
    ? params.patientAlerts
        .map(parsePatientAlertView)
        .filter((entry): entry is ClinicPatientAlertView => entry !== null)
    : [];
  const alertCount =
    typeof params.patientAlertCount === 'number'
      ? params.patientAlertCount
      : fromArray.length;
  const activeAlerts = fromArray;
  const activeTypes = [
    ...new Set(activeAlerts.map((alert) => alert.type)),
  ] as ClinicPatientAlertType[];
  const primaryAlert = activeAlerts[0] ?? null;

  return {
    alertCount,
    activeAlerts,
    activeTypes,
    primaryAlert,
  };
}

function resolveAlertTypeForAspect(
  aspect: ExplainPatientAlertAspect,
  explicitType: ClinicPatientAlertType | null,
  ctx: ConsumerPatientAlertExplainContext,
): ClinicPatientAlertType | null {
  if (explicitType) return explicitType;
  if (aspect === 'results_ready') {
    return (
      ctx.activeAlerts.find((alert) => alert.type === 'TestResultReleased')
        ?.type ?? 'TestResultReleased'
    );
  }
  if (aspect === 'intake_incomplete') {
    return (
      ctx.activeAlerts.find((alert) => alert.type === 'IntakeIncomplete')
        ?.type ?? 'IntakeIncomplete'
    );
  }
  if (aspect === 'lab_booking_pending') {
    return (
      ctx.activeAlerts.find(
        (alert) => alert.type === 'LabBookingRequestPending',
      )?.type ?? 'LabBookingRequestPending'
    );
  }
  return ctx.primaryAlert?.type ?? null;
}

export function buildWhatIsBannerLines(
  ctx: ConsumerPatientAlertExplainContext,
): string[] {
  const lines = [
    'The clinic alerts banner (patientAlertsRegionLabel) appears at the top of the consumer home screen when your clinic has action items.',
    'It is amber/yellow — not an error banner — and summarizes released lab results, incomplete pre-visit intake, or lab collection bookings you still need to schedule.',
    'Use View to jump to the right screen or Dismiss (patientAlertsDismiss) to hide an alert until something changes.',
  ];
  if (ctx.alertCount > 0) {
    lines.push(`You currently have ${ctx.alertCount} active clinic alert(s).`);
  } else {
    lines.push(
      'No active clinic alerts are in your assistant context right now.',
    );
  }
  return lines;
}

export function buildResultsReadyLines(
  ctx: ConsumerPatientAlertExplainContext,
  alertType: ClinicPatientAlertType | null,
): string[] {
  const alert =
    ctx.activeAlerts.find((entry) => entry.type === 'TestResultReleased') ??
    null;
  const lines = [
    'A TestResultReleased alert means your clinic published a lab result you have not opened yet.',
    'Tap View on the banner to open Results and read the report; Dismiss hides the banner until a newer result arrives.',
  ];
  if (alert?.testName) {
    lines.push(`Current alert test: ${alert.testName}.`);
  } else if (alertType === 'TestResultReleased' && ctx.alertCount === 0) {
    lines.push(
      'Sign in and refresh home if you expected a results-ready alert.',
    );
  }
  return lines;
}

export function buildIntakeIncompleteLines(
  ctx: ConsumerPatientAlertExplainContext,
): string[] {
  const alert =
    ctx.activeAlerts.find((entry) => entry.type === 'IntakeIncomplete') ?? null;
  const lines = [
    'An IntakeIncomplete alert means a pre-visit questionnaire on your account is assigned or in progress.',
    'View opens Account on the my-intake section so you can finish the form before your visit.',
    'This is account intake — not the optional checkout questionnaire before booking.',
  ];
  if (alert?.questionnaireTitle) {
    lines.push(`Current questionnaire: ${alert.questionnaireTitle}.`);
  }
  return lines;
}

export function buildLabBookingPendingLines(
  ctx: ConsumerPatientAlertExplainContext,
): string[] {
  const alert =
    ctx.activeAlerts.find(
      (entry) => entry.type === 'LabBookingRequestPending',
    ) ?? null;
  const lines = [
    'A LabBookingRequestPending alert means your clinic ordered labs that still need a collection appointment.',
    'View opens Lab to book so you can schedule the draw; Dismiss only hides the reminder.',
  ];
  if (alert?.orderDisplayNames) {
    lines.push(`Pending order: ${alert.orderDisplayNames}.`);
  } else if (alert?.collectionServiceName) {
    lines.push(`Collection service: ${alert.collectionServiceName}.`);
  }
  return lines;
}

export function buildWhatToDoLines(
  ctx: ConsumerPatientAlertExplainContext,
): string[] {
  const lines = [
    'Each alert has View and Dismiss actions. View routes by alert type: Results for released tests, Lab to book for pending draws, Account intake for unfinished questionnaires.',
  ];
  if (ctx.activeTypes.length > 0) {
    lines.push(`Active alert types right now: ${ctx.activeTypes.join(', ')}.`);
  } else {
    lines.push(
      'Open home after sign-in to refresh alerts from GET /me/clinic-patient-alerts.',
    );
  }
  return lines;
}

export function buildDismissAlertLines(): string[] {
  return [
    'Dismiss (patientAlertsDismiss) calls POST /me/clinic-patient-alerts/:alertType/dismiss for that source item.',
    'Dismissed alerts stay hidden until the underlying result, intake, or lab order changes.',
    'Use View instead when you want to complete the action rather than hide the reminder.',
  ];
}

export function buildPatientAlertHowItWorksLines(
  ctx: ConsumerPatientAlertExplainContext,
): string[] {
  const lines = [
    'Clinic patient alerts are built server-side from your released results, assigned intake forms, and pending lab booking requests.',
    'The consumer app loads them on home/account and renders ConsumerPatientAlertsBanner with patientAlertsViewAction and patientAlertsDismiss.',
  ];
  if (ctx.alertCount > 0) {
    lines.push(`Your snapshot shows ${ctx.alertCount} alert(s).`);
  }
  return lines;
}

export function assemblePatientAlertSummary(
  aspect: ExplainPatientAlertAspect,
  ctx: ConsumerPatientAlertExplainContext,
  alertType: ClinicPatientAlertType | null,
): string {
  let lines: string[];
  switch (aspect) {
    case 'results_ready':
      lines = buildResultsReadyLines(ctx, alertType);
      break;
    case 'intake_incomplete':
      lines = buildIntakeIncompleteLines(ctx);
      break;
    case 'lab_booking_pending':
      lines = buildLabBookingPendingLines(ctx);
      break;
    case 'what_to_do':
      lines = buildWhatToDoLines(ctx);
      break;
    case 'dismiss_alert':
      lines = buildDismissAlertLines();
      break;
    case 'how_it_works':
      lines = buildPatientAlertHowItWorksLines(ctx);
      break;
    case 'what_is_banner':
    default:
      lines = buildWhatIsBannerLines(ctx);
      break;
  }
  return lines.join(' ');
}

export function shouldDismissConsumerPatientAlert(
  aspect: ExplainPatientAlertAspect,
): boolean {
  return aspect === 'dismiss_alert';
}

function chartTabForAlertType(
  alertType: ClinicPatientAlertType,
): ClinicPatientAlertView['chartTab'] {
  switch (alertType) {
    case 'TestResultReleased':
      return 'results';
    case 'IntakeIncomplete':
      return 'intake';
    case 'LabBookingRequestPending':
      return 'orders';
  }
}

export function buildExplainPatientAlertNavigate(
  aspect: ExplainPatientAlertAspect,
  alertType: ClinicPatientAlertType | null,
  ctx: ConsumerPatientAlertExplainContext,
): { path: string; query: Record<string, string> } | null {
  if (aspect === 'dismiss_alert') return null;

  const resolvedType = resolveAlertTypeForAspect(aspect, alertType, ctx);
  const primary =
    (resolvedType
      ? ctx.activeAlerts.find((alert) => alert.type === resolvedType)
      : null) ?? ctx.primaryAlert;
  const chartTab = resolvedType
    ? chartTabForAlertType(resolvedType)
    : primary?.chartTab;

  if (chartTab === 'orders') {
    return { path: '/lab-to-book', query: {} };
  }
  if (chartTab === 'intake') {
    return { path: 'account', query: { section: 'my-intake' } };
  }
  if (chartTab === 'results') {
    return { path: '/results', query: {} };
  }
  if (
    aspect === 'what_to_do' ||
    aspect === 'what_is_banner' ||
    aspect === 'how_it_works'
  ) {
    return ctx.alertCount > 0 ? { path: 'home', query: {} } : null;
  }
  return null;
}
