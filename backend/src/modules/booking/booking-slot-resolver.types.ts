export interface SlotAvailabilityCheck {
  employeeId: string;
  employeeName: string;
  available: boolean;
  hasSchedule: boolean;
  openSlots: Array<{ start: string; end: string }>;
}

export interface BookingFallbackResolveInput {
  businessId: string;
  serviceId: string;
  isoDay: string;
  timeSlot: string;
  timeZone?: string;
  /** Ordered provider preference (names or ids resolved by caller). */
  providerPriority: Array<{ id: string; name: string }>;
  fallbackAnyProvider?: boolean;
  allActiveProviders?: Array<{ id: string; name: string }>;
}

export interface BookingFallbackResolveResult {
  employeeId: string;
  employeeName: string;
  serviceId: string;
  isoDay: string;
  timeSlot: string;
  startTime: string;
  matchReason: 'priority_provider' | 'any_provider';
  checks: SlotAvailabilityCheck[];
}
