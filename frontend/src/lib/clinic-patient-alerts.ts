import type { PatientChartTabId } from '@/lib/patient-chart';

export type ClinicPatientAlertType =
  | 'TestResultReleased'
  | 'IntakeIncomplete'
  | 'LabBookingRequestPending';

export interface ClinicPatientAlertView {
  id: string;
  type: ClinicPatientAlertType;
  sourceId: string;
  bookingId: string | null;
  title: string;
  messages: Array<{ title: string }>;
  chartTab: PatientChartTabId;
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

export function unwrapPatientChartAlerts(payload: unknown): ClinicPatientAlertListView {
  const root = (payload as { data?: unknown })?.data ?? payload;
  const view = root as ClinicPatientAlertListView;
  return {
    alerts: Array.isArray(view?.alerts) ? view.alerts : [],
    totalCount: typeof view?.totalCount === 'number' ? view.totalCount : 0,
  };
}

export function patientAlertTitleKey(type: ClinicPatientAlertType): string {
  return `clinic.patientAlerts.titles.${type}`;
}

export function patientAlertBodyKey(type: ClinicPatientAlertType): string {
  return `clinic.patientAlerts.bodies.${type}`;
}

export function publicPatientAlertTitleKey(type: ClinicPatientAlertType): string {
  return `public.patientAlerts.titles.${type}`;
}

export function publicPatientAlertBodyKey(type: ClinicPatientAlertType): string {
  return `public.patientAlerts.bodies.${type}`;
}

export function resolvePatientAlertAccountAnchor(
  chartTab: ClinicPatientAlertView['chartTab'],
): string {
  switch (chartTab) {
    case 'results':
      return 'my-results';
    case 'orders':
      return 'my-lab-requests';
    case 'intake':
      return 'my-intake';
    default:
      return 'my-bookings';
  }
}
