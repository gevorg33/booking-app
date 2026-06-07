export interface ClinicLabOrderBookingAction {
  orderId: string;
  displayNames: string | null;
  status: string;
  customerId: string | null;
  bookingId: string | null;
  collectionBookingId: string | null;
  collectionServiceId: string | null;
  bookingRequestPushedAt: string | null;
  canPush: boolean;
  canStaffBook: boolean;
  supportedCollectionServices: Array<{ id: string; name: string }>;
}

export interface ClinicLabCollectionAvailabilitySlot {
  slotId: string | null;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName?: string | null;
}

export interface PublicClinicLabBookingRequest {
  orderId: string;
  displayNames: string | null;
  collectionServiceId: string;
  collectionServiceName: string;
  token: string;
  pushedAt: string;
  collectionBookingId: string | null;
  bookUrl: string;
}

export function unwrapClinicLabBookingAction(data: unknown): ClinicLabOrderBookingAction {
  const payload = (data as { data?: unknown })?.data ?? data;
  return payload as ClinicLabOrderBookingAction;
}

export function unwrapPublicClinicLabBookingRequests(
  data: unknown,
): PublicClinicLabBookingRequest[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  return Array.isArray(payload) ? (payload as PublicClinicLabBookingRequest[]) : [];
}

export function unwrapClinicLabCollectionAvailability(
  data: unknown,
): ClinicLabCollectionAvailabilitySlot[] {
  const payload = (data as { data?: unknown; slots?: unknown })?.data ?? data;
  const root = (payload as { slots?: unknown })?.slots ?? payload;
  return Array.isArray(root) ? (root as ClinicLabCollectionAvailabilitySlot[]) : [];
}
