export const PUSH_PERMISSION_STATES = [
  'full',
  'provisional',
  'default_on',
  'denied',
  'prompt',
  'unknown',
] as const;

export type PushPermissionState = (typeof PUSH_PERMISSION_STATES)[number];

export const PUSH_REACHABLE_STATES = new Set<PushPermissionState>([
  'full',
  'provisional',
  'default_on',
]);

export const PUSH_REACHABILITY_REGISTERED_KEY = 'consumer_push_reachability_registered';
export const PUSH_PERMISSION_STATE_KEY = 'consumer-push-permission-state';
export const PUSH_PROVISIONAL_ENGAGED_KEY = 'consumer_push_provisional_engaged';
export const PUSH_SETTINGS_REASK_KEY = 'consumer_push_settings_reask_shown';
export const PUSH_PROVISIONAL_UPGRADE_SHOWN_KEY = 'consumer_push_provisional_upgrade_shown';
export const ANDROID_POST_BOOKING_REQUESTED_KEY = 'consumer_android_post_booking_requested';

export const ANDROID_POST_NOTIFICATIONS_MIN_SDK = 33;

export const PUSH_REACHABILITY_SCENARIOS = [
  {
    id: 'full-is-reachable',
    state: 'full' as const,
    expectedReachable: true,
  },
  {
    id: 'provisional-is-reachable',
    state: 'provisional' as const,
    expectedReachable: true,
  },
  {
    id: 'default-on-is-reachable',
    state: 'default_on' as const,
    expectedReachable: true,
  },
  {
    id: 'denied-not-reachable',
    state: 'denied' as const,
    expectedReachable: false,
  },
] as const;

export const PUSH_REASK_SCENARIOS = [
  {
    id: 'denied-second-booking',
    permission: 'denied' as const,
    completedBookingCount: 2,
    reaskShown: false,
    expected: true,
  },
  {
    id: 'denied-already-reasked',
    permission: 'denied' as const,
    completedBookingCount: 2,
    reaskShown: true,
    expected: false,
  },
  {
    id: 'prompt-no-reask',
    permission: 'prompt' as const,
    completedBookingCount: 2,
    reaskShown: false,
    expected: false,
  },
] as const;

export const PROVISIONAL_UPGRADE_SCENARIOS = [
  {
    id: 'provisional-after-engagement',
    permission: 'provisional' as const,
    engaged: true,
    upgradeShown: false,
    expected: true,
  },
  {
    id: 'provisional-not-engaged',
    permission: 'provisional' as const,
    engaged: false,
    upgradeShown: false,
    expected: false,
  },
  {
    id: 'full-no-upgrade',
    permission: 'full' as const,
    engaged: true,
    upgradeShown: false,
    expected: false,
  },
] as const;
