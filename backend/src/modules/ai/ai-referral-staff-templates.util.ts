export const REFERRAL_STAFF_TEMPLATES_MUTATE_INTENTS = [
  'configure_referral_program',
  'configure_staff_message_templates',
] as const;

export const REFERRAL_STAFF_TEMPLATES_INTENTS = [
  ...REFERRAL_STAFF_TEMPLATES_MUTATE_INTENTS,
] as const;

export type ReferralStaffTemplatesIntent =
  (typeof REFERRAL_STAFF_TEMPLATES_INTENTS)[number];
