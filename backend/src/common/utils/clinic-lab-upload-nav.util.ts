/** Deep-link + API path helpers for lab result file upload handoffs (ai-cmd-clinic-6-gap-5.2). */

export const CLINIC_LAB_UPLOAD_QUERY_KEYS = {
  orderId: 'orderId',
  bookingId: 'bookingId',
  labTab: 'labTab',
  uploadResult: 'uploadResult',
} as const;

export const CLINIC_LAB_RESULT_UPLOAD_API_SEGMENT = 'result-attachments';

export interface DashboardNavigateTarget {
  path: string;
  query: Record<string, string>;
  hash?: string;
}

export interface ClinicLabResultUploadNavigateInput {
  orderId: string;
  bookingId?: string | null;
}

export interface ClinicLabResultUploadHandoff {
  orderId: string;
  bookingId: string | null;
  uploadApiPath: string;
  requiresFilePicker: true;
}

export function buildClinicLabResultUploadApiPath(
  businessId: string,
  orderId: string,
): string {
  const trimmedOrderId = orderId.trim();
  return `/businesses/${businessId}/clinic-test-results/orders/${trimmedOrderId}/${CLINIC_LAB_RESULT_UPLOAD_API_SEGMENT}`;
}

export function buildClinicLabResultUploadNavigate(
  input: ClinicLabResultUploadNavigateInput,
): DashboardNavigateTarget {
  const orderId = input.orderId.trim();
  const bookingId = input.bookingId?.trim();
  if (bookingId) {
    return {
      path: '/dashboard/bookings',
      query: {
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.bookingId]: bookingId,
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.labTab]: 'results',
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.orderId]: orderId,
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.uploadResult]: '1',
      },
    };
  }
  return {
    path: '/dashboard/lab-queue',
    query: {
      [CLINIC_LAB_UPLOAD_QUERY_KEYS.orderId]: orderId,
      [CLINIC_LAB_UPLOAD_QUERY_KEYS.uploadResult]: '1',
    },
  };
}

export function buildClinicLabResultUploadHandoff(
  businessId: string,
  input: ClinicLabResultUploadNavigateInput,
): ClinicLabResultUploadHandoff {
  const orderId = input.orderId.trim();
  return {
    orderId,
    bookingId: input.bookingId?.trim() ?? null,
    uploadApiPath: buildClinicLabResultUploadApiPath(businessId, orderId),
    requiresFilePicker: true,
  };
}
