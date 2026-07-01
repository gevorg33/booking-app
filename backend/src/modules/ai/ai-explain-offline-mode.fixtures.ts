export type ExplainOfflineModeAspect =
  | 'why_offline'
  | 'will_sync'
  | 'queued_changes'
  | 'cached_browse'
  | 'how_it_works';

export type ExplainOfflineModeFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_offline_mode';
  rescueReason: 'consumer_offline';
  aspect?: ExplainOfflineModeAspect;
};

export const CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES = `- explain_offline_mode: READ — signed-in customer asks why the consumer app shows offline, whether queued booking changes will sync, or how offline mode works (ConsumerOfflineBanner / offlineStatus*). Triggers: why does it say offline, will my booking sync, changes waiting to sync, saved salon info offline. Explains cancel/reschedule queue replay on reconnect. NOT offline_queue_status (provider mobile queue read), NOT retry_offline_action (provider mutate replay), NOT explain_last_push (provider push).`;

export const EXPLAIN_OFFLINE_MODE_PROMPTS: readonly ExplainOfflineModeFixture[] =
  [
    {
      id: 'why-offline-customer',
      prompt: 'Why does it say offline?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'why_offline',
    },
    {
      id: 'will-booking-sync-customer',
      prompt: 'Will my booking sync?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
    {
      id: 'sync-when-back-customer',
      prompt: 'Will my changes sync when I am back online?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
    {
      id: 'waiting-to-sync-customer',
      prompt: 'How many changes are waiting to sync?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'queued_changes',
    },
    {
      id: 'queued-cancel-customer',
      prompt: 'I canceled offline — will it go through?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
    {
      id: 'offline-banner-customer',
      prompt: 'What does the offline banner mean?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'why_offline',
    },
    {
      id: 'no-internet-customer',
      prompt: 'The app says I have no internet',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'why_offline',
    },
    {
      id: 'cached-salon-customer',
      prompt: 'Why am I seeing saved salon info?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'cached_browse',
    },
    {
      id: 'offline-mode-work-customer',
      prompt: 'How does offline mode work in this app?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'how_it_works',
    },
    {
      id: 'reschedule-offline-customer',
      prompt: 'Can I reschedule while offline?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'how_it_works',
    },
    {
      id: 'pending-sync-customer',
      prompt: 'What happens to pending sync actions?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'queued_changes',
    },
    {
      id: 'reconnect-sync-customer',
      prompt: 'When I reconnect will my cancel sync?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
  ];

export const EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-offline-queue-status',
    prompt: 'Why does it say offline?',
    misclassifiedAction: 'offline_queue_status',
    expectedAction: 'explain_offline_mode' as const,
  },
  {
    id: 'misclassified-retry-offline',
    prompt: 'Will my booking sync?',
    misclassifiedAction: 'retry_offline_action',
    expectedAction: 'explain_offline_mode' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'How many changes are waiting to sync?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_offline_mode' as const,
  },
] as const;

export const EXPLAIN_OFFLINE_MODE_BOUNDARY_PROMPTS = [
  {
    id: 'provider-offline-queue',
    prompt: 'Show offline queue status',
    surface: 'provider' as const,
  },
  {
    id: 'provider-retry-offline',
    prompt: 'Retry offline queued actions',
    surface: 'provider' as const,
  },
  {
    id: 'provider-last-push',
    prompt: 'Explain last push notification',
    surface: 'provider' as const,
  },
] as const;
