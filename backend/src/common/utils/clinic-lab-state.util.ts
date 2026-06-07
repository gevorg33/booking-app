import { isClinicVerticalBusinessType } from './clinic-service.util.js';
import { type AppLocale, t } from '../i18n/messages.js';

/** Generic test order lifecycle (vert-clinic-2.0.12 — no plan/cycle states). */
export const CLINIC_TEST_ORDER_STATUSES = [
  'NotCollected',
  'Collecting',
  'AwaitingResults',
  'Completed',
  'Cancelled',
] as const;

export type ClinicTestOrderStatus = (typeof CLINIC_TEST_ORDER_STATUSES)[number];

/** Order statuses shown on provider mobile today's collection queue. */
export const CLINIC_PROVIDER_COLLECTION_QUEUE_STATUSES = [
  'NotCollected',
  'Collecting',
] as const satisfies readonly ClinicTestOrderStatus[];

/** Generic test result lifecycle (vert-clinic-2.0.12). */
export const CLINIC_TEST_RESULT_STATUSES = [
  'NotReceived',
  'Pending',
  'WaitingCompletion',
  'Completed',
  'Reviewed',
  'AutomaticallyReviewed',
  'Released',
  'Rejected',
] as const;

export type ClinicTestResultStatus =
  (typeof CLINIC_TEST_RESULT_STATUSES)[number];

/** Rolling window (days) for provider mobile assigned-patient results tab. */
export const CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS = 30;

/** Result statuses shown on provider mobile assigned-patient results tab. */
export const CLINIC_PROVIDER_RESULTS_QUEUE_STATUSES =
  CLINIC_TEST_RESULT_STATUSES;

