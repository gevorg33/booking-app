/** prov-exp-7.2 — dashboard toggle for provider time-off requests. */

export interface ProviderTimeOffSettings {
  enabled: boolean;
}

export function readProviderTimeOffSettings(
  raw?: Record<string, unknown> | null,
): ProviderTimeOffSettings {
  const block = raw?.providerTimeOff as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function normalizeProviderTimeOffSettings(
  settings: ProviderTimeOffSettings,
): ProviderTimeOffSettings {
  return { enabled: settings.enabled === true };
}

export type ProviderTimeOffRequestStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'cancelled';

export interface ProviderTimeOffRequestRow {
  id: string;
  employeeId: string;
  employeeName: string | null;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  reason: string | null;
  status: ProviderTimeOffRequestStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
