/** ai-cmd-provider-5.13.1 — provider mobile: what's queued while offline / did an action save. */

export const PROVIDER_OFFLINE_QUEUE_STATUS_CLASSIFIER_RULES = `- offline_queue_status: READ — provider mobile only: what's currently queued in the offline sync queue, or whether a specific action (check-in, note, update) saved while offline (ProviderOfflineBanner). Triggers: what's queued offline, did my check-in save, show offline queue, how many actions are pending sync. NOT explain_offline_mode (why the app is offline / general offline behavior), NOT retry_offline_action (mutate — replays the queue).`;

export const PROVIDER_OFFLINE_QUEUE_STATUS_PROMPT_SCENARIOS = [
  {
    id: 'offline-queue-status-whats-queued-en',
    prompt: "What's queued offline?",
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-checkin-save-en',
    prompt: 'Did my check-in save?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-show-en',
    prompt: 'Show offline queue',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-how-many-en',
    prompt: 'How many actions are pending sync?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-queue-status-en',
    prompt: 'What is the offline queue status?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-note-save-en',
    prompt: 'Did my note save?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-payment-save-en',
    prompt: 'Did my payment save?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-queued-actions-en',
    prompt: 'What queued actions do I have right now?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-anything-pending-en',
    prompt: 'Is anything pending sync?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-check-queue-en',
    prompt: 'Check my offline queue',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-hy',
    prompt: 'Ի՞նչ է հերթում offline ռեժիմում',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-checkin-hy',
    prompt: 'Իմ check-in-ը պահվե՞ց offline ռեժիմում',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-ru',
    prompt: 'Что в очереди офлайн?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
  {
    id: 'offline-queue-status-checkin-ru',
    prompt: 'Мой check-in сохранился офлайн?',
    surface: 'provider' as const,
    expectedAction: 'offline_queue_status',
  },
] as const;
