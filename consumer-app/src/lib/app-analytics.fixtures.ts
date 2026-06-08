import type { AppAnalyticsEvent, AppAnalyticsEventProps } from './app-analytics.js';

export const APP_ANALYTICS_EVENTS = [
  'app_installed',
  'app_opened',
  'signed_in',
  'viewed_salon',
  'started_booking',
  'completed_booking',
  'rebooked',
  'referral_sent',
  'onboarding_started',
  'onboarding_step_viewed',
  'booking_abandoned',
  'booking_resumed',
  'push_priming_shown',
  'push_priming_accepted',
  'push_priming_declined',
  'post_booking_sign_in_shown',
  'post_booking_sign_in_completed',
  'post_booking_sign_in_skipped',
  'activation_payment_fallback',
] as const satisfies readonly AppAnalyticsEvent[];

export const APP_ANALYTICS_CONSUMER_SCENARIOS: Array<{
  id: string;
  event: AppAnalyticsEvent;
  props?: AppAnalyticsEventProps;
}> = [
  { id: 'installed', event: 'app_installed' },
  { id: 'opened', event: 'app_opened' },
  { id: 'signed-in', event: 'signed_in' },
  { id: 'viewed-salon', event: 'viewed_salon' },
  { id: 'started-booking', event: 'started_booking', props: { serviceId: 'svc-1' } },
  { id: 'completed-booking', event: 'completed_booking', props: { bookingId: 'bk-1' } },
  { id: 'rebooked', event: 'rebooked', props: { bookingId: 'bk-2' } },
  { id: 'referral-sent', event: 'referral_sent', props: { referralCode: 'FRIEND10' } },
];
