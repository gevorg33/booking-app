import type {
  BookingLabResultSummary,
  ClinicResultMeasurementFlag,
  ClinicTestResultStatus,
} from './clinic-lab-state';

export interface ClinicBookingResultRecord {
  id: string;
  orderId: string | null;
  status: ClinicTestResultStatus;
  testName: string | null;
  measurementFlag: ClinicResultMeasurementFlag | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
}

export interface BookingLabResultRow extends BookingLabResultSummary {
  orderId: string;
  resultId: string | null;
  completedAt?: string | null;
  reviewedAt?: string | null;
  releasedAt?: string | null;
}

export type ClinicLabChangeHistoryAction =
  | 'Created'
  | 'StatusChanged'
  | 'ResultReviewed'
  | 'ResultReleased'
  | 'OrderCancelled';

export interface ClinicLabChangeHistoryChange {
  propertyName: string;
  from: string | null;
  to: string;
}

export interface ClinicLabChangeHistoryEditedBy {
  employeeId: string | null;
  fullName: string | null;
  role: string | null;
}

export interface ClinicLabChangeHistoryItem {
  id: string;
  entityType: 'order' | 'result';
  entityId: string;
  action: ClinicLabChangeHistoryAction;
  date: string;
  changes: ClinicLabChangeHistoryChange[];
  editedBy: ClinicLabChangeHistoryEditedBy;
  note: string | null;
}

export interface ClinicResultTransitionAction {
  toStatus: ClinicTestResultStatus;
  labelKey: string;
}

const BOOKING_RESULT_TRANSITION_ACTIONS: Partial<
  Record<ClinicTestResultStatus, ClinicResultTransitionAction[]>
> = {
  NotReceived: [{ toStatus: 'Pending', labelKey: 'markPending' }],
  Pending: [{ toStatus: 'Completed', labelKey: 'markCompleted' }],
  WaitingCompletion: [{ toStatus: 'Completed', labelKey: 'markCompleted' }],
  Completed: [{ toStatus: 'Reviewed', labelKey: 'markReviewed' }],
  Reviewed: [{ toStatus: 'Released', labelKey: 'markReleased' }],
  AutomaticallyReviewed: [{ toStatus: 'Released', labelKey: 'markReleased' }],
};

export function unwrapClinicLabList<T>(data: unknown): T[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (Array.isArray(payload)) return payload as T[];
  const nested = (payload as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

export function getBookingResultTransitionActions(
  status: string,
): ClinicResultTransitionAction[] {
  return (
    BOOKING_RESULT_TRANSITION_ACTIONS[status as ClinicTestResultStatus] ?? []
  );
}

export function mergeBookingLabResultRows(
  summaries: BookingLabResultSummary[],
  results: ClinicBookingResultRecord[],
): BookingLabResultRow[] {
  const resultsByOrder = new Map<string, ClinicBookingResultRecord>();
  for (const result of results) {
    if (result.orderId && !resultsByOrder.has(result.orderId)) {
      resultsByOrder.set(result.orderId, result);
    }
  }

  return summaries.map((summary) => {
    const result = resultsByOrder.get(summary.id);
    return {
      ...summary,
      orderId: summary.id,
      resultId: result?.id ?? null,
      resultStatus: result?.status ?? summary.resultStatus,
      measurementFlag: result?.measurementFlag ?? summary.measurementFlag,
      completedAt: result?.completedAt ?? null,
      reviewedAt: result?.reviewedAt ?? null,
      releasedAt: result?.releasedAt ?? null,
    };
  });
}

export function formatClinicLabChangeHistoryActionLabel(
  action: ClinicLabChangeHistoryAction,
  t: (key: string) => string,
): string {
  return t(`clinic.labResults.changeHistory.actions.${action}`);
}

export function formatClinicLabChangeHistoryPropertyLabel(
  propertyName: string,
  t: (key: string) => string,
): string {
  const key = `clinic.labResults.changeHistory.properties.${propertyName}`;
  const label = t(key);
  return label === key ? propertyName : label;
}

export function formatClinicLabChangeHistoryStatusValue(
  value: string | null,
  t: (key: string) => string,
): string {
  if (!value) return '—';
  const orderKey = `clinic.labState.order.${value}`;
  const resultKey = `clinic.labState.result.${value}`;
  const specimenKey = `clinic.labState.specimen.${value}`;
  const orderLabel = t(orderKey);
  if (orderLabel !== orderKey) return orderLabel;
  const resultLabel = t(resultKey);
  if (resultLabel !== resultKey) return resultLabel;
  const specimenLabel = t(specimenKey);
  if (specimenLabel !== specimenKey) return specimenLabel;
  return value;
}

export function resolveClinicLabChangeHistoryEditedByLabel(
  editedBy: ClinicLabChangeHistoryEditedBy,
  t: (key: string) => string,
): string {
  if (editedBy.fullName?.trim()) return editedBy.fullName.trim();
  if (editedBy.employeeId) return editedBy.employeeId;
  return t('clinic.labResults.changeHistory.systemActor');
}
