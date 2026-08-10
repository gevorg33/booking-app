/** prov-exp-1 / ai-cmd-provider-5.10.2 — provider mobile open the booking referenced by a push notification. */

export const PROVIDER_OPEN_BOOKING_FROM_PUSH_CLASSIFIER_RULES = `- open_booking_from_push: READ — open the booking/appointment referenced by the most recent push notification or alert. Triggers: open booking from alert, show me that notification appointment, go to the booking from that push. Requires bookingId (inherit from lastPush). NOT explain_last_push (explains what the push said, doesn't navigate), NOT dismiss_push (clears the notification without opening anything).`;

export const PROVIDER_OPEN_BOOKING_FROM_PUSH_PROMPT_SCENARIOS = [
  {
    id: 'open-booking-from-push-alert-en',
    prompt: 'Open booking from alert',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-show-notification-en',
    prompt: 'Show me that notification appointment',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-open-that-en',
    prompt: 'Open the booking from that push notification',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-view-en',
    prompt: 'View my appointment from the notification',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-go-to-en',
    prompt: 'Go to the booking from that alert',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-show-this-en',
    prompt: 'Show the appointment from this notification',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-navigate-en',
    prompt: 'Navigate to the booking from the push',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-banner-en',
    prompt: 'Open that appointment from the notification banner',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-take-me-en',
    prompt: 'Take me to that booking',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-jump-en',
    prompt: 'Jump to the appointment from the alert',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-hy',
    prompt: 'Բացիր ամրագրումը ծանուցումից',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-show-hy',
    prompt: 'Ցույց տուր ծանուցման ամրագրումը',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-ru',
    prompt: 'Открой бронирование из уведомления',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
  {
    id: 'open-booking-from-push-show-ru',
    prompt: 'Покажи запись из уведомления',
    surface: 'provider' as const,
    expectedAction: 'open_booking_from_push',
  },
] as const;
