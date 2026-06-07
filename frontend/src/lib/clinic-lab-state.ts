export type ClinicTestOrderStatus =
  | 'NotCollected'
  | 'Collecting'
  | 'AwaitingResults'
  | 'Completed'
  | 'Cancelled';

export type ClinicTestResultStatus =
  | 'NotReceived'
  | 'Pending'
  | 'WaitingCompletion'
  | 'Completed'
  | 'Reviewed'
  | 'AutomaticallyReviewed'
  | 'Released'
  | 'Rejected';

export type ClinicSpecimenStatus =
  | 'NotCollected'
  | 'Collected'
  | 'ReadyForTransport'
  | 'InTransit'
  | 'ReceivedInLab'
  | 'Completed'
  | 'RecollectRequired'
  | 'RetestRequired'
  | 'Rejected';

export type ClinicResultMeasurementFlag =
  | 'Normal'
  | 'Abnormal'
  | 'High'
  | 'Low'
  | 'Inconclusive'
  | 'Indeterminate'
  | 'TestNotComplete'
  | 'NotApplicable'
  | 'SeeDetails';

export type ClinicPatientResultVisibility = 'New' | 'Pending' | 'Read';

export type ClinicLabStatusBadgeKind =
  | 'order'
  | 'result'
  | 'specimen'
  | 'measurement'
  | 'patientVisibility';

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

export interface BookingLabResultSummary {
  id: string;
  testName: string;
  orderStatus: ClinicTestOrderStatus;
  resultStatus?: ClinicTestResultStatus;
  specimenStatus?: ClinicSpecimenStatus;
  measurementFlag?: ClinicResultMeasurementFlag;
}

export const CLINIC_LAB_BADGE_CLASS: Record<ClinicLabBadgeTone, string> = {
  neutral: 'bg-gray-600/15 text-gray-300',
  info: 'bg-sky-600/15 text-sky-300',
  progress: 'bg-blue-600/15 text-blue-300',
  success: 'bg-green-600/15 text-green-400',
  warning: 'bg-amber-600/15 text-amber-300',
  danger: 'bg-red-600/15 text-red-400',
  review: 'bg-violet-600/15 text-violet-300',
};

export const CLINIC_LAB_BADGE_CLASS_LIGHT: Record<ClinicLabBadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-sky-50 text-sky-700',
  progress: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  review: 'bg-violet-50 text-violet-700',
};

const ORDER_STATUS_BADGE_TONES: Record<ClinicTestOrderStatus, ClinicLabBadgeTone> =
  {
    NotCollected: 'neutral',
    Collecting: 'progress',
    AwaitingResults: 'warning',
    Completed: 'success',
    Cancelled: 'danger',
  };

const RESULT_STATUS_BADGE_TONES: Record<
  ClinicTestResultStatus,
  ClinicLabBadgeTone
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

const SPECIMEN_STATUS_BADGE_TONES: Record<
  ClinicSpecimenStatus,
  ClinicLabBadgeTone
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

const MEASUREMENT_FLAG_BADGE_TONES: Record<
  ClinicResultMeasurementFlag,
  ClinicLabBadgeTone
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

const PATIENT_VISIBILITY_BADGE_TONES: Record<
  ClinicPatientResultVisibility,
  ClinicLabBadgeTone
> = {
  New: 'info',
  Pending: 'warning',
  Read: 'neutral',
};

const MEASUREMENT_FLAG_COLORS: Partial<
  Record<ClinicResultMeasurementFlag, { text: string; background: string }>
> = {
  Normal: { text: '#02922A', background: '#E2F3E4' },
  Abnormal: { text: '#D7442F', background: '#F6EAE6' },
  High: { text: '#D7442F', background: '#F6EAE6' },
  Low: { text: '#D97706', background: '#FEF3C7' },
};

function formatLabStateLabel(
  key: string,
  raw: string,
  t: (key: string) => string,
): string {
  const label = t(key);
  return label === key ? raw : label;
}

export function formatClinicTestOrderStatusLabel(
  status: ClinicTestOrderStatus,
  t: (key: string) => string,
): string {
  return formatLabStateLabel(`clinic.labState.order.${status}`, status, t);
}

