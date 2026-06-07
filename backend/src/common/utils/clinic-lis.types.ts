export const CLINIC_LAB_LOCATIONS = ['InHouse', 'External'] as const;
export type ClinicLabLocation = (typeof CLINIC_LAB_LOCATIONS)[number];

export const CLINIC_LAB_INFO_TYPES = ['Internal'] as const;
export type ClinicLabInfoType = (typeof CLINIC_LAB_INFO_TYPES)[number];

export const CLINIC_LAB_SYNC_OBSERVATION_STATUSES = [
  'Unlinked',
  'Linked',
  'Void',
] as const;
export type ClinicLabSyncObservationStatus =
  (typeof CLINIC_LAB_SYNC_OBSERVATION_STATUSES)[number];

export const CLINIC_LAB_SYNC_LINK_METHODS = ['Manual', 'Sync'] as const;
export type ClinicLabSyncLinkMethod =
  (typeof CLINIC_LAB_SYNC_LINK_METHODS)[number];

export const CLINIC_LAB_SYNC_INBOUND_SOURCES = [
  'hl7',
  'fhir',
  'vendor_json',
] as const;
export type ClinicLabSyncInboundSource =
  (typeof CLINIC_LAB_SYNC_INBOUND_SOURCES)[number];

export const CLINIC_LAB_SYNC_INBOUND_STATUSES = [
  'Pending',
  'Processing',
  'Completed',
  'Failed',
] as const;
export type ClinicLabSyncInboundStatus =
  (typeof CLINIC_LAB_SYNC_INBOUND_STATUSES)[number];

export const CLINIC_LIS_INBOUND_WEBHOOK_SIGNATURE_HEADER =
  'x-clinic-lis-signature';
export const CLINIC_LIS_INBOUND_DELIVERY_ID_HEADER = 'x-clinic-lis-delivery-id';

/** Region-specific LIS vendors rejected — use tenant-neutral vendor codes instead. */
export const FORBIDDEN_CLINIC_LIS_INTEGRATION_VENDOR_CODES = [
  'LIFELABS ONTARIO',
  'LIFELABS',
  'DYNACARE',
  'OHIP',
  'MDBILLING',
] as const;

export interface ClinicLabInfoSummary {
  id: string;
  name: string;
  location: string;
  phone: string;
  labLocation: ClinicLabLocation;
  labType: ClinicLabInfoType | null;
  integrationVendorCode: string | null;
  isActive: boolean;
}

export interface ClinicLabMachineSummary {
  id: string;
  name: string;
  labInfoId: string | null;
  labInfoName: string | null;
  isActive: boolean;
}

export interface ClinicLabSyncObservationResultView {
  id: string;
  testName: string;
  universalCode: string;
  resultValue: string;
  labComment: string | null;
  unit: string | null;
  referenceRange: string | null;
  abnormalFlags: string | null;
  clinicTestResultMeasurementId: string | null;
}

export interface ClinicLabSyncObservationRequestView {
  id: string;
  status: ClinicLabSyncObservationStatus;
  testName: string;
  universalCode: string;
  patientFirstName: string;
  patientLastName: string;
  patientDateOfBirth: string | null;
  patientExternalId: string | null;
  systemReceivedOn: string;
  integrationVendorCode: string | null;
  clinicTestResultId: string | null;
  linkMethod: ClinicLabSyncLinkMethod | null;
  observations: ClinicLabSyncObservationResultView[];
}
