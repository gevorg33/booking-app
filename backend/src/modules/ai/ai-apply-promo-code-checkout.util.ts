import { isCreatePromoCodePrompt } from './ai-create-promo-code.util.js';
import { extractPromoCodeFromPrompt } from './ai-marketing-growth.util.js';
import { isConfigureOpenaiIntegrationPrompt } from './ai-openai-integration.util.js';

export const CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES = `- apply_promo_code_checkout: MUTATE — apply a named promo/discount code to the current checkout session (sets session promoCode for checkout UI). Triggers: apply code SAVE10 at checkout, use promo WELCOME, redeem discount code SPRING15, enter coupon at checkout. Requires promoCode when named in prompt. Validates code via checkout rules and stores promoCode on session. NOT promo_code_help (how/why/where explain or validate-only), NOT create_promo_code (salon admin), NOT apply_gift_card_code (gift card), NOT list_services with maxPrice+budget (catalog filter), NOT refer_a_friend (referral program).`;

export type ApplyPromoCodeCheckoutPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'apply_promo_code_checkout';
  promoCode?: string;
  rescueReason: 'apply_promo_code_checkout';
};

export const APPLY_PROMO_CODE_CHECKOUT_PROMPTS: readonly ApplyPromoCodeCheckoutPromptFixture[] =
  [
    {
      id: 'apply-code-save10-customer',
      prompt: 'Apply code SAVE10 at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-promo-welcome-customer',
      prompt: 'Use promo WELCOME at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'WELCOME',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'redeem-spring15-customer',
      prompt: 'Redeem discount code SPRING15',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SPRING15',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'enter-vip20-customer',
      prompt: 'Enter coupon VIP20 at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'VIP20',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'apply-promo-code-customer',
      prompt: 'Apply promo code SUMMER20',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SUMMER20',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-code-checkout-customer',
      prompt: 'Use code FRIENDS10 on checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'FRIENDS10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'add-discount-code-customer',
      prompt: 'Add discount code NEWCLIENT at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'NEWCLIENT',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'redeem-coupon-customer',
      prompt: 'Redeem coupon LOYAL5 for my booking checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'LOYAL5',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'apply-save10-now-customer',
      prompt: 'Apply SAVE10 now at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'put-promo-checkout-customer',
      prompt: 'Put in promo code HOLIDAY25 at checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'HOLIDAY25',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-discount-checkout-customer',
      prompt: 'Use my discount code BDAY30 on checkout',
      surface: 'customer',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'BDAY30',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'apply-code-save10-public',
      prompt: 'Apply code SAVE10 at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-promo-welcome-public',
      prompt: 'Use promo WELCOME at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'WELCOME',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'redeem-spring15-public',
      prompt: 'Redeem discount code SPRING15 at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SPRING15',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'enter-vip20-public',
      prompt: 'Enter coupon VIP20 at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'VIP20',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'apply-promo-code-public',
      prompt: 'Apply promo code SUMMER20',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SUMMER20',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-code-checkout-public',
      prompt: 'Use code FRIENDS10 on checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'FRIENDS10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'add-discount-code-public',
      prompt: 'Add discount code NEWCLIENT at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'NEWCLIENT',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'redeem-coupon-public',
      prompt: 'Redeem coupon LOYAL5 for checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'LOYAL5',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'apply-save10-now-public',
      prompt: 'Apply SAVE10 now at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'SAVE10',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'put-promo-checkout-public',
      prompt: 'Put in promo code HOLIDAY25 at checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'HOLIDAY25',
      rescueReason: 'apply_promo_code_checkout',
    },
    {
      id: 'use-discount-checkout-public',
      prompt: 'Use my discount code BDAY30 on checkout',
      surface: 'public',
      expectedAction: 'apply_promo_code_checkout',
      promoCode: 'BDAY30',
      rescueReason: 'apply_promo_code_checkout',
    },
  ];

