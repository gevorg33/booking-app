/** prov-exp-1 / ai-cmd-provider-5.0.1 — provider mobile confirm the booking referenced by a push notification. */

export const PROVIDER_CONFIRM_BOOKING_FROM_PUSH_CLASSIFIER_RULES = `- confirm_booking_from_push: MUTATE — same outcome as tapping Confirm on a new-booking push — requires bookingId (from lastPush or prompt). Triggers: confirm this booking from the push, confirm appointment from notification, accept the booking from that alert. NOT update_bookings (generic status branch without push context), NOT confirm_pending_booking (bulk/named confirm with no push context).`;

export const PROVIDER_CONFIRM_BOOKING_FROM_PUSH_PROMPT_SCENARIOS = [
  {
    id: 'confirm-booking-from-push-this-en',
    prompt: 'Confirm this booking from the push',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-notification-en',
    prompt: 'Confirm appointment from notification',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-accept-en',
    prompt: 'Accept the booking from that alert',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-approve-en',
    prompt: 'Approve the appointment from this notification',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-that-en',
    prompt: 'Confirm that booking from the push notification',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-banner-en',
    prompt: 'Confirm the appointment from the notification banner',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-accept-alert-en',
    prompt: 'Accept this booking from the alert',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-yes-en',
    prompt: 'Confirm it from the push notification',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-hy',
    prompt: 'Հաստատիր ամրագրումը ծանուցումից',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-accept-hy',
    prompt: 'Ընդունիր ամրագրումը ծանուցումից',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-ru',
    prompt: 'Подтверди бронирование из уведомления',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
  {
    id: 'confirm-booking-from-push-accept-ru',
    prompt: 'Прими запись из уведомления',
    surface: 'provider' as const,
    expectedAction: 'confirm_booking_from_push',
  },
] as const;
