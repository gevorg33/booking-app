export type PatientChartTabId =
  | 'profile'
  | 'visits'
  | 'results'
  | 'orders'
  | 'encounters'
  | 'documents'
  | 'staffNotes'
  | 'intake';

export interface PatientChartTabDefinition {
  id: PatientChartTabId;
  enabled: boolean;
}

/** Tier I EMR tabs — enabled tabs ship in vert-clinic-2.5.2; others are shell placeholders. */
export const PATIENT_CHART_TIER_I_TABS: PatientChartTabDefinition[] = [
  { id: 'profile', enabled: true },
  { id: 'visits', enabled: true },
  { id: 'results', enabled: true },
  { id: 'orders', enabled: true },
  { id: 'encounters', enabled: true },
  { id: 'documents', enabled: true },
  { id: 'staffNotes', enabled: true },
  { id: 'intake', enabled: true },
];

export const PATIENT_CHART_DEFAULT_TAB: PatientChartTabId = 'profile';

export interface PatientClinicalProfileView {
  id: string;
  businessId: string;
  customerId: string;
  allergies: string | null;
  chronicProblems: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  bloodType: string | null;
  referringExternalDoctorId: string | null;
  referringExternalDoctor: PatientReferringExternalDoctorView | null;
  phiMasked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientReferringExternalDoctorView {
  id: string;
  name: string;
  clinicName: string | null;
  address: string;
  fax: string | null;
}

export interface PatientChartOrderRow {
  id: string;
  bookingId: string | null;
  status: string;
  displayNames: string | null;
  createdAt: string;
}

export interface PatientChartResultRow {
  id: string;
  bookingId: string | null;
  orderId: string | null;
  status: string;
  testName: string | null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface PatientChartVisitRow {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string | null;
  providerName: string | null;
}

export interface PatientEncounterListItem {
  encounterId: string | null;
  bookingId: string;
  startTime: string;
  endTime: string;
  serviceName: string | null;
  providerName: string | null;
  visitNote: string | null;
  addendaCount: number;
  authorEmployeeId: string | null;
  authorName: string | null;
  authoredAt: string | null;
  updatedAt: string | null;
  phiMasked?: boolean;
  canAuthorVisitNote: boolean;
  canAddAddendum: boolean;
}

export interface PatientEncounterAddendumView {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientEncounterDetailView extends PatientEncounterListItem {
  encounterId: string;
  addenda: PatientEncounterAddendumView[];
}

export interface PatientStaffNoteView {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  bookingId: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientStaffNotesListView {
  notes: PatientStaffNoteView[];
  canCreate: boolean;
}

export type PatientDocumentCategory =
  | 'lab_report'
  | 'referral_letter'
  | 'imaging_report'
  | 'other';

export interface PatientChartDocumentView {
  id: string;
  category: PatientDocumentCategory;
  title: string | null;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  downloadUrl: string | null;
  bookingId: string | null;
  uploadedByEmployeeId: string | null;
  uploadedByName: string | null;
  releasedToPatient: boolean;
  createdAt: string;
  phiMasked?: boolean;
}

export interface PatientChartDocumentsListView {
  documents: PatientChartDocumentView[];
  categories: readonly PatientDocumentCategory[];
  canUpload: boolean;
}

export function unwrapPatientChartData<T>(payload: unknown): T {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as T;
}

export function unwrapPatientChartList<T>(payload: unknown): T[] {
  const root = unwrapPatientChartData<unknown>(payload);
  if (Array.isArray(root)) return root as T[];
  const nested = (root as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

export function isPatientChartTabEnabled(tabId: PatientChartTabId): boolean {
  return (
    PATIENT_CHART_TIER_I_TABS.find((tab) => tab.id === tabId)?.enabled ?? false
  );
}

export function resolvePatientChartTab(
  value: string | null | undefined,
): PatientChartTabId {
  const match = PATIENT_CHART_TIER_I_TABS.find((tab) => tab.id === value);
  if (match?.enabled) return match.id;
  return PATIENT_CHART_DEFAULT_TAB;
}

export function patientChartTabLabelKey(tabId: PatientChartTabId): string {
  return `clinic.patientChart.tabs.${tabId}`;
}

export function buildPatientChartPath(
  customerId: string,
  tab: PatientChartTabId = PATIENT_CHART_DEFAULT_TAB,
): string {
  const base = `/dashboard/patient-chart/${encodeURIComponent(customerId)}`;
  if (tab === PATIENT_CHART_DEFAULT_TAB) return base;
  return `${base}?tab=${tab}`;
}

export function mapCustomerAppointmentsToVisits(
  appointments: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    service?: { name: string } | null;
    employee?: { name: string } | null;
  }>,
): PatientChartVisitRow[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    serviceName: appointment.service?.name ?? null,
    providerName: appointment.employee?.name ?? null,
  }));
}
