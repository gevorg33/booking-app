import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

/** Dashboard mutate intent (ai-cmd-ext-2.24). */
export const CREATE_PROMO_CODE_INTENT = 'create_promo_code' as const;

export const CREATE_PROMO_CODE_CLASSIFIER_RULES = `- create_promo_code: MUTATE — admin creates a promo/discount code on Monetization → Promo codes. Params: code (string), discountType (percent|fixed), discountValue (number), optional minOrderAmount, maxUses, expiresAt, description. Use for "create promo code SAVE10 for 20% off", "add a new discount code WELCOME15". NOT promo_code_help (customer validate/how-to), NOT deactivate_promo_code (future).
- Examples:
  - "Create promo code SAVE10 for 20% off" → code=SAVE10, discountType=percent, discountValue=20
  - "Add a new discount code WELCOME15 — 15 percent" → code=WELCOME15, discountType=percent, discountValue=15
  - "Make coupon SUMMER25 with $10 off" → code=SUMMER25, discountType=fixed, discountValue=10
  - NOT "How do promo codes work" → promo_code_help (customer)`;

export type CreatePromoCodePromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CREATE_PROMO_CODE_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CREATE_PROMO_CODE_PROMPTS: CreatePromoCodePromptFixture[] = [
  {
    id: 'create-save10-20pct',
    prompt: 'Create promo code SAVE10 for 20% off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'SAVE10', discountType: 'percent', discountValue: 20 },
  },
  {
    id: 'add-welcome15',
    prompt: 'Add a new discount code WELCOME15 — 15 percent',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'WELCOME15', discountType: 'percent', discountValue: 15 },
  },
  {
    id: 'make-summer25-fixed',
    prompt: 'Make coupon SUMMER25 with $10 off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'SUMMER25', discountType: 'fixed', discountValue: 10 },
  },
  {
    id: 'new-promo-vip20',
    prompt: 'Set up promo code VIP20 at 20% discount',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'VIP20', discountType: 'percent', discountValue: 20 },
  },
  {
    id: 'create-haircut5',
    prompt: 'Create discount code HAIRCUT5 for $5 off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'HAIRCUT5', discountType: 'fixed', discountValue: 5 },
  },
  {
    id: 'add-new-client10',
    prompt: 'Add promo code NEWCLIENT10 — 10% off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'NEWCLIENT10', discountType: 'percent', discountValue: 10 },
  },
  {
    id: 'generate-loyalty15',
    prompt: 'Generate promo code LOYAL15 with 15 percent discount',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'LOYAL15', discountType: 'percent', discountValue: 15 },
  },
  {
    id: 'create-min-order',
    prompt: 'Create promo code BIG50 for 50% off with minimum order $100',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: {
      code: 'BIG50',
      discountType: 'percent',
      discountValue: 50,
      minOrderAmount: 100,
    },
  },
  {
    id: 'create-max-uses',
    prompt: 'Create discount code FLASH20 for 20% off limited to 100 uses',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: {
      code: 'FLASH20',
      discountType: 'percent',
      discountValue: 20,
      maxUses: 100,
    },
  },
  {
    id: 'issue-referral25',
    prompt: 'Issue a new promo code REFERRAL25 at 25% off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'REFERRAL25', discountType: 'percent', discountValue: 25 },
  },
  {
    id: 'create-quoted-code',
    prompt: 'Create promo code "SPRING30" for 30% off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'SPRING30', discountType: 'percent', discountValue: 30 },
  },
  {
    id: 'add-salon-welcome',
    prompt: 'Add a salon promo code SALONWELCOME with 20 dollars off',
    surface: 'dashboard',
    expectedAction: CREATE_PROMO_CODE_INTENT,
    paramsPartial: { code: 'SALONWELCOME', discountType: 'fixed', discountValue: 20 },
  },
];

const CREATE_VERB =
  /\b(create|add|new|set\s+up|make|generate|issue)\b/i;

const PROMO_SIGNAL =
  /\b(promo\s+codes?|discount\s+codes?|coupons?)\b/i;

const HELP_SIGNAL =
  /\b(how|work|help|explain|validate|check|apply|use)\b/i;

const PROMO_CODE_STOPWORDS = new Set([
  'FOR',
  'OFF',
  'NEW',
  'THE',
  'AND',
  'WITH',
  'THAT',
  'THIS',
]);

function normalizePromoCodeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,}$/.test(normalized)) return null;
  if (PROMO_CODE_STOPWORDS.has(normalized)) return null;
  return normalized;
}

export type ParsedCreatePromoCode = {
  code?: string;
  discountType?: PromoDiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: string;
  description?: string;
};

