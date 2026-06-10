/** prov-exp-7.2 — provider time-off request form helpers. */

export interface ProviderTimeOffFormInput {
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  reason?: string;
}

export function isProviderTimeOffFormValid(input: ProviderTimeOffFormInput): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate.trim())) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.endDate.trim())) return false;
  if (input.endDate < input.startDate) return false;
  if (!/^\d{2}:\d{2}$/.test(input.dailyStartTime.trim())) return false;
  if (!/^\d{2}:\d{2}$/.test(input.dailyEndTime.trim())) return false;
  return input.dailyEndTime > input.dailyStartTime;
}

export function buildProviderTimeOffPayload(
  input: ProviderTimeOffFormInput,
): ProviderTimeOffFormInput | null {
  const payload = {
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    dailyStartTime: input.dailyStartTime.trim(),
    dailyEndTime: input.dailyEndTime.trim(),
    reason: input.reason?.trim() || undefined,
  };
  return isProviderTimeOffFormValid(payload) ? payload : null;
}

export type ProviderTimeOffStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'cancelled';

export interface ProviderTimeOffRequestSummary {
  id: string;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  reason: string | null;
  status: ProviderTimeOffStatus;
  reviewNotes: string | null;
}
