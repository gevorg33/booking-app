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
}
