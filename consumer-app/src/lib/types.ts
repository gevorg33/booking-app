export interface PublicBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  locale: string;
  branding: PublicBranding;
  publicBookingEnabled: boolean;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string | null;
  avatarUrl?: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  currency: string;
}

export interface PublicSlot {
  startTime: string;
  endTime: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PublicCustomerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PublicCustomerBookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage?: string | null;
  rescheduleCount?: number;
  maxReschedules?: number;
  allowProviderChangeOnReschedule?: boolean;
  packagePurchaseId?: string | null;
  packageId?: string | null;
  packageName?: string | null;
}

export interface PublicPackageVisitAppointment {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
  status: string;
  canCancel: boolean;
  canReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
}

export interface PublicPackageVisitSummary {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  appointments: PublicPackageVisitAppointment[];
  canCancelAll: boolean;
  canRescheduleAll: boolean;
  policyMessage: string | null;
  allowProviderChangeOnReschedule: boolean;
}

export interface PublicBookingManageContext {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  allowProviderChangeOnReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
  packageVisit?: PublicPackageVisitSummary;
}

export type PackageVisitRescheduleLine = {
  bookingId: string;
  startTime: string;
  employeeId?: string;
};

export interface PublicCustomerSubscription {
  id: string;
  planName: string;
  status: string;
  appointmentsRemaining: number;
  expiresAt: string;
}
