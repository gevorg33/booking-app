import api, { unwrap } from '../services/api';

export type ProviderVisitStatusKind = 'running_late' | 'ready_now';

export interface ProviderVisitStatusSnapshot {
  kind: ProviderVisitStatusKind;
  minutesLate?: number;
  markedAt: string;
  markedByUserId?: string;
}

export interface ProviderVisitStatusResult {
  bookingId: string;
  visitStatus: ProviderVisitStatusSnapshot;
  floorStatus: string;
  notifications: { smsSent: boolean; pushSent: boolean } | null;
}

export async function markProviderBookingRunningLate(
  businessId: string,
  bookingId: string,
  minutesLate = 10,
): Promise<ProviderVisitStatusResult> {
  const { data: res } = await api.post(
    `/businesses/${businessId}/provider/bookings/${bookingId}/running-late`,
    { minutesLate },
  );
  return unwrap<ProviderVisitStatusResult>(res);
}

export async function markProviderBookingReadyNow(
  businessId: string,
  bookingId: string,
): Promise<ProviderVisitStatusResult> {
  const { data: res } = await api.post(
    `/businesses/${businessId}/provider/bookings/${bookingId}/ready-now`,
  );
  return unwrap<ProviderVisitStatusResult>(res);
}

export function formatVisitStatusLabel(
  status: ProviderVisitStatusSnapshot,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (status.kind === 'ready_now') {
    return t('provider.visitStatusReadyNow');
  }
  return t('provider.visitStatusRunningLate', {
    minutes: status.minutesLate ?? 10,
  });
}

export function visitStatusBadgeColor(
  kind: ProviderVisitStatusKind,
): string {
  return kind === 'ready_now' ? 'success' : 'warning';
}
