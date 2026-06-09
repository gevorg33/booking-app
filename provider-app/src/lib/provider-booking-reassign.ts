import api, { unwrap } from '../services/api';

export interface ProviderReassignEligibility {
  allowed: boolean;
  reason: string | null;
}

export interface ProviderReassignOptions {
  allowed: boolean;
  reason: string | null;
  date?: string;
  timeSlot?: string;
  serviceName?: string;
  currentEmployee?: { id: string; name: string } | null;
  options: Array<{ id: string; name: string }>;
}

export async function fetchProviderReassignOptions(
  businessId: string,
  bookingId: string,
): Promise<ProviderReassignOptions> {
  const { data: res } = await api.get(
    `/businesses/${businessId}/provider/bookings/${bookingId}/reassign/options`,
  );
  return unwrap<ProviderReassignOptions>(res);
}

export async function reassignProviderBooking(
  businessId: string,
  bookingId: string,
  input: { employeeId: string; expectedUpdatedAt?: string },
): Promise<unknown> {
  const { data: res } = await api.post(
    `/businesses/${businessId}/provider/bookings/${bookingId}/reassign`,
    input,
  );
  return unwrap(res);
}
