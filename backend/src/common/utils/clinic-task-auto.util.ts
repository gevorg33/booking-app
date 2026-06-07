import { isClinicLabBookingRequestPending } from './clinic-lab-booking-request.util.js';
import {
  CLINIC_RESULT_REVIEW_QUEUE_STATUSES,
  CLINIC_SPECIMEN_COLLECTION_QUEUE_STATUSES,
  type ClinicSpecimenStatus,
  type ClinicTestResultStatus,
} from './clinic-lab-state.util.js';
import type {
  ClinicTaskPriority,
  ClinicTaskType,
} from './clinic-task.types.js';

/** Grace after scheduled draw time before a specimen collection task is overdue. */
export const CLINIC_OVERDUE_SPECIMEN_GRACE_MINUTES = 15;

/** Default SLA for clinician result review auto-tasks. */
export const CLINIC_RESULT_REVIEW_DUE_HOURS = 4;

/** Days after lab booking request push before a patient callback auto-task is due. */
export const CLINIC_LAB_BOOKING_REQUEST_CALLBACK_DAYS = 3;

export interface AutoClinicTaskDraft {
  taskType: ClinicTaskType;
  title: string;
  notes: string | null;
  priority: ClinicTaskPriority;
  dueAt: Date;
  customerId: string | null;
  bookingId: string | null;
  testOrderId: string | null;
  testResultId: string | null;
  specimenId: string | null;
  assigneeEmployeeId: string | null;
  isAutoManaged: true;
}

export function isResultInReviewQueue(status: ClinicTestResultStatus): boolean {
  return (CLINIC_RESULT_REVIEW_QUEUE_STATUSES as readonly string[]).includes(
    status,
  );
}

export function shouldResolveAutoResultReviewTask(
  fromStatus: ClinicTestResultStatus,
  toStatus: ClinicTestResultStatus,
): boolean {
  return isResultInReviewQueue(fromStatus) && !isResultInReviewQueue(toStatus);
}

export function isSpecimenInCollectionQueue(
  status: ClinicSpecimenStatus,
): boolean {
  return (
    CLINIC_SPECIMEN_COLLECTION_QUEUE_STATUSES as readonly string[]
  ).includes(status);
}

export function resolveSpecimenCollectionDueAt(input: {
  bookingStartTime?: Date | null;
  specimenCreatedAt: Date;
}): Date {
  return input.bookingStartTime ?? input.specimenCreatedAt;
}

export function isOverdueSpecimenCollection(
  input: {
    status: ClinicSpecimenStatus;
    bookingStartTime?: Date | null;
    specimenCreatedAt: Date;
  },
  now: Date = new Date(),
): boolean {
  if (!isSpecimenInCollectionQueue(input.status)) return false;
  const dueAt = resolveSpecimenCollectionDueAt(input);
  const graceMs = CLINIC_OVERDUE_SPECIMEN_GRACE_MINUTES * 60_000;
  return dueAt.getTime() + graceMs <= now.getTime();
}

export function resolveResultReviewDueAt(
  completedAt: Date,
  now: Date = new Date(),
): Date {
  const dueAt = new Date(completedAt);
  dueAt.setHours(dueAt.getHours() + CLINIC_RESULT_REVIEW_DUE_HOURS);
  return dueAt.getTime() > now.getTime() ? dueAt : now;
}

export function buildAutoResultReviewTaskDraft(input: {
  businessId: string;
  resultId: string;
  customerId: string;
  bookingId?: string | null;
  testOrderId?: string | null;
  testName?: string | null;
  completedAt: Date;
  assigneeEmployeeId?: string | null;
  now?: Date;
}): AutoClinicTaskDraft {
  const testLabel = input.testName?.trim() || 'lab result';
  return {
    taskType: 'ResultReview',
    title: `Review ${testLabel}`,
    notes: 'Auto-created from result review queue',
    priority: 'high',
    dueAt: resolveResultReviewDueAt(input.completedAt, input.now),
    customerId: input.customerId,
    bookingId: input.bookingId ?? null,
    testOrderId: input.testOrderId ?? null,
    testResultId: input.resultId,
    specimenId: null,
    assigneeEmployeeId: input.assigneeEmployeeId ?? null,
    isAutoManaged: true,
  };
}