export function isCreatePromoCodePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text || !CREATE_VERB.test(text)) return false;
  if (HELP_SIGNAL.test(text) && !/\b(for|with|at)\b/i.test(text)) return false;
  if (/\bdeactivate\b/i.test(text)) return false;
  return (
    PROMO_SIGNAL.test(text) ||
    /\bcode\s+"?[A-Z0-9_-]{3,}"?\b/i.test(text) ||
    /\bcalled\s+[A-Z0-9_-]{3,}\b/i.test(text)
  );
}

export function extractPromoCodeNameFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/\bcode\s+"([^"]+)"/i);
  if (quoted) return normalizePromoCodeName(quoted[1]);

  const createNamed = prompt.match(
    /\b(?:promo|discount|coupon)\s+code\s+([A-Z0-9_-]{3,})\b/i,
  );
  if (createNamed) return normalizePromoCodeName(createNamed[1]);

  const couponNamed = prompt.match(/\bcoupon\s+([A-Z0-9_-]{3,})\b/i);
  if (couponNamed) return normalizePromoCodeName(couponNamed[1]);

  const called = prompt.match(/\bcalled\s+([A-Z0-9_-]{3,})\b/i);
  if (called) return normalizePromoCodeName(called[1]);

  const codeKeyword = prompt.match(/\bcode\s+([A-Z0-9_-]{4,})\b/i);
  return normalizePromoCodeName(codeKeyword?.[1]);
}

export function extractPromoDiscountFromPrompt(
  prompt: string,
): { discountType: PromoDiscountType; discountValue: number } | null {
  const percent =
    prompt.match(/\b(\d+(?:\.\d+)?)\s*%/i) ??
    prompt.match(/\b(\d+(?:\.\d+)?)\s+percent\b/i);
  if (percent) {
    return {
      discountType: PromoDiscountType.PERCENT,
      discountValue: Number(percent[1]),
    };
  }

  const fixedOff = prompt.match(/\$\s*(\d+(?:\.\d+)?)\s+off\b/i);
  if (fixedOff) {
    return {
      discountType: PromoDiscountType.FIXED,
      discountValue: Number(fixedOff[1]),
    };
  }

  const dollarsOff = prompt.match(
    /\b(\d+(?:\.\d+)?)\s+dollars?\s+off\b/i,
  );
  if (dollarsOff) {
    return {
      discountType: PromoDiscountType.FIXED,
      discountValue: Number(dollarsOff[1]),
    };
  }

  return null;
}

function readNumberParam(
  params: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

function readStringParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return undefined;
}

function normalizeDiscountType(
  value: unknown,
): PromoDiscountType | undefined {
  if (value === PromoDiscountType.PERCENT || value === 'percent') {
    return PromoDiscountType.PERCENT;
  }
  if (value === PromoDiscountType.FIXED || value === 'fixed') {
    return PromoDiscountType.FIXED;
  }
  return undefined;
}

export function parseCreatePromoCodeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedCreatePromoCode | null {
  if (!isCreatePromoCodePrompt(prompt) && !params.code) return null;

  const code = normalizePromoCodeName(
    readStringParam(params, 'code', 'promoCode') ??
      extractPromoCodeNameFromPrompt(prompt),
  );

  const discountFromPrompt = extractPromoDiscountFromPrompt(prompt);
  const discountType =
    normalizeDiscountType(params.discountType) ??
    discountFromPrompt?.discountType;
  const discountValue =
    readNumberParam(params, 'discountValue', 'discount') ??
    discountFromPrompt?.discountValue;

  const minOrderMatch = prompt.match(
    /\b(?:minimum|min)\s+order\s+\$?\s*(\d+(?:\.\d+)?)\b/i,
  );
  const maxUsesMatch = prompt.match(
    /\b(?:limited\s+to|max(?:imum)?|up\s+to)\s+(\d+)\s+uses?\b/i,
  );

  const parsed: ParsedCreatePromoCode = {
    code: code ?? undefined,
    discountType,
    discountValue,
    minOrderAmount:
      readNumberParam(params, 'minOrderAmount', 'minimumOrderAmount') ??
      (minOrderMatch ? Number(minOrderMatch[1]) : undefined),
    maxUses:
      readNumberParam(params, 'maxUses', 'usageLimit') ??
      (maxUsesMatch ? Number(maxUsesMatch[1]) : undefined),
    expiresAt: readStringParam(params, 'expiresAt', 'expiryDate'),
    description: readStringParam(params, 'description'),
  };

  if (!parsed.code && !parsed.discountType && parsed.discountValue == null) {
    return isCreatePromoCodePrompt(prompt) ? parsed : null;
  }

  return parsed;
}

export function rescueCreatePromoCodeIntent(
  prompt: string,
  action: string,
): {
  action: typeof CREATE_PROMO_CODE_INTENT;
  rescueReason: string;
} | null {
  if (action === CREATE_PROMO_CODE_INTENT) return null;
  if (!isCreatePromoCodePrompt(prompt)) return null;
  return {
    action: CREATE_PROMO_CODE_INTENT,
    rescueReason: 'create_promo_code',
  };
}
