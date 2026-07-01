export type ManageBookingPageAspect =
  | 'capabilities'
  | 'invalid_link'
  | 'guest_token'
  | 'package_visit'
  | 'all';

export type ExplainManageBookingPagePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_manage_booking_page';
  rescueReason: 'manage_booking_page';
  aspect?: ManageBookingPageAspect;
};

export const CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES = `- explain_manage_booking_page: READ — customer app or public booking web: explain the guest ManageBookingPage UX — view appointment or package-visit details, cancel/reschedule when policy allows, invalid-link errors when bookingId/token are missing or expired, and the My appointments sign-in path. Triggers: "What can I do on this manage page?", "Invalid manage link", "Explain the manage booking page", "What does the manage link page show?", "How does guest manage work?". Set aspect to capabilities|invalid_link|guest_token|package_visit|all when clear. Navigate to /manage when bookingId+token are available. NOT sign_in_to_manage_booking (why sign-in is required on manage page), NOT recover_lost_manage_link (resend lost URL), NOT get_manage_link (signed-in manage URL), NOT cancel_my_booking|reschedule_my_booking (mutate without explain framing), NOT booking_help (full booking funnel), NOT confirm_my_booking_details (summary only).`;

const EXPLAIN_MANAGE_BOOKING_PAGE_EN_PROMPTS = [
  {
    id: 'what-can-i-do-manage-page',
    prompt: 'What can I do on this manage page?',
    aspect: 'capabilities' as const,
  },
  {
    id: 'invalid-manage-link',
    prompt: 'Invalid manage link',
    aspect: 'invalid_link' as const,
  },
  {
    id: 'explain-manage-booking-page',
    prompt: 'Explain the manage booking page',
    aspect: 'all' as const,
  },
  {
    id: 'what-is-manage-page-for',
    prompt: 'What is this manage page for?',
    aspect: 'capabilities' as const,
  },
  {
    id: 'manage-page-options',
    prompt: 'What options do I have on the booking manage page?',
    aspect: 'capabilities' as const,
  },
  {
    id: 'help-manage-page',
    prompt: 'Help with the manage page',
    aspect: 'all' as const,
  },
  {
    id: 'what-manage-link-shows',
    prompt: 'What does the manage link page show?',
    aspect: 'capabilities' as const,
  },
  {
    id: 'cancel-reschedule-on-manage-page',
    prompt: 'Can I cancel or reschedule on the manage page?',
    aspect: 'capabilities' as const,
  },
  {
    id: 'how-guest-manage-works',
    prompt: 'How does the guest manage page work?',
    aspect: 'guest_token' as const,
  },
  {
    id: 'manage-booking-page-help',
    prompt: 'Manage booking page help',
    aspect: 'all' as const,
  },
] as const;

function buildExplainManageBookingPagePrompts(): ExplainManageBookingPagePromptFixture[] {
  const rows: ExplainManageBookingPagePromptFixture[] = [];
  for (const entry of EXPLAIN_MANAGE_BOOKING_PAGE_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        expectedAction: 'explain_manage_booking_page',
        aspect: entry.aspect,
        rescueReason: 'manage_booking_page',
      });
    }
  }
  return rows;
}

export const EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS: readonly ExplainManageBookingPagePromptFixture[] =
  buildExplainManageBookingPagePrompts();

export const EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS = [
  {
    id: 'sign-in-to-explain-manage-page',
    prompt: 'What can I do on this manage page?',
    misclassifiedAction: 'sign_in_to_manage_booking',
    expectedAction: 'explain_manage_booking_page' as const,
  },
  {
    id: 'booking-help-to-explain-manage-page',
    prompt: 'Explain the manage booking page',
    misclassifiedAction: 'booking_help',
    expectedAction: 'explain_manage_booking_page' as const,
  },
  {
    id: 'get-manage-link-to-explain',
    prompt: 'What options do I have on the booking manage page?',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'explain_manage_booking_page' as const,
  },
  {
    id: 'cancel-to-explain-manage-page',
    prompt: 'Can I cancel or reschedule on the manage page?',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'explain_manage_booking_page' as const,
  },
] as const;
