import type { PatientDocumentCategory } from './patient-document-category.util.js';

export interface PatientReleasedDocumentCustomerView {
  id: string;
  category: PatientDocumentCategory;
  title: string | null;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  downloadUrl: string;
  createdAt: string;
}

export function canCustomerAccessReleasedDocument(input: {
  customerId: string;
  releasedToPatient: boolean;
  requestCustomerId: string;
}): boolean {
  return (
    input.customerId === input.requestCustomerId && input.releasedToPatient
  );
}
