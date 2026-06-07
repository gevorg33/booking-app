import type { PatientDocumentCategory } from '@/lib/patient-chart';

export interface PublicCustomerReleasedClinicDocument {
  id: string;
  category: PatientDocumentCategory;
  title: string | null;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  downloadUrl: string;
  createdAt: string;
}

export function normalizePublicClinicDocumentsPayload(
  payload: unknown,
): PublicCustomerReleasedClinicDocument[] {
  if (Array.isArray(payload)) return payload as PublicCustomerReleasedClinicDocument[];
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(data)) return data as PublicCustomerReleasedClinicDocument[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as PublicCustomerReleasedClinicDocument[]) : [];
}
