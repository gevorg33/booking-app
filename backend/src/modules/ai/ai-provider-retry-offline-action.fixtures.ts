/** ai-cmd-provider-5.13.2 — provider mobile: replay/retry the offline action queue now that back online. */

export const PROVIDER_RETRY_OFFLINE_ACTION_CLASSIFIER_RULES = `- retry_offline_action: MUTATE — provider mobile only: replay the queued offline actions now (ProviderOfflineBanner "Retry" / "Sync now"). Triggers: retry failed sync, send queued actions now, retry offline queue, sync my pending actions. NOT offline_queue_status (read-only — what's queued), NOT explain_offline_mode (why offline / general offline behavior).`;

export const PROVIDER_RETRY_OFFLINE_ACTION_PROMPT_SCENARIOS = [
  { id: 'retry-offline-action-retry-failed-sync-en', prompt: 'Retry failed sync', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-send-queued-en', prompt: 'Send queued actions now', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-retry-queue-en', prompt: 'Retry the offline queue', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-sync-pending-en', prompt: 'Sync my pending actions', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-resync-en', prompt: 'Resync the queued actions', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-replay-en', prompt: 'Replay the offline queue', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-flush-en', prompt: 'Flush the pending offline actions', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-sync-now-en', prompt: 'Sync offline queue now', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-try-again-en', prompt: 'Try to sync the queue again', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-retry-queued-en', prompt: 'Retry my queued actions', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-hy', prompt: 'Կրկին փորձիր սինքրոնացնել offline հերթը', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-send-hy', prompt: 'Ուղարկիր հերթագրված գործողությունները հիմա', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-ru', prompt: 'Повтори синхронизацию офлайн очереди', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
  { id: 'retry-offline-action-send-ru', prompt: 'Отправь очередь действий сейчас', surface: 'provider' as const, expectedAction: 'retry_offline_action' },
] as const;
