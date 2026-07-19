/**
 * e2e-bug.88 — pay_online was unreachable: "pay online for my … booking/appointment"
 * was stolen by confirm_my_booking_details / list_my_upcoming_appointments /
 * my_appointments because those detectors matched "my" + booking words first.
 */
export const E2E88_PAY_ONLINE_PROMPTS = [
  {
    id: 'e2e88-want-pay-online-facemassage-booking',
    prompt: 'I want to pay online for my facemassage booking',
    expectedAction: 'pay_online' as const,
    stolenBy: 'confirm_my_booking_details',
  },
  {
    id: 'e2e88-pay-online-now-upcoming-facemassage',
    prompt: 'pay online now for my upcoming facemassage appointment',
    expectedAction: 'pay_online' as const,
    stolenBy: 'list_my_upcoming_appointments',
  },
] as const;
