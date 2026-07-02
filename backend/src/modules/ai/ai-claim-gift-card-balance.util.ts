import { isBookWithGiftCardPrompt } from './ai-book-with-gift-card.util.js';
import {
  extractGiftCardCodeFromPrompt,
  isBuyGiftCardPrompt,
  isCheckGiftCardBalancePrompt,
} from './ai-payments.util.js';
import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS } from './ai-claim-gift-card-balance-multilingual.fixtures.js';
import {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  type ClaimGiftCardBalancePromptFixture,
} from './ai-claim-gift-card-balance.fixtures.js';

function isGiftCardBalanceReadPrompt(prompt: string): boolean {
  return (
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(balance|remaining|left)\b/i.test(prompt)
  );
}

export const CLAIM_GIFT_CARD_BALANCE_INTENTS = [
  'claim_gift_card_balance',
] as const;

export type ClaimGiftCardBalanceIntent =
  (typeof CLAIM_GIFT_CARD_BALANCE_INTENTS)[number];

export {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS,
  CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES,
} from './ai-claim-gift-card-balance.fixtures.js';
export { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-claim-gift-card-balance-multilingual.fixtures.js';

const HY_RU_CLAIM_GIFT_CARD_CUE =
  /նվer.{0,12}քart.{0,20}(հաշ|account)|gift card.{0,20}(հաշ|account)|подарочн.{0,20}(аккаунт|счет)|активац.{0,20}подар|привяз.{0,20}подар/iu;

const CHECKOUT_BOOKING_CUE =
  /\b(checkout|booking|visit|appointment|book|reserve|schedule|pay\s+for)\b/i;

function matchClaimGiftCardBalanceScenario(
  prompt: string,
):
  | ClaimGiftCardBalancePromptFixture
  | (typeof CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of CLAIM_GIFT_CARD_BALANCE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function hasAccountClaimCue(prompt: string): boolean {
  return (
    /\b(account|my account|to my account|on my account)\b/i.test(prompt) ||
    HY_RU_CLAIM_GIFT_CARD_CUE.test(prompt)
  );
}

function hasClaimVerbCue(prompt: string): boolean {
  return (
    /\b(add|link|claim|register|attach|activate|redeem)\b/i.test(prompt) ||
    /\b(ավելաց|կլայմ|կլэйմ|активир|привяз|добав)/iu.test(prompt)
  );
}

export function isClaimGiftCardBalanceIntent(
  action: string,
): action is ClaimGiftCardBalanceIntent {
  return (CLAIM_GIFT_CARD_BALANCE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isClaimGiftCardBalancePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchClaimGiftCardBalanceScenario(text)) return true;
  if (isCheckGiftCardBalancePrompt(text)) return false;
  if (isGiftCardBalanceReadPrompt(text)) return false;
  if (isBookWithGiftCardPrompt(text)) return false;
  if (isBuyGiftCardPrompt(text)) return false;

  const hasGiftCard =
    /\b(gift\s*card)\b/i.test(text) || HY_RU_CLAIM_GIFT_CARD_CUE.test(text);
  if (!hasGiftCard && !/\b(GCM-|GCB-|GCS-)\b/i.test(text)) return false;
  if (!hasClaimVerbCue(text)) return false;

  if (hasAccountClaimCue(text) && hasClaimVerbCue(text) && hasGiftCard) {
    return !CHECKOUT_BOOKING_CUE.test(text);
  }

  if (
    /\b(redeem|claim)\b/i.test(text) &&
    /\b(gift\s*card|code)\b/i.test(text) &&
    (/\b(GCM-|GCB-|GCS-)\b/i.test(text) ||
      extractGiftCardCodeFromPrompt(text) != null) &&
    !CHECKOUT_BOOKING_CUE.test(text) &&
    !/\b(balance|remaining|left)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

export function rescueClaimGiftCardBalanceIntent(
  prompt: string,
  action: string,
): { action: ClaimGiftCardBalanceIntent; rescueReason: string } | null {
  if (isClaimGiftCardBalanceIntent(action)) return null;
  if (!isClaimGiftCardBalancePrompt(prompt)) return null;
  return {
    action: 'claim_gift_card_balance',
    rescueReason: 'claim_gift_card_balance',
  };
}

export function parseClaimGiftCardBalanceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { giftCardCode?: string } | null {
  if (!isClaimGiftCardBalancePrompt(prompt)) return null;
  const scenario = matchClaimGiftCardBalanceScenario(prompt);
  const fromParams =
    typeof params.giftCardCode === 'string' && params.giftCardCode.trim()
      ? params.giftCardCode.trim().toUpperCase()
      : undefined;
  const fromPrompt = extractGiftCardCodeFromPrompt(prompt) ?? undefined;
  const giftCardCode =
    fromParams ?? scenario?.giftCardCode ?? fromPrompt ?? undefined;
  return { giftCardCode };
}

export function enrichClaimGiftCardBalanceParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseClaimGiftCardBalanceFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.giftCardCode ? { giftCardCode: parsed.giftCardCode } : {}),
  };
}

export function buildClaimGiftCardBalanceNavigate(giftCardCode?: string): {
  path: 'account';
  query: Record<string, string>;
} {
  const query: Record<string, string> = { section: 'gift-card-claim' };
  if (giftCardCode?.trim()) {
    query.giftCardCode = giftCardCode.trim().toUpperCase();
  }
  return { path: 'account', query };
}

export function buildClaimGiftCardBalanceSignInNavigate(
  giftCardCode?: string,
): {
  path: 'login';
  query: Record<string, string>;
} {
  const query: Record<string, string> = { reason: 'claim_gift_card' };
  if (giftCardCode?.trim()) {
    query.giftCardCode = giftCardCode.trim().toUpperCase();
  }
  return { path: 'login', query };
}

export function buildClaimGiftCardBalanceSummary(input: {
  giftCardCode?: string;
  claimed?: boolean;
}): string {
  if (input.claimed && input.giftCardCode) {
    return `Gift card ${input.giftCardCode} was added to your account.`;
  }
  if (input.giftCardCode) {
    return `Open account gift-card claim to redeem ${input.giftCardCode}.`;
  }
  return 'Open account gift-card claim to add a gift card code.';
}
