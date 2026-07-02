/** adopt-6.6 — consumer adoption assistant intents (referral, rebook, notifications). */
export const CONSUMER_ADOPTION_CLASSIFIER_RULES = `- explain_my_notifications: READ — explain customer notification channels and preferences. NOT find_my_saved_salons|switch_salon_tenant (saved salon list / tenant switch).`;

export const CONSUMER_ADOPTION_PROMPT_SCENARIOS = [] as readonly {
  id: string;
  prompt: string;
  expectedAction: string;
}[];