export function formatClinicTestResultStatusLabel(
  status: ClinicTestResultStatus,
  t: (key: string) => string,
): string {
  return formatLabStateLabel(`clinic.labState.result.${status}`, status, t);
}

export function formatClinicSpecimenStatusLabel(
  status: ClinicSpecimenStatus,
  t: (key: string) => string,
): string {
  return formatLabStateLabel(`clinic.labState.specimen.${status}`, status, t);
}

export function formatClinicResultMeasurementFlagLabel(
  flag: ClinicResultMeasurementFlag,
  t: (key: string) => string,
): string {
  return formatLabStateLabel(`clinic.labState.measurement.${flag}`, flag, t);
}

export function formatClinicPatientResultVisibilityLabel(
  visibility: ClinicPatientResultVisibility,
  t: (key: string) => string,
): string {
  return formatLabStateLabel(
    `clinic.labState.patientVisibility.${visibility}`,
    visibility,
    t,
  );
}

export function formatClinicLabFeatureDisabledReason(
  t: (key: string) => string,
): string {
  return t('clinic.labState.gate.disabledReason');
}

export function getClinicResultMeasurementBadgeColor(
  flag: ClinicResultMeasurementFlag,
): { text: string; background: string } | null {
  return MEASUREMENT_FLAG_COLORS[flag] ?? null;
}

function resolveStatusLabel(
  kind: ClinicLabStatusBadgeKind,
  status: string,
  t: (key: string) => string,
): string {
  switch (kind) {
    case 'order':
      return formatClinicTestOrderStatusLabel(status as ClinicTestOrderStatus, t);
    case 'result':
      return formatClinicTestResultStatusLabel(status as ClinicTestResultStatus, t);
    case 'specimen':
      return formatClinicSpecimenStatusLabel(status as ClinicSpecimenStatus, t);
    case 'measurement':
      return formatClinicResultMeasurementFlagLabel(
        status as ClinicResultMeasurementFlag,
        t,
      );
    case 'patientVisibility':
      return formatClinicPatientResultVisibilityLabel(
        status as ClinicPatientResultVisibility,
        t,
      );
  }
}

function resolveBadgeTone(
  kind: ClinicLabStatusBadgeKind,
  status: string,
): ClinicLabBadgeTone {
  switch (kind) {
    case 'order':
      return ORDER_STATUS_BADGE_TONES[status as ClinicTestOrderStatus] ?? 'neutral';
    case 'result':
      return RESULT_STATUS_BADGE_TONES[status as ClinicTestResultStatus] ?? 'neutral';
    case 'specimen':
      return SPECIMEN_STATUS_BADGE_TONES[status as ClinicSpecimenStatus] ?? 'neutral';
    case 'measurement':
      return (
        MEASUREMENT_FLAG_BADGE_TONES[status as ClinicResultMeasurementFlag] ??
        'neutral'
      );
    case 'patientVisibility':
      return (
        PATIENT_VISIBILITY_BADGE_TONES[status as ClinicPatientResultVisibility] ??
        'neutral'
      );
  }
}

export function getClinicLabStatusUiMetadata(
  kind: ClinicLabStatusBadgeKind,
  status: string,
  t: (key: string) => string,
): ClinicLabStatusUiMetadata {
  const badgeTone = resolveBadgeTone(kind, status);
  const metadata: ClinicLabStatusUiMetadata = {
    label: resolveStatusLabel(kind, status, t),
    badgeTone,
  };
  if (kind === 'measurement') {
    metadata.measurementColors =
      getClinicResultMeasurementBadgeColor(status as ClinicResultMeasurementFlag) ??
      undefined;
  }
  return metadata;
}

export function getClinicLabStatusBadgeClassName(
  kind: ClinicLabStatusBadgeKind,
  status: string,
  options?: { theme?: 'dark' | 'light' },
): string {
  const tone = resolveBadgeTone(kind, status);
  const palette =
    options?.theme === 'light'
      ? CLINIC_LAB_BADGE_CLASS_LIGHT
      : CLINIC_LAB_BADGE_CLASS;
  return palette[tone];
}
