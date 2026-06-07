import { consumerCopyForLocale } from './copy.js';

const MEASUREMENT_FLAG_TONES: Record<string, 'success' | 'danger' | 'warning' | 'neutral' | 'info'> =
  {
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

const RESULT_STATUS_TONES: Record<string, 'success'> = {
  Released: 'success',
};

const RESULT_STATUS_COPY_KEYS = {
  NotReceived: 'resultStatusNotReceived',
  Pending: 'resultStatusPending',
  WaitingCompletion: 'resultStatusWaitingCompletion',
  Completed: 'resultStatusCompleted',
  Reviewed: 'resultStatusReviewed',
  AutomaticallyReviewed: 'resultStatusAutomaticallyReviewed',
  Released: 'resultStatusReleased',
  Rejected: 'resultStatusRejected',
} as const;

export function formatClinicResultStatusLabel(status: string, locale?: string | null): string {
  const copy = consumerCopyForLocale(locale);
  const key = RESULT_STATUS_COPY_KEYS[status as keyof typeof RESULT_STATUS_COPY_KEYS];
  if (!key) return status;
  return copy[key];
}

export function formatClinicMeasurementFlagLabel(flag: string, locale?: string | null): string {
  const copy = consumerCopyForLocale(locale);
  const labels: Record<string, string> = {
    Normal: copy.measurementFlagNormal,
    Abnormal: copy.measurementFlagAbnormal,
    High: copy.measurementFlagHigh,
    Low: copy.measurementFlagLow,
    Inconclusive: copy.measurementFlagInconclusive,
    Indeterminate: copy.measurementFlagIndeterminate,
    TestNotComplete: copy.measurementFlagTestNotComplete,
    NotApplicable: copy.measurementFlagNotApplicable,
    SeeDetails: copy.measurementFlagSeeDetails,
  };
  return labels[flag] ?? flag;
}

export function getClinicResultStatusChipClass(status: string): string {
  return RESULT_STATUS_TONES[status] === 'success'
    ? 'clinic-chip clinic-chip--success'
    : 'clinic-chip clinic-chip--neutral';
}

export function getClinicMeasurementFlagChipClass(flag: string): string {
  const tone = MEASUREMENT_FLAG_TONES[flag] ?? 'neutral';
  return `clinic-chip clinic-chip--${tone}`;
}
