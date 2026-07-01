export type GetManageLinkDelivery = 'link_only' | 'email' | 'sms' | 'auto';

export type GetManageLinkPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'get_manage_link';
  rescueReason: 'manage_link';
  guestLookup?: boolean;
  delivery?: GetManageLinkDelivery;
};

export const CUSTOMER_GET_MANAGE_LINK_CLASSIFIER_RULES = `- get_manage_link: READ — signed-in customer: return the self-service manage URL to cancel/reschedule their booking. Uses session bookingId or next upcoming visit. Triggers: "Get manage link for my booking", "Send me my booking manage link", "Show my appointment self-service link", "I need the cancel link for my appointment". NOT guest_pay_cash_manage (guest book + pay cash + email manage link compound); NOT recover_lost_manage_link (lost confirmation or guest email/phone resend), NOT explain_manage_booking_page (manage page UX overview), NOT sign_in_to_manage_booking (why manage page asks to sign in), NOT share_my_booking (share with partner/friend), NOT cancel_my_booking|reschedule_my_booking (mutate), NOT confirm_my_booking_details (summary only), NOT get_directions_to_salon.`;

export const GET_MANAGE_LINK_PROMPTS: readonly GetManageLinkPromptFixture[] = [
  {
    id: 'manage-link-customer',
    prompt: 'Get manage link for my booking',
    surface: 'customer',
    expectedAction: 'get_manage_link',
    rescueReason: 'manage_link',
  },
  {
    id: 'send-manage-link-customer',
    prompt: 'Send me my booking manage link',
    surface: 'customer',
    expectedAction: 'get_manage_link',
    rescueReason: 'manage_link',
  },
  {
    id: 'reschedule-link-customer',
    prompt: 'Send me a link to change my booking',
    surface: 'customer',
    expectedAction: 'get_manage_link',
    rescueReason: 'manage_link',
  },
  {
    id: 'self-service-link-customer',
    prompt: 'Show my appointment self-service link',
    surface: 'customer',
    expectedAction: 'get_manage_link',
    rescueReason: 'manage_link',
  },
  {
    id: 'cancel-link-customer',
    prompt: 'I need the cancel link for my appointment',
    surface: 'customer',
    expectedAction: 'get_manage_link',
    rescueReason: 'manage_link',
  },
];

export const GET_MANAGE_LINK_RESCUE_SCENARIOS = [
  {
    id: 'share-to-manage-link',
    prompt: 'Send me a link to change my booking',
    misclassifiedAction: 'share_my_booking',
    expectedAction: 'get_manage_link' as const,
  },
  {
    id: 'confirm-to-manage-link',
    prompt: 'Get manage link for my booking',
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'get_manage_link' as const,
  },
] as const;
