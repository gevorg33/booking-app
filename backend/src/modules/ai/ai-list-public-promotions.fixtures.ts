export type ListPublicPromotionsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'list_public_promotions';
  rescueReason: 'public_promotions';
};

export const LIST_PUBLIC_PROMOTIONS_CLASSIFIER_RULES = `- list_public_promotions: READ — list active promo codes / deals / discounts currently offered by this business, before checkout. Triggers: "Any promotions right now?", "What deals do you have?", "Are there any discounts?", "Show me current offers". NOT promo_code_help (explains how to apply a specific code the customer already has), NOT apply_promo_code_checkout (mutate — applies a code at checkout).`;

export const LIST_PUBLIC_PROMOTIONS_PROMPTS: readonly ListPublicPromotionsPromptFixture[] =
  [
    {
      id: 'any-promotions-public',
      prompt: 'Any promotions right now?',
      surface: 'public',
      expectedAction: 'list_public_promotions',
      rescueReason: 'public_promotions',
    },
    {
      id: 'what-deals-public',
      prompt: 'What deals do you have?',
      surface: 'public',
      expectedAction: 'list_public_promotions',
      rescueReason: 'public_promotions',
    },
    {
      id: 'any-discounts-customer',
      prompt: 'Are there any discounts?',
      surface: 'customer',
      expectedAction: 'list_public_promotions',
      rescueReason: 'public_promotions',
    },
    {
      id: 'current-offers-customer',
      prompt: 'Show me current offers',
      surface: 'customer',
      expectedAction: 'list_public_promotions',
      rescueReason: 'public_promotions',
    },
  ];
