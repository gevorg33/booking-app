export interface OfflineQueuedPayload {
  queued?: boolean;
  offline?: boolean;
}

export function isOfflineQueuedResponse(
  data: unknown,
  status?: number,
): data is OfflineQueuedPayload {
  if (status != null && status !== 202) return false;
  return isOfflineQueuedPayload(data);
}

export function isOfflineQueuedPayload(data: unknown): data is OfflineQueuedPayload {
  const payload = data as OfflineQueuedPayload | undefined;
  return payload?.queued === true && payload?.offline === true;
}

export function offlineQueuedMutationMessage(message: string): string {
  return message;
}
