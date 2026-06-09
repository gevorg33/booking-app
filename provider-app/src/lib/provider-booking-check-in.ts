import api, { unwrap } from '../services/api';

export type ProviderBookingFloorStatus =
  | 'waiting'
  | 'checked_in'
  | 'completed'
  | 'no_show';

export interface ProviderCheckInResult {
  bookingId: string;
  checkedInAt: string;
  floorStatus: ProviderBookingFloorStatus;
}

const FLOOR_STATUS_I18N_KEYS: Record<ProviderBookingFloorStatus, string> = {
  waiting: 'provider.floorStatusWaiting',
  checked_in: 'provider.floorStatusCheckedIn',
  completed: 'provider.floorStatusCompleted',
  no_show: 'provider.floorStatusNoShow',
};

const FLOOR_STATUS_COLORS: Record<ProviderBookingFloorStatus, string> = {
  waiting: 'warning',
  checked_in: 'success',
  completed: 'primary',
  no_show: 'danger',
};

export function formatFloorStatusLabel(
  status: ProviderBookingFloorStatus,
  t: (key: string) => string,
): string {
  return t(FLOOR_STATUS_I18N_KEYS[status]);
}

export function floorStatusColor(
  status: ProviderBookingFloorStatus,
): string {
  return FLOOR_STATUS_COLORS[status];
}

export function canShowCheckInAction(input: {
  floorStatus?: ProviderBookingFloorStatus | null;
  status?: string;
}): boolean {
  if (input.floorStatus === 'waiting') return true;
  if (!input.floorStatus && input.status) {
    return !['completed', 'cancelled', 'no_show'].includes(input.status);
  }
  return false;
}

export async function checkInProviderBooking(
  businessId: string,
  bookingId: string,
): Promise<ProviderCheckInResult> {
  const { data: res } = await api.post(
    `/businesses/${businessId}/provider/bookings/${bookingId}/check-in`,
  );
  return unwrap<ProviderCheckInResult>(res);
}
