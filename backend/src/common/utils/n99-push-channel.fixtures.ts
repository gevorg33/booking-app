export const N99_PUSH_TYPE_CHANNEL_SCENARIOS: Array<{
  id: string;
  pushType:
    | 'result_ready'
    | 'lab_booking_request'
    | 'booking_confirmed'
    | 'booking_reminder'
    | 'booking_rescheduled'
    | 'booking_cancelled'
    | 'gift_card_received'
    | 'rebooking_nudge'
    | 'win_back'
    | 'activation_concierge';
  channelId: N99PushChannelId;
  category: 'reminders' | 'offers' | 'news';
  transactional: boolean;
}> = [
  {
    id: 'booking-confirmed-transactional',
    pushType: 'booking_confirmed',
    channelId: 'booking_alerts',
    category: 'reminders',
    transactional: true,
  },
  {
    id: 'booking-reminder-transactional',
    pushType: 'booking_reminder',
    channelId: 'booking_alerts',
    category: 'reminders',
    transactional: true,
  },
  {
    id: 'clinic-result-transactional',
    pushType: 'result_ready',
    channelId: 'clinic_alerts',
    category: 'reminders',
    transactional: true,
  },
  {
    id: 'lab-booking-transactional',
    pushType: 'lab_booking_request',
    channelId: 'clinic_alerts',
    category: 'reminders',
    transactional: true,
  },
  {
    id: 'gift-card-transactional',
    pushType: 'gift_card_received',
    channelId: 'booking_alerts',
    category: 'reminders',
    transactional: true,
  },
  {
    id: 'rebooking-marketing',
    pushType: 'rebooking_nudge',
    channelId: 'marketing_offers',
    category: 'offers',
    transactional: false,
  },
  {
    id: 'win-back-marketing',
    pushType: 'win_back',
    channelId: 'marketing_offers',
    category: 'offers',
    transactional: false,
  },
  {
    id: 'activation-concierge-marketing',
    pushType: 'activation_concierge',
    channelId: 'marketing_offers',
    category: 'offers',
    transactional: false,
  },
] as const;

export const N99_PUSH_CHANNEL_IDS = [
  'booking_alerts',
  'clinic_alerts',
  'marketing_offers',
] as const;

export type N99PushChannelId = (typeof N99_PUSH_CHANNEL_IDS)[number];

export const N99_TRANSACTIONAL_PUSH_CHANNELS = new Set<N99PushChannelId>([
  'booking_alerts',
  'clinic_alerts',
]);

export const N99_TRANSACTIONAL_REACHABILITY_SCENARIOS = [
  {
    id: 'transactional-provisional',
    props: {
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    },
    expected: true,
  },
  {
    id: 'marketing-scope-excluded',
    props: {
      pushReachability: true,
      pushReachabilityScope: 'marketing',
      pushPermissionState: 'full',
    },
    expected: false,
  },
  {
    id: 'legacy-reachable-without-scope',
    props: { pushReachability: true, pushPermissionState: 'default_on' },
    expected: true,
  },
  {
    id: 'reminders-pref-off',
    props: {
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'full',
      pushReminders: false,
    },
    expected: false,
  },
] as const;
