import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import {
  BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
  type BuyGiftCardForSomeonePromptFixture,
} from './ai-buy-gift-card-for-someone.fixtures.js';

function extractGiftCardAmountFromPrompt(prompt: string): number | undefined {
  const dollar = prompt.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollar) return Number.parseFloat(dollar[1]);
  const amountWord = prompt.match(/\bamount\s+(\d+(?:\.\d{1,2})?)\b/i);
  if (amountWord) return Number.parseFloat(amountWord[1]);
  return undefined;
}

function isBareBookWithGiftCardMutatePrompt(prompt: string): boolean {
  return (
    /\b(book|reserve|schedule|checkout|pay|use)\b/i.test(prompt) &&
    /\bgift\s*card\b/i.test(prompt) &&
    (/\b(GCM-|GCB-|GCS-)\b/i.test(prompt) ||
      /\bfor\s+(?:this|my)\s+(?:booking|visit|appointment)\b/i.test(prompt))
  );
}

export const BUY_GIFT_CARD_FOR_SOMEONE_INTENTS = [
  'buy_gift_card_for_someone',
] as const;

export type BuyGiftCardForSomeoneIntent =
  (typeof BUY_GIFT_CARD_FOR_SOMEONE_INTENTS)[number];

export {
  BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
  BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS,
  CUSTOMER_BUY_GIFT_CARD_FOR_SOMEONE_CLASSIFIER_RULES,
} from './ai-buy-gift-card-for-someone.fixtures.js';
export { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';

const RELATIONSHIP_LABELS: Record<string, string> = {
  mom: 'Mom',
  mother: 'Mom',
  dad: 'Dad',
  father: 'Dad',
  wife: 'Wife',
  husband: 'Husband',
  partner: 'Partner',
  friend: 'Friend',
  sister: 'Sister',
  brother: 'Brother',
  мам: 'Mom',
  мама: 'Mom',
  пап: 'Dad',
  папа: 'Dad',
  մայր: 'Mom',
  հայր: 'Dad',
};

const HY_RU_GIFT_FOR_SOMEONE_CUE =
  /նվեր.{0,12}քարտ|պարոնակ|մայրիս|հայրիս|ընկեր|подарочн|подарок|для\s+(мам|пап|друг)|цифров.{0,12}карт|email.{0,12}карт/iu;

function matchBuyGiftCardForSomeoneScenario(
  prompt: string,
):
  | BuyGiftCardForSomeonePromptFixture
  | (typeof BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasGiftCardForSomeoneCue(prompt: string): boolean {
  // e2e-bug.80 — "gift card for myself" / "for 75 dollars" is self-purchase face
  // value, not a recipient. The old `.+\b(to|for)\b` catch-all stole those.
  if (/\bfor\s+(?:my\s*self|myself|me)\b/i.test(prompt)) return false;
  if (
    /\bfor\s+(?:\$\s*)?\d[\d,]*(?:\.\d+)?(?:\s*(?:dollars?|usd))?\b/i.test(
      prompt,
    ) &&
    !/\bfor\s+(?:my\s+)?(?:mom|mother|dad|father|wife|husband|partner|friend|sister|brother|someone)\b/i.test(
      prompt,
    ) &&
    !/\bfor\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/.test(prompt) &&
    !/\bas\s+a\s+(?:gift|present)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(?:buy|purchase|order|get|send|email|mail)\b/i.test(prompt) &&
    /\b(gift\s*card|digital\s+(?:gift\s*)?card)\b/i.test(prompt) &&
    (/\bfor\s+(?:my\s+)?(?:mom|mother|dad|father|wife|husband|partner|friend|sister|brother|someone)\b/i.test(
      prompt,
    ) ||
      /\bfor\s+someone\s+else\b/i.test(prompt) ||
      /\bas\s+a\s+(?:gift|present)\b/i.test(prompt) ||
      /\b(?:email|send)\b.+\b(?:gift\s*card|digital)\b/i.test(prompt) ||
      /\b(?:gift\s*card|digital\s+card)\b.{0,48}\b(?:to|for)\s+(?!myself\b|me\b|(?:\$\s*)?\d)(?:my\s+)?(?:mom|mother|dad|father|wife|husband|partner|friend|sister|brother|someone|[A-Z][a-z]+)/i.test(
        prompt,
      ) ||
      /\bfor\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/.test(prompt) ||
      /\bto\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/.test(prompt) ||
      /\bto\s+[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(prompt) ||
      HY_RU_GIFT_FOR_SOMEONE_CUE.test(prompt))
  );
}

export function extractRecipientNameFromPrompt(
  prompt: string,
): string | undefined {
  const relationship = prompt.match(
    /\bfor\s+(?:my\s+)?(mom|mother|dad|father|wife|husband|partner|friend|sister|brother|мам[аы]?|пап[аы]?|մայր|հայր|ընկեր)\b/i,
  )?.[1];
  if (relationship) {
    return RELATIONSHIP_LABELS[relationship.toLowerCase()] ?? relationship;
  }
  const named = prompt.match(
    /\b(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  )?.[1];
  if (named && !/^(Someone|Else|Them|Her|Him|My|A|An)$/i.test(named)) {
    return named;
  }
  return undefined;
}

export function extractRecipientEmailFromPrompt(
  prompt: string,
): string | undefined {
  return prompt.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
}

export function inferGiftCardForSomeoneDeliveryMethod(
  prompt: string,
): 'digital' | 'physical' | undefined {
  if (
    /\b(physical|mailed|mail|shipped|ship|postal|address)\b/i.test(prompt) ||
    /փոստ|физическ|почт/i.test(prompt)
  ) {
    return 'physical';
  }
  if (
    /\b(email|e-mail|digital|send|text)\b/i.test(prompt) ||
    /էլ\.?\s*փոստ|цифров|email/i.test(prompt)
  ) {
    return 'digital';
  }
  return undefined;
}

export function isBuyGiftCardForSomeonePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchBuyGiftCardForSomeoneScenario(text)) return true;
  if (isBareBookWithGiftCardMutatePrompt(text)) return false;
  if (/\b(my\s+account|balance|redeem|apply|code)\b/i.test(text)) return false;
  if (HY_RU_GIFT_FOR_SOMEONE_CUE.test(text)) return true;
  return hasGiftCardForSomeoneCue(text);
}

export function isBuyGiftCardForSomeoneIntent(
  action: string,
): action is BuyGiftCardForSomeoneIntent {
  return (BUY_GIFT_CARD_FOR_SOMEONE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseBuyGiftCardForSomeoneFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  amount?: number;
  recipientName?: string;
  recipientEmail?: string;
  deliveryMethod?: 'digital' | 'physical';
} | null {
  if (!isBuyGiftCardForSomeonePrompt(prompt)) return null;
  const scenario = matchBuyGiftCardForSomeoneScenario(prompt);
  const amountRaw =
    params.amount ??
    scenario?.amount ??
    extractGiftCardAmountFromPrompt(prompt);
  const amount =
    typeof amountRaw === 'number'
      ? amountRaw
      : amountRaw != null && Number.isFinite(Number(amountRaw))
        ? Number(amountRaw)
        : undefined;
  const recipientName =
    (typeof params.recipientName === 'string' && params.recipientName.trim()) ||
    scenario?.recipientName ||
    extractRecipientNameFromPrompt(prompt);
  const recipientEmail =
    (typeof params.recipientEmail === 'string' &&
      params.recipientEmail.trim()) ||
    (scenario && 'recipientEmail' in scenario
      ? scenario.recipientEmail
      : undefined) ||
    extractRecipientEmailFromPrompt(prompt);
  const deliveryMethod =
    (typeof params.deliveryMethod === 'string' &&
    (params.deliveryMethod === 'digital' ||
      params.deliveryMethod === 'physical')
      ? params.deliveryMethod
      : undefined) ||
    scenario?.deliveryMethod ||
    inferGiftCardForSomeoneDeliveryMethod(prompt) ||
    'digital';

  return {
    amount,
    recipientName: recipientName || undefined,
    recipientEmail: recipientEmail || undefined,
    deliveryMethod,
  };
}

export function enrichBuyGiftCardForSomeoneParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseBuyGiftCardForSomeoneFromPrompt(prompt, params);
  if (!parsed) return params;
  const next: Record<string, unknown> = { ...params, buyAsGift: true };
  if (parsed.amount != null) next.amount = parsed.amount;
  if (parsed.recipientName) next.recipientName = parsed.recipientName;
  if (parsed.recipientEmail) next.recipientEmail = parsed.recipientEmail;
  if (parsed.deliveryMethod) next.deliveryMethod = parsed.deliveryMethod;
  return next;
}

export function rescueBuyGiftCardForSomeoneIntent(
  prompt: string,
  action: string,
): {
  action: BuyGiftCardForSomeoneIntent;
  rescueReason: string;
} | null {
  if (isBuyGiftCardForSomeoneIntent(action)) return null;
  if (!parseBuyGiftCardForSomeoneFromPrompt(prompt)) return null;
  return {
    action: 'buy_gift_card_for_someone',
    rescueReason: 'gift_card_for_someone',
  };
}

export function buildBuyGiftCardForSomeoneSummary(input: {
  amount?: number;
  recipientName?: string;
  recipientEmail?: string;
  deliveryMethod?: 'digital' | 'physical';
  checkoutPath: 'gift-cards' | 'gift-cards/checkout';
}): string {
  const recipient =
    input.recipientName ?? input.recipientEmail ?? 'your recipient';
  const amountPart = input.amount != null ? `$${input.amount.toFixed(0)} ` : '';
  const delivery = input.deliveryMethod === 'physical' ? 'mailed' : 'digital';
  if (input.checkoutPath === 'gift-cards/checkout') {
    return `Opening gift card checkout for a ${delivery} ${amountPart}gift card for ${recipient}.`;
  }
  return `Opening gift cards — choose an amount and finish checkout for a ${delivery} gift for ${recipient}.`;
}
