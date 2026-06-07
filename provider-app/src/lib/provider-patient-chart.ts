import type { MobileViewMode } from './provider-access';

export interface ProviderPatientSearchHit {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ProviderPatientSearchResponse {
  labFeaturesEnabled: boolean;
  viewMode: MobileViewMode;
  query: string;
  patients: ProviderPatientSearchHit[];
}

export interface ProviderPatientClinicalProfile {
  id: string;
  businessId: string;
  customerId: string;
  allergies: string | null;
  chronicProblems: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  bloodType: string | null;
  phiMasked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderPatientChartOrder {
  id: string;
  status: string;
  displayNames: string | null;
  department: string | null;
  bookingId: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
}

export interface ProviderPatientChartResult {
  id: string;
  status: string;
  testName: string | null;
  department: string | null;
  orderId: string | null;
  bookingId: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  measurementFlag: string | null;
}

export interface ProviderPatientChartSummary {
  labFeaturesEnabled: boolean;
  viewMode: MobileViewMode;
  date: string;
  canAccessChart: boolean;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  clinicalProfile: ProviderPatientClinicalProfile | null;
  todaysOrders: ProviderPatientChartOrder[];
  todaysResults: ProviderPatientChartResult[];
}
