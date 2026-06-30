import {
  extractPromoCodeFromPrompt,
  isPromoCodeHelpPrompt,
  rescueMarketingGrowthIntent,
} from './ai-marketing-growth.util.js';

export const CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES = `- promo_code_help: READ — explain how promo/discount codes work at checkout and optionally validate a named code. Triggers: how do promo codes work, where enter promo code, why discount didn't apply, coupon not working, validate SAVE10, apply code at checkout. Sets promoCode when user names a code. NOT create_promo_code (salon admin), NOT refer_a_friend (referral program), NOT apply_gift_card_code (gift card), NOT list_services with maxPrice+budget (catalog filter — promo applied later at checkout), NOT explain_checkout_total (line-item math).`;

export type PromoCodeHelpPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'promo_code_help';
  promoCode?: string;
  rescueReason: 'promo_help';
};

export const PROMO_CODE_HELP_PROMPTS: readonly PromoCodeHelpPromptFixture[] = [
  {
    id: 'how-promo-codes-work-customer',
    prompt: 'How do promo codes work?',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'where-enter-promo-customer',
    prompt: 'Where do I enter a promo code?',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'discount-not-applied-customer',
    prompt: "Why didn't my discount apply?",
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'coupon-not-working-customer',
    prompt: 'My coupon is not working',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'validate-save10-customer',
    prompt: 'Validate SAVE10',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    promoCode: 'SAVE10',
    rescueReason: 'promo_help',
  },
  {
    id: 'apply-code-checkout-customer',
    prompt: 'Apply code WELCOME at checkout',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    promoCode: 'WELCOME',
    rescueReason: 'promo_help',
  },
  {
    id: 'why-full-price-customer',
    prompt: 'Why is the total still full price after my code?',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'can-use-promo-customer',
    prompt: 'Can I use a promo code?',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'where-discount-field-customer',
    prompt: 'Where is the discount field at checkout?',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'promo-not-applied-customer',
    prompt: "Why wasn't my promo applied?",
    surface: 'customer',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'help-with-discount-code-customer',
    prompt: 'Help with discount code VIP20',
    surface: 'customer',
    expectedAction: 'promo_code_help',
    promoCode: 'VIP20',
    rescueReason: 'promo_help',
  },
  {
    id: 'how-promo-codes-work-public',
    prompt: 'How do promo codes work?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'where-enter-promo-public',
    prompt: 'Where do I enter a promo code?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'discount-not-applied-public',
    prompt: "Why didn't my discount apply?",
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'coupon-not-working-public',
    prompt: 'My coupon is not working',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'validate-save10-public',
    prompt: 'Is SAVE10 valid?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    promoCode: 'SAVE10',
    rescueReason: 'promo_help',
  },
  {
    id: 'apply-code-checkout-public',
    prompt: 'Apply code SPRING15 at checkout',
    surface: 'public',
    expectedAction: 'promo_code_help',
    promoCode: 'SPRING15',
    rescueReason: 'promo_help',
  },
  {
    id: 'why-full-price-public',
    prompt: 'Why is checkout still full price after the code?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'can-use-promo-public',
    prompt: 'Can I use a discount code here?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'where-discount-field-public',
    prompt: 'Where is the promo code box?',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'promo-not-applied-public',
    prompt: "Why wasn't my promo code applied?",
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
  {
    id: 'explain-discount-codes-public',
    prompt: 'Explain discount codes at checkout',
    surface: 'public',
    expectedAction: 'promo_code_help',
    rescueReason: 'promo_help',
  },
];

export function rescuePromoCodeHelpCustomerPublicIntent(
  prompt: string,
  action: string,
): { action: 'promo_code_help'; rescueReason: string } | null {
  const rescued = rescueMarketingGrowthIntent(prompt, action);
  if (rescued?.action === 'promo_code_help') {
    return { action: 'promo_code_help', rescueReason: rescued.rescueReason };
  }
  return null;
}

export function detectPromoCodeHelpCustomerPublicAction(
  prompt: string,
): 'promo_code_help' | null {
  return rescuePromoCodeHelpCustomerPublicIntent(prompt, 'unknown')?.action ?? null;
}

export function enrichPromoCodeHelpParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (!next.promoCode && !next.code) {
    const promoCode = extractPromoCodeFromPrompt(prompt);
    if (promoCode) next.promoCode = promoCode;
  }
  return next;
}

export { isPromoCodeHelpPrompt, extractPromoCodeFromPrompt };
