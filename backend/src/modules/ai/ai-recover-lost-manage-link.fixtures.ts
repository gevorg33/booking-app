import type { GetManageLinkDelivery } from './ai-get-manage-link.fixtures.js';

export type RecoverLostManageLinkPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'recover_lost_manage_link';
  rescueReason: 'recover_manage_link';
  delivery?: GetManageLinkDelivery;
  email?: string;
  phone?: string;
};

export const CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES = `- recover_lost_manage_link: READ — guest or visitor lost the booking confirmation email/SMS and needs the manage URL resent: lookup by email or phone from the prompt, resend via email/SMS when requested. Triggers: "I lost my booking confirmation email", "Resend manage link to john@example.com", "Text me the booking link at +1 555 123 4567", "I booked as a guest — email me the manage link". Set email/phone when extracted; delivery when clear (email|sms|auto). NOT get_manage_link (signed-in session manage URL without guest lookup), NOT explain_manage_booking_page (manage page UX overview), NOT sign_in_to_manage_booking (why manage page asks to sign in), NOT share_my_booking, NOT cancel_my_booking|reschedule_my_booking, NOT confirm_my_booking_details.`;

export const RECOVER_LOST_MANAGE_LINK_PROMPTS: readonly RecoverLostManageLinkPromptFixture[] =
  [
    {
      id: 'guest-lost-confirmation-customer',
      prompt: 'I lost my booking confirmation email',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
    {
      id: 'guest-lost-confirmation-public',
      prompt: 'I lost my booking confirmation email',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
    {
      id: 'guest-resend-email-customer',
      prompt: 'Resend manage link to john@example.com',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
      email: 'john@example.com',
    },
    {
      id: 'guest-resend-email-public',
      prompt: 'Resend manage link to john@example.com',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
      email: 'john@example.com',
    },
    {
      id: 'guest-email-lookup-customer',
      prompt: 'Send manage link to sarah@test.com',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
      email: 'sarah@test.com',
    },
    {
      id: 'guest-phone-text-customer',
      prompt: 'Text me the booking manage link at 5551234567',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'sms',
      phone: '5551234567',
    },
    {
      id: 'guest-phone-text-public',
      prompt: 'Text me the booking manage link at 5551234567',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'sms',
      phone: '5551234567',
    },
    {
      id: 'guest-booked-without-account-customer',
      prompt: 'I booked as a guest — email me the manage link at mia@salon.com',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
      email: 'mia@salon.com',
    },
    {
      id: 'resend-link-phone-customer',
      prompt: 'Resend my appointment link to 555-987-6543',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'sms',
      phone: '5559876543',
    },
    {
      id: 'missing-confirmation-sms-public',
      prompt: "I didn't get the confirmation text with my manage link",
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
    {
      id: 'resend-to-email-public',
      prompt: 'Can you resend my appointment manage link to sarah@test.com?',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
      email: 'sarah@test.com',
    },
    {
      id: 'lost-link-no-contact-public',
      prompt: 'I lost the link to manage my booking',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
  ];

export const RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS = [
  {
    id: 'unknown-guest-resend',
    prompt: 'Resend manage link to john@example.com',
    misclassifiedAction: 'unknown',
    expectedAction: 'recover_lost_manage_link' as const,
    surface: 'customer' as const,
  },
  {
    id: 'get-manage-to-recover',
    prompt: 'I lost my booking confirmation email',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'recover_lost_manage_link' as const,
    surface: 'public' as const,
  },
  {
    id: 'confirm-to-recover',
    prompt: 'Resend manage link to sarah@test.com',
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'recover_lost_manage_link' as const,
    surface: 'customer' as const,
  },
] as const;
