export type ResumePendingPaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'resume_pending_payment';
  rescueReason: 'resume_pending_payment';
  pendingCheckout?: {
    sessionId: string;
    serviceId: string;
    startTime: string;
    employeeId?: string;
  };
};

export const RESUME_PENDING_PAYMENT_PROMPTS: readonly ResumePendingPaymentPromptFixture[] =
  [
    {
      id: 'continue-my-payment',
      prompt: 'Continue my payment',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'closed-app-mid-checkout',
      prompt: 'I closed the app mid-checkout',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'resume-my-checkout',
      prompt: 'Resume my checkout',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'pick-up-where-left-off',
      prompt: 'Pick up where I left off on payment',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'app-closed-while-paying',
      prompt: 'I was paying and the app closed',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'restore-pending-payment',
      prompt: 'Restore my pending booking payment',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'back-to-started-checkout',
      prompt: 'Take me back to checkout I started',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'left-during-stripe',
      prompt: 'I left during Stripe checkout',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'abandoned-checkout',
      prompt: 'Continue checkout I abandoned',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'did-not-finish-paying',
      prompt: "I didn't finish paying",
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'interrupted-checkout-restore',
      prompt: 'I interrupted checkout — can you restore it?',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'mid-checkout-close-app',
      prompt: 'Mid checkout I had to close the app',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
  ] as const;

export const RESUME_PENDING_PAYMENT_RESCUE_SCENARIOS = [
  {
    id: 'pay-online-to-resume',
    prompt: 'I closed the app mid-checkout',
    misclassifiedAction: 'pay_online',
    expectedAction: 'resume_pending_payment',
  },
  {
    id: 'unknown-to-resume',
    prompt: 'Continue my payment',
    misclassifiedAction: 'unknown',
    expectedAction: 'resume_pending_payment',
  },
  {
    id: 'booking-help-to-resume',
    prompt: 'Pick up where I left off on payment',
    misclassifiedAction: 'booking_help',
    expectedAction: 'resume_pending_payment',
  },
] as const;

export const RESUME_PENDING_PAYMENT_HANDLER_FIXTURES = [
  {
    id: 'handler-with-pending',
    pending: {
      sessionId: 'cs_test_resume',
      serviceId: 'svc-haircut',
      startTime: '2026-06-25T14:00:00.000Z',
      employeeId: 'emp-1',
    },
  },
] as const;
