export type RetryFailedNetworkActionAspect =
  | 'booking_not_saved'
  | 'sync_failed'
  | 'load_failed'
  | 'retry_queued'
  | 'generic'
  | 'all';

export type RetryFailedNetworkActionPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'retry_failed_network_action';
  rescueReason: 'retry_failed_network_action';
  aspect?: RetryFailedNetworkActionAspect;
};

export const CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES = `- retry_failed_network_action: READ — customer app only: retry after a network error blocked booking, sync, or page load (ConsumerNetworkErrorCard / networkRetryAction "Try again"). Triggers: "Booking didn't save — retry?", "Sync failed", "Try again", "Could not load — retry". Replays consumer offline queue when offlineQueueCount > 0 and online. NOT explain_offline_mode (why offline / will it sync without retry ask), NOT retry_offline_action (provider mobile offline queue mutate), NOT offline_queue_status (provider queue read), NOT diagnose_stripe_checkout_failure (payment failure).`;

export const RETRY_FAILED_NETWORK_ACTION_PROMPTS: readonly RetryFailedNetworkActionPromptFixture[] =
  [
    {
      id: 'booking-not-saved-retry-customer',
      prompt: "Booking didn't save — retry?",
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'booking_not_saved',
    },
    {
      id: 'sync-failed-customer',
      prompt: 'Sync failed',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'sync_failed',
    },
    {
      id: 'try-again-customer',
      prompt: 'Try again',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'generic',
    },
    {
      id: 'could-not-load-retry-customer',
      prompt: 'Could not load — retry',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'load_failed',
    },
    {
      id: 'network-error-retry-booking-customer',
      prompt: 'Network error — retry my booking',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'booking_not_saved',
    },
    {
      id: 'booking-failed-retry-customer',
      prompt: 'My booking failed — can you retry?',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'booking_not_saved',
    },
    {
      id: 'resync-failed-changes-customer',
      prompt: 'Resync my failed changes',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'sync_failed',
    },
    {
      id: 'connection-lost-retry-customer',
      prompt: 'Connection lost — retry save',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'booking_not_saved',
    },
    {
      id: 'offline-queue-retry-customer',
      prompt: 'Retry queued booking changes',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'retry_queued',
    },
    {
      id: 'submit-failed-retry-customer',
      prompt: 'Submit failed — try again',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'booking_not_saved',
    },
    {
      id: 'sync-stuck-retry-customer',
      prompt: 'Changes stuck syncing — retry',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'sync_failed',
    },
    {
      id: 'reload-failed-page-customer',
      prompt: 'Page failed to load — retry',
      surface: 'customer',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
      aspect: 'load_failed',
    },
  ] as const;

export const RETRY_FAILED_NETWORK_ACTION_HANDLER_FIXTURES = [
  {
    id: 'booking-not-saved-online',
    prompt: "Booking didn't save — retry?",
    aspect: 'booking_not_saved',
    params: { online: true, offlineQueueCount: 0 },
  },
  {
    id: 'sync-failed-with-queue',
    prompt: 'Sync failed',
    aspect: 'sync_failed',
    params: { online: true, offlineQueueCount: 2 },
  },
  {
    id: 'retry-queued-offline',
    prompt: 'Retry queued booking changes',
    aspect: 'retry_queued',
    params: { online: false, offlineQueueCount: 1 },
  },
] as const;

export const RETRY_FAILED_NETWORK_ACTION_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-network-retry',
    prompt: "Booking didn't save — retry?",
    misclassifiedAction: 'unknown',
    expectedAction: 'retry_failed_network_action',
  },
  {
    id: 'explain-offline-steal-guard',
    prompt: 'Sync failed',
    misclassifiedAction: 'explain_offline_mode',
    expectedAction: 'retry_failed_network_action',
  },
  {
    id: 'book-appointment-steal-guard',
    prompt: 'Network error — retry my booking',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'retry_failed_network_action',
  },
  {
    id: 'retry-offline-provider-steal-guard',
    prompt: 'Retry queued booking changes',
    misclassifiedAction: 'retry_offline_action',
    expectedAction: 'retry_failed_network_action',
  },
] as const;
