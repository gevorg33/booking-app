export type ResumeBookingDraftPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'resume_booking_draft';
  rescueReason: 'resume_booking_draft';
};

export const CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES = `- resume_booking_draft: READ — customer app or public booking web: restore an in-progress booking draft saved on this device (BookingDraft localStorage) after the user left mid-booking before payment. Triggers: "Continue where I left off", "Restore my half-finished booking", "Continue my unfinished booking", "Go back to the booking I started". Requires bookingDraft or bookingDraftSlug + bookingDraftServiceId in session from device storage. Returns navigate to book page with resume=1 and saved slot/service/date. NOT resume_pending_payment (Stripe checkout / payment session restore — customer app only), NOT book_appointment (start fresh), NOT confirm_my_booking_details (already confirmed booking), NOT pay_online, NOT booking_help (generic guide).`;

export const RESUME_BOOKING_DRAFT_PROMPTS: readonly ResumeBookingDraftPromptFixture[] =
  [
    {
      id: 'continue-where-left-off-customer',
      prompt: 'Continue where I left off',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-half-finished-booking-customer',
      prompt: 'Restore my half-finished booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-unfinished-booking-customer',
      prompt: 'Continue my unfinished booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'pick-up-booking-left-off-customer',
      prompt: 'Pick up where I left off booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'go-back-started-booking-customer',
      prompt: 'Go back to the booking I started',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'resume-my-booking-customer',
      prompt: 'Resume my booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'finish-booking-started-customer',
      prompt: 'Finish the booking I started',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-in-progress-booking-customer',
      prompt: 'Restore my in-progress booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-abandoned-booking-customer',
      prompt: 'Continue the booking I abandoned',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'take-me-back-booking-customer',
      prompt: 'Take me back to my half-done booking',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-saved-booking-customer',
      prompt: 'Restore my saved booking draft',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-booking-below-customer',
      prompt: 'Continue my booking below',
      surface: 'customer',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-where-left-off-public',
      prompt: 'Continue where I left off',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-half-finished-booking-public',
      prompt: 'Restore my half-finished booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-unfinished-booking-public',
      prompt: 'Continue my unfinished booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'pick-up-booking-left-off-public',
      prompt: 'Pick up where I left off booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'go-back-started-booking-public',
      prompt: 'Go back to the booking I started',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'resume-my-booking-public',
      prompt: 'Resume my booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'finish-booking-started-public',
      prompt: 'Finish the booking I started',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-in-progress-booking-public',
      prompt: 'Restore my in-progress booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-abandoned-booking-public',
      prompt: 'Continue the booking I abandoned',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'take-me-back-booking-public',
      prompt: 'Take me back to my half-done booking',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'restore-saved-booking-public',
      prompt: 'Restore my saved booking draft',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'continue-booking-below-public',
      prompt: 'Continue my booking below',
      surface: 'public',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
  ] as const;

export const RESUME_BOOKING_DRAFT_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-resume-draft',
    prompt: 'Continue where I left off',
    misclassifiedAction: 'unknown',
    expectedAction: 'resume_booking_draft',
  },
  {
    id: 'booking-help-to-resume-draft',
    prompt: 'Restore my half-finished booking',
    misclassifiedAction: 'booking_help',
    expectedAction: 'resume_booking_draft',
  },
  {
    id: 'book-appointment-to-resume-draft',
    prompt: 'Continue my unfinished booking',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'resume_booking_draft',
  },
  {
    id: 'resume-payment-steal-guard',
    prompt: 'Continue where I left off',
    misclassifiedAction: 'resume_pending_payment',
    expectedAction: 'resume_booking_draft',
  },
] as const;

export const RESUME_BOOKING_DRAFT_HANDLER_FIXTURES = [
  {
    id: 'confirm-step',
    draft: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      employeeId: 'emp-1',
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    abandonedStep: 'confirm' as const,
  },
  {
    id: 'slot-step',
    draft: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    abandonedStep: 'slot' as const,
  },
  {
    id: 'service-step',
    draft: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      employeeId: 'emp-1',
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    abandonedStep: 'service' as const,
  },
] as const;
