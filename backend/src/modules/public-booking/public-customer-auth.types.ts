export interface PublicCustomerJwtPayload {
  sub: string;
  email: string;
  businessId: string;
  type: 'public_customer';
}

export interface PublicCustomerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PublicCustomerAuthResponse {
  token: string;
  customer: PublicCustomerProfile;
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
  canReview: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  rescheduleCount: number;
  maxReschedules: number;
  allowProviderChangeOnReschedule?: boolean;
  packagePurchaseId?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  /** Ad-hoc multi-service visit group (e2e-bug.34). */
  multiServiceGroupId?: string | null;
  /** From booking metadata when part of a multi-service group. */
  multiServiceSchedulingMode?: 'same_visit' | 'per_service' | null;
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
