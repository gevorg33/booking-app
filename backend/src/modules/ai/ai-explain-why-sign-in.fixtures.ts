export type ExplainWhySignInAspect =
  | 'required'
  | 'benefits'
  | 'guest_vs_signed_in'
  | 'history'
  | 'how_to'
  | 'all';

export type ExplainWhySignInPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_why_sign_in';
  rescueReason: 'why_sign_in';
  aspect?: ExplainWhySignInAspect;
};

export const CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES = `- explain_why_sign_in: READ — explain why signing in is optional or helpful on the consumer app or public booking page: guest checkout works without an account, signed-in benefits (faster pre-filled checkout, My appointments history, manage visits, loyalty points, packages/subscriptions on account, saved salons). Triggers: "Do I need an account?", "What's the benefit of signing in?", "Why should I log in?", "Guest vs signed-in checkout", "Can I see my past appointments without signing in?". Set aspect when clear (required|benefits|guest_vs_signed_in|history|how_to|all). NOT explain_guest_checkout_fields (why email/phone/name fields or contact merge mechanics on the form), NOT sign_in_after_booking (PostBookingSignInPrompt after confirmation), NOT explain_manage_booking_page (manage page UX overview), NOT sign_in_to_manage_booking (manage link sign-in hint), NOT booking_help (full funnel walkthrough), NOT explain_data_rights (GDPR export/delete), NOT get_manage_link (resend manage URL), NOT cancel_my_booking|reschedule_my_booking ("can I cancel/reschedule my appointment?" — mutate self-service, not sign-in FAQ), NOT get_my_locale|update_my_locale ("what language is my account set to?" / switch language — locale, not sign-in).`;

export const EXPLAIN_WHY_SIGN_IN_PROMPTS: readonly ExplainWhySignInPromptFixture[] =
  [
    {
      id: 'need-account-customer',
      prompt: 'Do I need an account?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'benefit-signing-in-customer',
      prompt: "What's the benefit of signing in?",
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'why-sign-in-customer',
      prompt: 'Why should I sign in before booking?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'without-account-customer',
      prompt: 'Can I book without an account?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'sign-up-required-customer',
      prompt: 'Do I need to sign up to book an appointment?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'guest-vs-signed-in-customer',
      prompt: 'What is the difference between guest checkout and signing in?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'guest_vs_signed_in',
    },
    {
      id: 'account-history-customer',
      prompt: 'Can I see my past appointments without signing in?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'history',
    },
    {
      id: 'what-get-with-account-customer',
      prompt: 'What do I get with an account?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'is-account-required-customer',
      prompt: 'Is an account required to book here?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'how-to-sign-in-customer',
      prompt: 'How do I sign in?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'how_to',
    },
    {
      id: 'stay-as-guest-customer',
      prompt: 'What happens if I stay as a guest?',
      surface: 'customer',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'guest_vs_signed_in',
    },
    {
      id: 'need-account-public',
      prompt: 'Do I need an account to book on this page?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'benefit-signing-in-public',
      prompt: 'Why sign in on the booking page?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'without-account-public',
      prompt: 'Can I book without creating an account on this page?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'required',
    },
    {
      id: 'guest-checkout-public',
      prompt: 'Can I complete guest checkout without signing in?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'guest_vs_signed_in',
    },
    {
      id: 'worth-creating-account-public',
      prompt: 'Is it worth creating an account?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'manage-appointments-public',
      prompt: 'Do I need to log in to manage my appointments?',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'benefits',
    },
    {
      id: 'explain-sign-in-public',
      prompt: 'Explain why I might want to sign in',
      surface: 'public',
      expectedAction: 'explain_why_sign_in',
      rescueReason: 'why_sign_in',
      aspect: 'all',
    },
  ] as const;

export const EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-guest-checkout-fields',
    prompt: "What's the benefit of signing in?",
    misclassifiedAction: 'explain_guest_checkout_fields',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-booking-help',
    prompt: 'Do I need an account?',
    misclassifiedAction: 'booking_help',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-data-rights',
    prompt: 'Can I book without an account?',
    misclassifiedAction: 'explain_data_rights',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-sign-in-after-booking',
    prompt: 'Why should I sign in before booking?',
    misclassifiedAction: 'sign_in_after_booking',
    surface: 'customer' as const,
  },
] as const;
