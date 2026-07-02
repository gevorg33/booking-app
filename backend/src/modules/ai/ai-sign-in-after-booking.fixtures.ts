export type SignInAfterBookingAspect =
  | 'save_to_account'
  | 'provider_sign_in'
  | 'merge_rules'
  | 'skip_dismiss'
  | 'how_it_works';

export type SignInAfterBookingFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'sign_in_after_booking';
  rescueReason: 'post_booking_sign_in';
  aspect?: SignInAfterBookingAspect;
};

export const CUSTOMER_SIGN_IN_AFTER_BOOKING_CLASSIFIER_RULES = `- sign_in_after_booking: READ — customer asks about saving a guest booking to their account after checkout (PostBookingSignInPrompt on booking confirmation): one-tap Google/Apple sign-in, guest → account merge, Maybe later skip. Triggers: save this booking to my account, sign in with Google after booking, what happens if I skip, will my guest booking merge. NOT explain_guest_checkout_fields (checkout form email/phone why), NOT explain_consumer_checkout_success (success screen walkthrough), NOT get_manage_link (manage URL), NOT leave_visit_review, NOT generic login help.`;

export const SIGN_IN_AFTER_BOOKING_PROMPTS: readonly SignInAfterBookingFixture[] =
  [
    {
      id: 'save-booking-account-customer',
      prompt: 'Save this booking to my account',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'save_to_account',
    },
    {
      id: 'google-after-booking-customer',
      prompt: 'Sign in with Google after booking',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'provider_sign_in',
    },
    {
      id: 'apple-after-booking-customer',
      prompt: 'Can I continue with Apple after my booking?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'provider_sign_in',
    },
    {
      id: 'why-save-prompt-customer',
      prompt: 'Why is it asking me to save my booking?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'save_to_account',
    },
    {
      id: 'merge-guest-booking-customer',
      prompt: 'Will my guest booking merge when I sign in?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'merge_rules',
    },
    {
      id: 'same-email-merge-customer',
      prompt: 'Do I need the same email to link my guest booking?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'merge_rules',
    },
    {
      id: 'maybe-later-customer',
      prompt: 'What happens if I tap Maybe later?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'skip_dismiss',
    },
    {
      id: 'skip-save-prompt-customer',
      prompt: 'Can I skip saving this booking to an account?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'skip_dismiss',
    },
    {
      id: 'post-booking-sign-in-customer',
      prompt: 'Explain the post-booking sign in prompt',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'how_it_works',
    },
    {
      id: 'guest-account-after-checkout-customer',
      prompt: 'How do I turn my guest checkout into an account?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'how_it_works',
    },
    {
      id: 'one-tap-after-booking-customer',
      prompt: 'What does one tap sign in do after I book?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'how_it_works',
    },
    {
      id: 'save-confirmation-customer',
      prompt: 'How do I save my appointment on the confirmation screen?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'save_to_account',
    },
  ];

export const SIGN_IN_AFTER_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-guest-checkout',
    prompt: 'Save this booking to my account',
    misclassifiedAction: 'explain_guest_checkout_fields',
    expectedAction: 'sign_in_after_booking' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Sign in with Google after booking',
    misclassifiedAction: 'unknown',
    expectedAction: 'sign_in_after_booking' as const,
  },
  {
    id: 'misclassified-manage-link',
    prompt: 'Will my guest booking merge when I sign in?',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'sign_in_after_booking' as const,
  },
] as const;

export const SIGN_IN_AFTER_BOOKING_BOUNDARY_PROMPTS = [
  {
    id: 'guest-checkout-email-why',
    prompt: 'Why do you need my email on checkout?',
    surface: 'customer' as const,
  },
  {
    id: 'book-without-account',
    prompt: 'Can I book without an account?',
    surface: 'customer' as const,
  },
  {
    id: 'manage-link-resend',
    prompt: 'Resend manage link to john@example.com',
    surface: 'customer' as const,
  },
];
