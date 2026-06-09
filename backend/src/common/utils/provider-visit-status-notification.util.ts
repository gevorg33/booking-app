/** prov-exp-3.2 — customer SMS copy for provider visit status updates. */

export type ProviderVisitStatusKind = 'running_late' | 'ready_now';

export const DEFAULT_PROVIDER_RUNNING_LATE_MINUTES = 10;
export const MIN_PROVIDER_RUNNING_LATE_MINUTES = 1;
export const MAX_PROVIDER_RUNNING_LATE_MINUTES = 120;

export function normalizeProviderRunningLateMinutes(
  value?: number | string | null,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PROVIDER_RUNNING_LATE_MINUTES;
  return Math.min(
    MAX_PROVIDER_RUNNING_LATE_MINUTES,
    Math.max(MIN_PROVIDER_RUNNING_LATE_MINUTES, Math.round(parsed)),
  );
}

export function buildProviderVisitStatusCustomerSms(input: {
  kind: ProviderVisitStatusKind;
  minutesLate?: number;
  businessName: string;
  providerName: string;
  serviceName: string;
}): string {
  const serviceName = input.serviceName.trim() || 'your appointment';
  if (input.kind === 'ready_now') {
    return `${input.businessName}: ${input.providerName} is ready for you now (${serviceName}).`;
  }
  const minutes = normalizeProviderRunningLateMinutes(input.minutesLate);
  return `${input.businessName}: ${input.providerName} is running about ${minutes} minutes late for ${serviceName}.`;
}