/** UTC booking window for provider mobile assigned-patient results queue. */
export function buildClinicProviderResultsQueueWindow(now: Date = new Date()): {
  from: string;
  to: string;
} {
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Dashboard entry queue — result capture / completion worklist. */
export const CLINIC_RESULT_ENTRY_QUEUE_STATUSES = [
  'NotReceived',
  'Pending',
  'WaitingCompletion',
] as const satisfies readonly ClinicTestResultStatus[];

/** Dashboard review queue — pathologist / clinician sign-off. */
export const CLINIC_RESULT_REVIEW_QUEUE_STATUSES = [
  'Completed',
] as const satisfies readonly ClinicTestResultStatus[];

/** Dashboard release queue — patient-visible release step. */
export const CLINIC_RESULT_RELEASE_QUEUE_STATUSES = [
  'Reviewed',
  'AutomaticallyReviewed',
] as const satisfies readonly ClinicTestResultStatus[];

/** Generic specimen lifecycle (vert-clinic-2.0.12). */
export const CLINIC_SPECIMEN_STATUSES = [
  'NotCollected',
  'Collected',
  'ReadyForTransport',
  'InTransit',
  'ReceivedInLab',
  'Completed',
  'RecollectRequired',
  'RetestRequired',
  'Rejected',
] as const;

export type ClinicSpecimenStatus = (typeof CLINIC_SPECIMEN_STATUSES)[number];

/** Dashboard collection queue — draw / recollect worklist. */
export const CLINIC_SPECIMEN_COLLECTION_QUEUE_STATUSES = [
  'NotCollected',
  'RecollectRequired',
] as const satisfies readonly ClinicSpecimenStatus[];

/** Dashboard tracking queue — post-collection transport + lab receipt. */
export const CLINIC_SPECIMEN_TRACKING_QUEUE_STATUSES = [
  'Collected',
  'ReadyForTransport',
  'InTransit',
  'ReceivedInLab',
  'RetestRequired',
] as const satisfies readonly ClinicSpecimenStatus[];

export const CLINIC_RESULT_MEASUREMENT_FLAGS = [
  'Normal',
  'Abnormal',
  'High',
  'Low',
  'Inconclusive',
  'Indeterminate',
  'TestNotComplete',
  'NotApplicable',
  'SeeDetails',
] as const;

export type ClinicResultMeasurementFlag =
  (typeof CLINIC_RESULT_MEASUREMENT_FLAGS)[number];

export const CLINIC_PATIENT_RESULT_VISIBILITY = [
  'New',
  'Pending',
  'Read',
] as const;

export type ClinicPatientResultVisibility =
  (typeof CLINIC_PATIENT_RESULT_VISIBILITY)[number];

const TERMINAL_ORDER_STATUSES: ReadonlySet<ClinicTestOrderStatus> = new Set([
  'Completed',
  'Cancelled',
]);

const TERMINAL_RESULT_STATUSES: ReadonlySet<ClinicTestResultStatus> = new Set([
  'Released',
  'Rejected',
]);

const NON_EDITABLE_RESULT_STATUSES: ReadonlySet<ClinicTestResultStatus> =
  new Set(['Reviewed', 'AutomaticallyReviewed', 'Released', 'Rejected']);

const COMPLETE_RESULT_STATUSES: ReadonlySet<ClinicTestResultStatus> = new Set([
  'Completed',
  'Reviewed',
  'AutomaticallyReviewed',
  'Released',
]);

const ORDER_TRANSITIONS: Readonly<
  Record<ClinicTestOrderStatus, readonly ClinicTestOrderStatus[]>
> = {
  NotCollected: ['Collecting', 'Cancelled'],
  Collecting: ['AwaitingResults', 'Cancelled'],
  AwaitingResults: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const RESULT_TRANSITIONS: Readonly<
  Record<ClinicTestResultStatus, readonly ClinicTestResultStatus[]>
> = {
  NotReceived: ['Pending', 'WaitingCompletion', 'Completed', 'Rejected'],
  Pending: ['WaitingCompletion', 'Completed', 'Rejected'],
  WaitingCompletion: ['Completed', 'Rejected'],
  Completed: ['Reviewed', 'AutomaticallyReviewed', 'Released', 'Rejected'],
  Reviewed: ['Released'],
  AutomaticallyReviewed: ['Released'],
  Released: [],
  Rejected: [],
};

const SPECIMEN_TRANSITIONS: Readonly<
  Record<ClinicSpecimenStatus, readonly ClinicSpecimenStatus[]>
> = {
  NotCollected: ['Collected', 'Rejected'],
  Collected: [
    'ReadyForTransport',
    'ReceivedInLab',
    'RecollectRequired',
    'Rejected',
  ],
  ReadyForTransport: ['InTransit', 'Rejected'],
  InTransit: ['ReceivedInLab', 'Rejected'],
  ReceivedInLab: [
    'Completed',
    'RetestRequired',
    'RecollectRequired',
    'Rejected',
  ],
  Completed: [],
  RecollectRequired: ['Collected', 'Rejected'],
  RetestRequired: ['Collected', 'Rejected'],
  Rejected: [],
};

/** v1 transport shortcut: Collected → ReceivedInLab without transport folder. */
export const CLINIC_SPECIMEN_V1_TRANSITIONS: Readonly<
  Record<ClinicSpecimenStatus, readonly ClinicSpecimenStatus[]>
> = {
  ...SPECIMEN_TRANSITIONS,
  Collected: ['ReceivedInLab', 'RecollectRequired', 'Rejected'],
};

export const CLINIC_LAB_FEATURES_DISABLED_REASON = t(
  'en',
  'clinic.labState.gate.disabledReason',
);

export function clinicLabStateOrderStatusKey(
  status: ClinicTestOrderStatus,
): string {
  return `clinic.labState.order.${status}`;
}

export function clinicLabStateResultStatusKey(
  status: ClinicTestResultStatus,
): string {
  return `clinic.labState.result.${status}`;
}

export function clinicLabStateSpecimenStatusKey(
  status: ClinicSpecimenStatus,
): string {
  return `clinic.labState.specimen.${status}`;
}

export function clinicLabStateMeasurementFlagKey(
  flag: ClinicResultMeasurementFlag,
): string {
  return `clinic.labState.measurement.${flag}`;
}

export function clinicLabStatePatientVisibilityKey(
  visibility: ClinicPatientResultVisibility,
): string {
  return `clinic.labState.patientVisibility.${visibility}`;
}

export type ClinicLabBadgeTone =
  | 'neutral'
  | 'info'
  | 'progress'
  | 'success'
  | 'warning'
  | 'danger'
  | 'review';

export interface ClinicLabStatusUiMetadata {
  label: string;
  badgeTone: ClinicLabBadgeTone;
  measurementColors?: { text: string; background: string };
}

const ORDER_STATUS_BADGE_TONES: Readonly<
  Record<ClinicTestOrderStatus, ClinicLabBadgeTone>
> = {
  NotCollected: 'neutral',
  Collecting: 'progress',
  AwaitingResults: 'warning',
  Completed: 'success',
  Cancelled: 'danger',
};

const RESULT_STATUS_BADGE_TONES: Readonly<
  Record<ClinicTestResultStatus, ClinicLabBadgeTone>
> = {
  NotReceived: 'neutral',
  Pending: 'warning',
  WaitingCompletion: 'warning',
  Completed: 'info',
  Reviewed: 'review',
  AutomaticallyReviewed: 'review',
  Released: 'success',
  Rejected: 'danger',
};

const SPECIMEN_STATUS_BADGE_TONES: Readonly<
  Record<ClinicSpecimenStatus, ClinicLabBadgeTone>
> = {
  NotCollected: 'neutral',
  Collected: 'progress',
  ReadyForTransport: 'info',
  InTransit: 'info',
  ReceivedInLab: 'progress',
  Completed: 'success',
  RecollectRequired: 'warning',
  RetestRequired: 'warning',
  Rejected: 'danger',
};

const MEASUREMENT_FLAG_BADGE_TONES: Readonly<
  Record<ClinicResultMeasurementFlag, ClinicLabBadgeTone>
> = {
  Normal: 'success',
  Abnormal: 'danger',
  High: 'danger',
  Low: 'warning',
  Inconclusive: 'warning',
  Indeterminate: 'warning',
  TestNotComplete: 'neutral',
  NotApplicable: 'neutral',
  SeeDetails: 'info',
};

const PATIENT_VISIBILITY_BADGE_TONES: Readonly<
  Record<ClinicPatientResultVisibility, ClinicLabBadgeTone>
> = {
  New: 'info',
  Pending: 'warning',
  Read: 'neutral',
};

export function getClinicTestOrderStatusUiMetadata(
  status: ClinicTestOrderStatus,
  locale: AppLocale = 'en',
): ClinicLabStatusUiMetadata {
  return {
    label: formatClinicTestOrderStatusLabel(status, locale),
    badgeTone: ORDER_STATUS_BADGE_TONES[status],
  };
}

export function getClinicTestResultStatusUiMetadata(
  status: ClinicTestResultStatus,
  locale: AppLocale = 'en',
): ClinicLabStatusUiMetadata {
  return {
    label: formatClinicTestResultStatusLabel(status, locale),
    badgeTone: RESULT_STATUS_BADGE_TONES[status],
  };
}

export function getClinicSpecimenStatusUiMetadata(
  status: ClinicSpecimenStatus,
  locale: AppLocale = 'en',
): ClinicLabStatusUiMetadata {
  return {
    label: formatClinicSpecimenStatusLabel(status, locale),
    badgeTone: SPECIMEN_STATUS_BADGE_TONES[status],
  };
}

export function getClinicResultMeasurementFlagUiMetadata(
  flag: ClinicResultMeasurementFlag,
  locale: AppLocale = 'en',
): ClinicLabStatusUiMetadata {
  return {
    label: formatClinicResultMeasurementFlagLabel(flag, locale),
    badgeTone: MEASUREMENT_FLAG_BADGE_TONES[flag],
    measurementColors: getClinicResultMeasurementBadgeColor(flag) ?? undefined,
  };
}

export function getClinicPatientResultVisibilityUiMetadata(
  visibility: ClinicPatientResultVisibility,
  locale: AppLocale = 'en',
): ClinicLabStatusUiMetadata {
  return {
    label: formatClinicPatientResultVisibilityLabel(visibility, locale),
    badgeTone: PATIENT_VISIBILITY_BADGE_TONES[visibility],
  };
}

export interface ClinicLabFeatureGate {
  enabled: boolean;
  reason?: string;
}

/** Gate lab module APIs — same business types as vert-clinic-1 (2.0.10). */
export function isClinicLabFeaturesEnabled(
  businessType: string | undefined | null,
): boolean {
  return isClinicVerticalBusinessType(businessType);
}

export function getClinicLabFeatureGate(
  businessType: string | undefined | null,
  locale: AppLocale = 'en',
): ClinicLabFeatureGate {
  if (isClinicLabFeaturesEnabled(businessType)) {
    return { enabled: true };
  }
  return {
    enabled: false,
    reason: t(locale, 'clinic.labState.gate.disabledReason'),
  };
}

export function isClinicTestOrderStatus(
  value: unknown,
): value is ClinicTestOrderStatus {
  return (
    typeof value === 'string' &&
    (CLINIC_TEST_ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export function isClinicTestResultStatus(
  value: unknown,
): value is ClinicTestResultStatus {
  return (
    typeof value === 'string' &&
    (CLINIC_TEST_RESULT_STATUSES as readonly string[]).includes(value)
  );
}

export function isClinicSpecimenStatus(
  value: unknown,
): value is ClinicSpecimenStatus {
  return (
    typeof value === 'string' &&
    (CLINIC_SPECIMEN_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransitionClinicTestOrder(
  from: ClinicTestOrderStatus,
  to: ClinicTestOrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function canTransitionClinicTestResult(
  from: ClinicTestResultStatus,
  to: ClinicTestResultStatus,
): boolean {
  return RESULT_TRANSITIONS[from].includes(to);
}

export function canTransitionClinicSpecimen(
  from: ClinicSpecimenStatus,
  to: ClinicSpecimenStatus,
  options?: { v1ShortPath?: boolean },
): boolean {
  const map = options?.v1ShortPath
    ? CLINIC_SPECIMEN_V1_TRANSITIONS
    : SPECIMEN_TRANSITIONS;
  return map[from].includes(to);
}

/** Orders editable only before collection starts (no patientPlan branch). */
export function isClinicTestOrderEditable(
  status: ClinicTestOrderStatus,
): boolean {
  return status === 'NotCollected';
}

export function isClinicTestOrderTerminal(
  status: ClinicTestOrderStatus,
): boolean {
  return TERMINAL_ORDER_STATUSES.has(status);
}

export function isClinicTestResultEditable(
  status: ClinicTestResultStatus,
): boolean {
  return !NON_EDITABLE_RESULT_STATUSES.has(status);
}

export function isClinicTestResultComplete(
  status: ClinicTestResultStatus,
): boolean {
  return COMPLETE_RESULT_STATUSES.has(status);
}

export function isClinicTestResultTerminal(
  status: ClinicTestResultStatus,
): boolean {
  return TERMINAL_RESULT_STATUSES.has(status);
}

export function canReleaseClinicTestResult(
  status: ClinicTestResultStatus,
): boolean {
  return (
    status === 'Completed' ||
    status === 'Reviewed' ||
    status === 'AutomaticallyReviewed'
  );
}

export function canReviewClinicTestResult(
  status: ClinicTestResultStatus,
): boolean {
  return status === 'Completed';
}

export function formatClinicTestOrderStatusLabel(
  status: ClinicTestOrderStatus,
  locale: AppLocale = 'en',
): string {
  return t(locale, clinicLabStateOrderStatusKey(status));
}

export function formatClinicTestResultStatusLabel(
  status: ClinicTestResultStatus,
  locale: AppLocale = 'en',
): string {
  return t(locale, clinicLabStateResultStatusKey(status));
}

export function formatClinicSpecimenStatusLabel(
  status: ClinicSpecimenStatus,
  locale: AppLocale = 'en',
): string {
  return t(locale, clinicLabStateSpecimenStatusKey(status));
}

export function formatClinicResultMeasurementFlagLabel(
  flag: ClinicResultMeasurementFlag,
  locale: AppLocale = 'en',
): string {
  return t(locale, clinicLabStateMeasurementFlagKey(flag));
}

export function formatClinicPatientResultVisibilityLabel(
  visibility: ClinicPatientResultVisibility,
  locale: AppLocale = 'en',
): string {
  return t(locale, clinicLabStatePatientVisibilityKey(visibility));
}

export function getClinicResultMeasurementBadgeColor(
  flag: ClinicResultMeasurementFlag,
): { text: string; background: string } | null {
  switch (flag) {
    case 'Normal':
      return { text: '#02922A', background: '#E2F3E4' };
    case 'Abnormal':
    case 'High':
      return { text: '#D7442F', background: '#F6EAE6' };
    case 'Low':
      return { text: '#D97706', background: '#FEF3C7' };
    default:
      return null;
  }
}
