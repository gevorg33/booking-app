import type {
  ClinicTaskLinkFields,
  ClinicTaskPriority,
  ClinicTaskStatus,
  ClinicTaskType,
} from './clinic-task.types.js';
import {
  CLINIC_TASK_PRIORITIES,
  CLINIC_TASK_STATUSES,
  CLINIC_TASK_TYPES,
  FORBIDDEN_IVF_CLINIC_TASK_TYPES,
} from './clinic-task.types.js';

export const CLINIC_TASK_LIST_DEFAULT_PAGE_SIZE = 25;

export function isAllowedClinicTaskType(
  value: unknown,
): value is ClinicTaskType {
  return (
    typeof value === 'string' &&
    (CLINIC_TASK_TYPES as readonly string[]).includes(value)
  );
}

export function isForbiddenIvfClinicTaskType(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    (FORBIDDEN_IVF_CLINIC_TASK_TYPES as readonly string[]).includes(value)
  );
}

export function assertAllowedClinicTaskType(value: unknown): ClinicTaskType {
  if (isForbiddenIvfClinicTaskType(value)) {
    throw new Error('IVF automated task types are not supported');
  }
  if (!isAllowedClinicTaskType(value)) {
    throw new Error('Unsupported clinic task type');
  }
  return value;
}

export function isClinicTaskStatus(value: unknown): value is ClinicTaskStatus {
  return (
    typeof value === 'string' &&
    (CLINIC_TASK_STATUSES as readonly string[]).includes(value)
  );
}

export function isClinicTaskPriority(
  value: unknown,
): value is ClinicTaskPriority {
  return (
    typeof value === 'string' &&
    (CLINIC_TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

export function canTransitionClinicTaskStatus(
  from: ClinicTaskStatus,
  to: ClinicTaskStatus,
): boolean {
  if (from === to) return true;
  if (from === 'completed' || from === 'cancelled') return false;
  if (to === 'open') return from === 'in_progress';
  if (to === 'in_progress') return from === 'open';
  if (to === 'completed') return from === 'open' || from === 'in_progress';
  if (to === 'cancelled') return from === 'open' || from === 'in_progress';
  return false;
}

export function validateClinicTaskLinks(
  taskType: ClinicTaskType,
  links: ClinicTaskLinkFields,
): string | null {
  const hasCustomer = Boolean(links.customerId?.trim());
  const hasBooking = Boolean(links.bookingId?.trim());
  const hasOrder = Boolean(links.testOrderId?.trim());
  const hasResult = Boolean(links.testResultId?.trim());
  const hasSpecimen = Boolean(links.specimenId?.trim());
  const hasEncounter = Boolean(links.encounterId?.trim());

  if (taskType === 'ResultReview') {
    if (!hasResult && !hasOrder) {
      return 'Result review tasks require a test result or order link';
    }
    return null;
  }

  if (taskType === 'SpecimenCollection') {
    if (!hasSpecimen && !hasOrder && !hasBooking) {
      return 'Specimen collection tasks require a specimen, order, or booking link';
    }
    return null;
  }

  if (taskType === 'PatientCallback') {
    if (!hasCustomer && !hasBooking && !hasEncounter) {
      return 'Patient callback tasks require a customer, booking, or encounter link';
    }
    return null;
  }

  return 'Unsupported clinic task type';
}

export function defaultClinicTaskTitle(taskType: ClinicTaskType): string {
  switch (taskType) {
    case 'ResultReview':
      return 'Review lab result';
    case 'SpecimenCollection':
      return 'Collect specimen';
    case 'PatientCallback':
      return 'Patient callback';
    default:
      return 'Clinic task';
  }
}

export function normalizeClinicTaskNotes(notes?: string | null): string | null {
  const trimmed = notes?.trim();
  return trimmed ? trimmed : null;
}

export function isClinicTaskOpen(status: ClinicTaskStatus): boolean {
  return status === 'open' || status === 'in_progress';
}
