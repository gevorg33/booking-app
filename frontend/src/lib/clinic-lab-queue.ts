export interface ClinicLabQueueItem {
  id: string;
  status: string;
  displayNames: string | null;
  department: string | null;
  bookingId: string | null;
  visitBookingId: string | null;
  collectionBookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  visitBookingStartTime: string | null;
  collectionBookingStartTime: string | null;
  bookingRequestPushedAt: string | null;
  awaitingPatientBooking: boolean;
  employeeName: string | null;
  createdAt: string;
}

export interface ClinicLabQueueFilters {
  status?: string;
  from?: string;
  to?: string;
  department?: string;
}

export interface ClinicTestOrderRecord {
  id: string;
  status: string;
  displayNames: string | null;
  testTypeId: string | null;
  createdAt: string;
}

export const CLINIC_LAB_ORDER_STATUSES = [
  'NotCollected',
  'Collecting',
  'AwaitingResults',
  'Completed',
  'Cancelled',
] as const;

/** Synthetic lab-queue filter value (not an order status). */
export const LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER = 'AwaitingPatientBooking';

export const CLINIC_PLAYBOOK_DEPARTMENTS = [
  'General Practice',
  'Laboratory',
  'Cardiology',
  'Imaging',
  'Dental',
  'Dermatology',
] as const;

export function buildLabQueueQueryParams(
  filters: ClinicLabQueueFilters,
): Record<string, string> {
  const params: Record<string, string> = {};
  const status = filters.status?.trim();
  if (status) {
    if (status === LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER) {
      params.awaitingPatientBooking = 'true';
    } else {
      params.status = status;
    }
  }
  if (filters.from?.trim()) params.from = `${filters.from.trim()}T00:00:00.000Z`;
  if (filters.to?.trim()) params.to = `${filters.to.trim()}T23:59:59.999Z`;
  if (filters.department?.trim()) params.department = filters.department.trim();
  return params;
}