const PROMO_HELP_READ_CUE =
  /\b(how|why|where|explain|help|validate|check|is\s+[A-Z0-9_-]{3,}\s+valid|didn'?t|wasn'?t|not\s+working|still\s+full|isn'?t)\b/i;

const APPLY_PROMO_CODE_STOP_WORDS =
  /^(promo|discount|coupon|code|checkout|here|there|now|today|please|too|at|on|my|the|this|that)$/i;

export function isApplyPromoCodeCheckoutPrompt(prompt: string): boolean {
  if (isConfigureOpenaiIntegrationPrompt(prompt)) return false;
  if (/\brefer\s+a\s+friend\b/i.test(prompt)) return false;
  if (/\bgift\s*card\b/i.test(prompt) || /\bGCM-|\bGCB-|\bGCS-/i.test(prompt)) {
    return false;
  }
  if (
    /\bunder\s+\$?\d+/i.test(prompt) &&
    /\bcode\s+[A-Z0-9_-]{3,}\b/i.test(prompt) &&
    /\b(list|show|find|services?)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    isCreatePromoCodePrompt(prompt) &&
    !/\b(at|on)\s+checkout\b/i.test(prompt) &&
    !/\b(use|redeem|enter)\s+(?:promo|discount|coupon|code)\b/i.test(prompt)
  ) {
    return false;
  }
  if (PROMO_HELP_READ_CUE.test(prompt) && !/\bat\s+checkout\b/i.test(prompt)) {
    return false;
  }
  if (
    /\bhow\s+do\s+promo\s+codes?\s+work\b/i.test(prompt) ||
    /\bwhere\s+(?:do\s+i\s+)?(?:enter|apply|put)\s+(?:a\s+)?(?:promo|discount|coupon)\b/i.test(
      prompt,
    ) ||
    /\bwhy\s+(?:didn'?t|wasn'?t)\s+(?:my\s+)?(?:discount|promo|coupon)\b/i.test(
      prompt,
    ) ||
    (/\b(explain|help|how|why|where)\b/i.test(prompt) &&
      !/\bapply\s+code\b/i.test(prompt))
  ) {
    return false;
  }
  if (
    /\bcan\s+i\s+use\b/i.test(prompt) &&
    !/\b(?:use|apply|redeem|enter)\s+(?:promo|discount|coupon)\s+code\s+[A-Z0-9_-]{3,}\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const promoCode = extractApplyPromoCodeFromPrompt(prompt);
  const hasApplyVerb = /\b(apply|use|redeem|enter|add|put in)\b/i.test(prompt);
  const mentionsPromo =
    /\b(promo\s+codes?|discount\s+codes?|coupons?|vouchers?)\b/i.test(prompt) ||
    Boolean(promoCode);

  if (/\bapply\s+code\s+[A-Z0-9_-]{3,}\b/i.test(prompt)) return true;
  if (/\bapply\s+code\b/i.test(prompt) && /\bcheckout\b/i.test(prompt)) {
    return true;
  }
  if (hasApplyVerb && mentionsPromo && promoCode) return true;
  if (
    hasApplyVerb &&
    mentionsPromo &&
    /\b(checkout|booking|payment|order|cart)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /(?:կիրառ|օգտագործ|примен|использ).{0,30}(?:promo|промо|կոդ|код|code)/iu.test(
      prompt,
    ) &&
    /(?:checkout|վճար|оплат)/iu.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function extractApplyPromoCodeFromPrompt(prompt: string): string | null {
  const fromShared = extractPromoCodeFromPrompt(prompt);
  if (fromShared && !APPLY_PROMO_CODE_STOP_WORDS.test(fromShared)) {
    return fromShared;
  }

  const labeled = prompt.match(
    /\b(?:use|redeem|enter|apply)\s+(?:promo(?:\s+code)?|discount(?:\s+code)?|coupon(?:\s+code)?|code)\s+([A-Z0-9_-]{3,})\b/i,
  );
  const labeledCode = labeled?.[1]?.trim();
  if (labeledCode && !APPLY_PROMO_CODE_STOP_WORDS.test(labeledCode)) {
    return labeledCode;
  }

  const bare = prompt.match(/\b(?:use|redeem|apply)\s+([A-Z0-9_-]{3,})\b/i);
  const bareCode = bare?.[1]?.trim();
  if (bareCode && !APPLY_PROMO_CODE_STOP_WORDS.test(bareCode)) {
    return bareCode;
  }

  const ruLabeled = prompt.match(/(?:промокод|код)\s+([A-Z0-9_-]{3,})\b/iu);
  const ruLabeledCode = ruLabeled?.[1]?.trim();
  if (ruLabeledCode && !APPLY_PROMO_CODE_STOP_WORDS.test(ruLabeledCode)) {
    return ruLabeledCode;
  }

  const hyLabeled = prompt.match(
    /\b([A-Z0-9_-]{3,})\b\s+(?:promo\s+code|կոդ)/iu,
  );
  const hyLabeledCode = hyLabeled?.[1]?.trim();
  if (hyLabeledCode && !APPLY_PROMO_CODE_STOP_WORDS.test(hyLabeledCode)) {
    return hyLabeledCode;
  }

  return null;
}

export function parseApplyPromoCodeCheckoutFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { promoCode?: string } | null {
  if (!isApplyPromoCodeCheckoutPrompt(prompt)) return null;
  const promoCode =
    (params.promoCode as string | undefined) ??
    (params.code as string | undefined) ??
    extractApplyPromoCodeFromPrompt(prompt) ??
    undefined;
  return { promoCode };
}

export function enrichApplyPromoCodeCheckoutParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (!next.promoCode && !next.code) {
    const promoCode = extractApplyPromoCodeFromPrompt(prompt);
    if (promoCode) next.promoCode = promoCode;
  }
  return next;
}

export function buildApplyPromoCodeCheckoutNavigate(
  params: Record<string, unknown>,
  promoCode: string,
): { path: string; query: Record<string, string> } | null {
  const serviceId = params.serviceId as string | undefined;
  const startTime = params.startTime as string | undefined;
  const employeeId = params.employeeId as string | undefined;
  const packageId = params.packageId as string | undefined;

  if (packageId) {
    return {
      path: 'checkout',
      query: {
        packageId,
        promoCode,
        ...(startTime ? { startTime } : {}),
      },
    };
  }

  if (serviceId && startTime && employeeId) {
    return {
      path: 'checkout',
      query: { serviceId, startTime, employeeId, promoCode },
    };
  }

  if (serviceId) {
    return { path: 'checkout', query: { serviceId, promoCode } };
  }

  return null;
}

export function rescueApplyPromoCodeCheckoutIntent(
  prompt: string,
  action: string,
): { action: 'apply_promo_code_checkout'; rescueReason: string } | null {
  if (action === 'apply_promo_code_checkout') return null;
  if (!isApplyPromoCodeCheckoutPrompt(prompt)) return null;
  return {
    action: 'apply_promo_code_checkout',
    rescueReason: 'apply_promo_code_checkout',
  };
}
