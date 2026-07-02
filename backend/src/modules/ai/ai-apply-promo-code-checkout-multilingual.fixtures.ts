export type ApplyPromoCodeCheckoutMultilingualScenario = {
  id: string;
  prompt: string;
  locale: 'hy' | 'ru';
  expectedAction: 'apply_promo_code_checkout';
  rescueReason: 'apply_promo_code_checkout';
  promoCode?: string;
};

export const APPLY_PROMO_CODE_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES = `- apply_promo_code_checkout: hy «կիրառել SAVE10 promo code-ը checkout-ում», «օգտագործել WELCOME կոդը»; ru «применить промокод SAVE10 на checkout», «использовать код WELCOME». MUTATE session promoCode — NOT promo_code_help (explain/validate read).`;

export const APPLY_PROMO_CODE_CHECKOUT_MULTILINGUAL_SCENARIOS: readonly ApplyPromoCodeCheckoutMultilingualScenario[] =
  [
    {
      id: 'apply-promo-checkout-hy-save10',
      prompt: 'Կիրառել SAVE10 promo code-ը checkout-ում',
      locale: 'hy',
      expectedAction: 'apply_promo_code_checkout',
      rescueReason: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
    },
    {
      id: 'apply-promo-checkout-hy-welcome',
      prompt: 'Օգտագործել WELCOME կոդը checkout-ում',
      locale: 'hy',
      expectedAction: 'apply_promo_code_checkout',
      rescueReason: 'apply_promo_code_checkout',
      promoCode: 'WELCOME',
    },
    {
      id: 'apply-promo-checkout-ru-save10',
      prompt: 'Применить промокод SAVE10 на checkout',
      locale: 'ru',
      expectedAction: 'apply_promo_code_checkout',
      rescueReason: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
    },
    {
      id: 'apply-promo-checkout-ru-welcome',
      prompt: 'Использовать код WELCOME на checkout',
      locale: 'ru',
      expectedAction: 'apply_promo_code_checkout',
      rescueReason: 'apply_promo_code_checkout',
      promoCode: 'WELCOME',
    },
  ];
