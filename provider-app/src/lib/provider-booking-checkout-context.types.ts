/** prov-exp-1.4 — checkout context badges on provider booking detail. */

export interface ProviderBookingPackageBadge {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  serviceIndex: number;
  serviceTotal: number;
  visitsRemaining: number;
}

export interface ProviderBookingSubscriptionBadge {
  subscriptionId: string;
  planName: string;
  status: string;
  appointmentsRemaining: number;
  appointmentsIncluded: number;
  isActive: boolean;
}

export interface ProviderBookingMultiServiceLine {
  bookingId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  employeeName: string;
  status: string;
  isCurrent: boolean;
}

export interface ProviderBookingMultiServiceBadge {
  groupId: string;
  schedulingMode: 'same_visit' | 'per_service';
  serviceCount: number;
  totalDurationMinutes: number;
  totalPrice: number;
  currency: string;
  lines: ProviderBookingMultiServiceLine[];
}

export interface ProviderBookingCheckoutContext {
  package: ProviderBookingPackageBadge | null;
  subscription: ProviderBookingSubscriptionBadge | null;
  multiService: ProviderBookingMultiServiceBadge | null;
}
