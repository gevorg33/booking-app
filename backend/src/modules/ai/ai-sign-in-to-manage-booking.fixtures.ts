export type SignInToManageBookingAspect =
  | 'manage_hint'
  | 'invalid_link'
  | 'account_path'
  | 'how_to'
  | 'all';

export type SignInToManageBookingPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'sign_in_to_manage_booking';
  rescueReason: 'sign_in_to_manage_booking';
  aspect?: SignInToManageBookingAspect;
};

export const CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES = `- sign_in_to_manage_booking: READ — explain the ManageBookingPage sign-in hint when a guest cannot cancel/reschedule with a manage token alone: sign in to manage from your account, use My appointments after login, or open a valid manage link from confirmation email/SMS. Triggers: "Sign in to change my appointment", "Manage link says sign in", "Why do I need to sign in to reschedule?", "My manage link is invalid — should I sign in?". Set aspect when clear (manage_hint|invalid_link|account_path|how_to|all). NOT explain_manage_booking_page (manage page capabilities/invalid-link UX overview), NOT recover_lost_manage_link (resend lost manage URL), NOT get_manage_link (show manage URL when signed in), NOT explain_why_sign_in (generic account benefits), NOT sign_in_after_booking (post-checkout save prompt), NOT cancel_my_booking|reschedule_my_booking (mutate when signed in), NOT list_my_appointments (list only).`;

export const SIGN_IN_TO_MANAGE_BOOKING_PROMPTS: readonly SignInToManageBookingPromptFixture[] =
  [
    {
      id: 'sign-in-change-appointment-customer',
      prompt: 'Sign in to change my appointment',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'manage-link-says-sign-in-customer',
      prompt: 'Manage link says sign in',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'why-sign-in-reschedule-customer',
      prompt: 'Why do I need to sign in to reschedule?',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'sign-in-cancel-manage-page-customer',
      prompt: 'Sign in to cancel my booking from the manage page',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'manage-from-account-customer',
      prompt: 'Sign in to manage from your account',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'account_path',
    },
    {
      id: 'cant-reschedule-without-sign-in-customer',
      prompt: "Why can't I reschedule without signing in?",
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'manage-page-sign-in-hint-public',
      prompt: 'The manage page says sign in to manage from your account',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'invalid-manage-link-public',
      prompt: 'My manage link is invalid — should I sign in?',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'invalid_link',
    },
    {
      id: 'expired-link-sign-in-public',
      prompt: 'Manage booking link expired what should I do sign in?',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'invalid_link',
    },
    {
      id: 'log-in-change-visit-public',
      prompt: 'Do I need to log in to change my visit on the manage page?',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'how-sign-in-manage-public',
      prompt: 'How do I sign in to manage my booking?',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'how_to',
    },
    {
      id: 'manage-telling-sign-in-public',
      prompt: 'Manage booking page telling me to sign in',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
  ] as const;

export const SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-explain-why-sign-in',
    prompt: 'Sign in to change my appointment',
    misclassifiedAction: 'explain_why_sign_in',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-get-manage-link',
    prompt: 'Manage link says sign in',
    misclassifiedAction: 'get_manage_link',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-booking-help',
    prompt: 'Why do I need to sign in to reschedule?',
    misclassifiedAction: 'booking_help',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-sign-in-after-booking',
    prompt: 'Sign in to manage from your account',
    misclassifiedAction: 'sign_in_after_booking',
    surface: 'customer' as const,
  },
] as const;
