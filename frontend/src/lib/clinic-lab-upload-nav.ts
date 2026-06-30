/** Mirrors backend clinic-lab-upload-nav.util.ts query keys (ai-cmd-clinic-6-gap-5.2). */

export const CLINIC_LAB_UPLOAD_QUERY_KEYS = {
  orderId: 'orderId',
  bookingId: 'bookingId',
  labTab: 'labTab',
  uploadResult: 'uploadResult',
} as const;

export type ClinicLabDetailTab = 'orders' | 'results';

export function parseClinicLabUploadSearchParams(
  params: Pick<URLSearchParams, 'get'>,
): {
  labTab: ClinicLabDetailTab | null;
  orderId: string | null;
  uploadResult: boolean;
} {
  const labTabRaw = params.get(CLINIC_LAB_UPLOAD_QUERY_KEYS.labTab);
  const labTab =
    labTabRaw === 'orders' || labTabRaw === 'results' ? labTabRaw : null;
  const orderId = params.get(CLINIC_LAB_UPLOAD_QUERY_KEYS.orderId)?.trim() || null;
  const uploadResult =
    params.get(CLINIC_LAB_UPLOAD_QUERY_KEYS.uploadResult) === '1';
  return { labTab, orderId, uploadResult };
}