export function buildAutoSpecimenCollectionTaskDraft(input: {
  customerId: string;
  bookingId?: string | null;
  testOrderId: string;
  specimenId: string;
  orderDisplayNames?: string | null;
  bookingStartTime?: Date | null;
  specimenCreatedAt: Date;
  assigneeEmployeeId?: string | null;
  now?: Date;
}): AutoClinicTaskDraft {
  const orderLabel = input.orderDisplayNames?.trim() || 'specimen';
  const dueAt = resolveSpecimenCollectionDueAt({
    bookingStartTime: input.bookingStartTime,
    specimenCreatedAt: input.specimenCreatedAt,
  });
  return {
    taskType: 'SpecimenCollection',
    title: `Collect ${orderLabel}`,
    notes: 'Auto-created for overdue specimen collection',
    priority: 'high',
    dueAt,
    customerId: input.customerId,
    bookingId: input.bookingId ?? null,
    testOrderId: input.testOrderId,
    testResultId: null,
    specimenId: input.specimenId,
    assigneeEmployeeId: input.assigneeEmployeeId ?? null,
    isAutoManaged: true,
  };
}

export function shouldResolveAutoSpecimenCollectionTask(
  fromStatus: ClinicSpecimenStatus,
  toStatus: ClinicSpecimenStatus,
): boolean {
  return (
    isSpecimenInCollectionQueue(fromStatus) &&
    !isSpecimenInCollectionQueue(toStatus)
  );
}

export function resolveLabBookingRequestCallbackDueAt(pushedAt: Date): Date {
  const dueAt = new Date(pushedAt);
  dueAt.setDate(dueAt.getDate() + CLINIC_LAB_BOOKING_REQUEST_CALLBACK_DAYS);
  return dueAt;
}

export function isOverdueLabBookingRequestCallback(
  order: {
    status: string;
    bookingRequestPushedAt?: Date | null;
    collectionBookingId?: string | null;
  },
  now: Date = new Date(),
): boolean {
  if (!isClinicLabBookingRequestPending(order)) return false;
  if (!order.bookingRequestPushedAt) return false;
  return (
    resolveLabBookingRequestCallbackDueAt(
      order.bookingRequestPushedAt,
    ).getTime() <= now.getTime()
  );
}

export function shouldResolveAutoLabBookingRequestCallbackTask(order: {
  status: string;
  bookingRequestPushedAt?: Date | null;
  collectionBookingId?: string | null;
}): boolean {
  return !isClinicLabBookingRequestPending(order);
}

export function buildAutoLabBookingRequestCallbackTaskDraft(input: {
  customerId: string;
  bookingId?: string | null;
  testOrderId: string;
  orderDisplayNames?: string | null;
  collectionServiceName?: string | null;
  pushedAt: Date;
  assigneeEmployeeId?: string | null;
}): AutoClinicTaskDraft {
  const orderLabel = input.orderDisplayNames?.trim() || 'lab order';
  const collectionLabel = input.collectionServiceName?.trim();
  return {
    taskType: 'PatientCallback',
    title: `Follow up: ${orderLabel} collection not booked`,
    notes: collectionLabel
      ? `Patient has not booked ${collectionLabel} within ${CLINIC_LAB_BOOKING_REQUEST_CALLBACK_DAYS} days of push`
      : `Patient has not booked lab collection within ${CLINIC_LAB_BOOKING_REQUEST_CALLBACK_DAYS} days of push`,
    priority: 'normal',
    dueAt: resolveLabBookingRequestCallbackDueAt(input.pushedAt),
    customerId: input.customerId,
    bookingId: input.bookingId ?? null,
    testOrderId: input.testOrderId,
    testResultId: null,
    specimenId: null,
    assigneeEmployeeId: input.assigneeEmployeeId ?? null,
    isAutoManaged: true,
  };
}
