/** ai-cmd-provider-6.3.6 — provider mobile: open a specific booking's detail screen. */

export const PROVIDER_OPEN_BOOKING_DETAIL_CLASSIFIER_RULES = `- open_booking_detail: READ — navigate to a specific booking's detail screen (own scope, or team scope for managers). Requires bookingId (from context) or a way to resolve exactly one match (customerName, clock-time). Triggers: "Open Jane's appointment", "Show me the booking details for Maria", "Open this booking". Uses GET …/bookings/:id. NOT show_appointments (a list, not a single detail screen), NOT open_booking_from_push (push-notification context specifically), NOT summarize_client/show_client_history (customer-centric, not booking-centric).`;

export interface ProviderOpenBookingDetailPromptFixture {
  id: string;
  prompt: string;
  expectedAction: 'open_booking_detail';
}

export const PROVIDER_OPEN_BOOKING_DETAIL_PROMPTS: readonly ProviderOpenBookingDetailPromptFixture[] =
  [
    {
      id: 'open-booking-detail-customer-name',
      prompt: "Open Jane's appointment",
      expectedAction: 'open_booking_detail',
    },
    {
      id: 'open-booking-detail-show-details',
      // Deliberately avoids the "show|list|display|view ... booking" pattern
      // (isShowAppointmentsPrompt, ai-provider-show-appointments.util.ts),
      // which would otherwise steal this phrase for the list-style intent.
      prompt: 'Pull up the booking details for Maria',
      expectedAction: 'open_booking_detail',
    },
    {
      id: 'open-booking-detail-this-booking',
      prompt: 'Open this booking',
      expectedAction: 'open_booking_detail',
    },
  ];
