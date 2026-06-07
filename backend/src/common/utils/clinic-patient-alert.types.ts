export const CLINIC_PATIENT_ALERT_TYPES = [
  'TestResultReleased',
  'IntakeIncomplete',
  'LabBookingRequestPending',
] as const;

export type ClinicPatientAlertType =
  (typeof CLINIC_PATIENT_ALERT_TYPES)[number];

export interface ClinicPatientAlertMessageView {
  title: string;
}

export interface ClinicPatientAlertView {
  id: string;
  type: ClinicPatientAlertType;
  sourceId: string;
  bookingId: string | null;
  title: string;
  messages: ClinicPatientAlertMessageView[];
  chartTab: 'results' | 'intake' | 'orders';
  createdAt: string;
  testName?: string | null;
  questionnaireTitle?: string | null;
  orderDisplayNames?: string | null;
  collectionServiceName?: string | null;
}

export interface ClinicPatientAlertListView {
  alerts: ClinicPatientAlertView[];
  totalCount: number;
}
