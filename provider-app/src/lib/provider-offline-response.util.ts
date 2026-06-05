export interface OfflineQueuedPayload {
  queued?: boolean;
  offline?: boolean;
}

export function isOfflineQueuedResponse(
  data: unknown,
  status?: number,
): data is OfflineQueuedPayload {
  if (status !== 202) return false;
  const payload = data as OfflineQueuedPayload | undefined;
  return payload?.queued === true && payload?.offline === true;
}

export function offlineQueuedAssistantSummary(translate: (key: string) => string): string {
  return translate('provider.offlineCommandQueued');
}

export function offlineNeedsNetworkSummary(translate: (key: string) => string): string {
  return translate('provider.offlineCommandNeedsNetwork');
}
