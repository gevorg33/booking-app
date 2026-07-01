export type ExplainMultiServicePaymentReturnAspect =
  | 'paid_not_confirmed'
  | 'return_from_stripe'
  | 'confirm_after_browser'
  | 'generic'
  | 'all';

export type ExplainMultiServicePaymentReturnPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_multi_service_payment_return';
  rescueReason: 'explain_multi_service_payment_return';
  aspect?: ExplainMultiServicePaymentReturnAspect;
};

export const CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES = `- explain_multi_service_payment_return: READ — customer app only: explain how to finish a multi-service visit after opening Stripe in the browser (spa day / 2+ services in cartServiceIds). User paid or returned from checkout but bookings are not confirmed yet. Triggers: "I paid but booking not confirmed", "Return from Stripe for spa day", "Payment went through but appointments not booked", "I completed payment — now what?". Uses pendingMultiCheckoutPayment session when present; navigate to multi-service checkout with services + session_id. NOT diagnose_stripe_checkout_failure (payment failed/declined), NOT resume_pending_payment (single-service pending checkout), NOT resume_booking_draft, NOT book_multi_service (create booking), NOT explain_multi_service_cart (cart contents/duration only), NOT confirm_my_booking_details (already confirmed booking).`;

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS: readonly ExplainMultiServicePaymentReturnPromptFixture[] =
  [
    {
      id: 'paid-not-confirmed-customer',
      prompt: 'I paid but booking not confirmed',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'return-stripe-spa-day-customer',
      prompt: 'Return from Stripe for spa day',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'return_from_stripe',
    },
    {
      id: 'paid-spa-no-confirmation-customer',
      prompt: 'Paid for my spa day but no confirmation',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'finished-browser-payment-customer',
      prompt: 'I finished paying in the browser — now what?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'confirm_after_browser',
    },
    {
      id: 'back-from-stripe-multi-customer',
      prompt: 'Back from Stripe — confirm my multi-service booking',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'return_from_stripe',
    },
    {
      id: 'payment-through-not-booked-customer',
      prompt: 'Payment went through but appointments not booked',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'completed-payment-nothing-customer',
      prompt: 'I completed payment but nothing happened',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'how-confirm-multi-stripe-customer',
      prompt: 'How do I confirm after multi-service Stripe checkout?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'confirm_after_browser',
    },
    {
      id: 'stripe-done-pending-customer',
      prompt: 'Stripe checkout done — booking still pending',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'paid-massage-facial-customer',
      prompt: 'Paid for massage and facial but not confirmed',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
    {
      id: 'return-after-multi-pay-customer',
      prompt: 'Return here after paying for multiple services',
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'return_from_stripe',
    },
    {
      id: 'multi-payment-succeeded-customer',
      prompt: "My multi-service payment succeeded — where's my booking?",
      surface: 'customer',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
      aspect: 'paid_not_confirmed',
    },
  ] as const;

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_HANDLER_FIXTURES = [
  {
    id: 'paid-not-confirmed',
    prompt: 'I paid but booking not confirmed',
    aspect: 'paid_not_confirmed',
    params: {
      cartServiceIds: ['svc-massage', 'svc-facial'],
      pendingMultiCheckoutSessionId: 'cs_test_123',
    },
  },
  {
    id: 'return-from-stripe',
    prompt: 'Return from Stripe for spa day',
    aspect: 'return_from_stripe',
    params: {
      cartServiceIds: ['svc-a', 'svc-b'],
    },
  },
  {
    id: 'confirm-after-browser',
    prompt: 'I finished paying in the browser — now what?',
    aspect: 'confirm_after_browser',
    params: {},
  },
] as const;

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-multi-payment-return',
    prompt: 'I paid but booking not confirmed',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_multi_service_payment_return',
  },
  {
    id: 'book-multi-to-payment-return',
    prompt: 'Return from Stripe for spa day',
    misclassifiedAction: 'book_multi_service',
    expectedAction: 'explain_multi_service_payment_return',
  },
  {
    id: 'resume-pending-steal-guard',
    prompt: 'Paid for massage and facial but not confirmed',
    misclassifiedAction: 'resume_pending_payment',
    expectedAction: 'explain_multi_service_payment_return',
  },
  {
    id: 'diagnose-stripe-steal-guard',
    prompt: 'Payment went through but appointments not booked',
    misclassifiedAction: 'diagnose_stripe_checkout_failure',
    expectedAction: 'explain_multi_service_payment_return',
  },
] as const;
