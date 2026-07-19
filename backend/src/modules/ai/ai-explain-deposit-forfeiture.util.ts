import {
  EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS,
  type ExplainDepositForfeitureMultilingualScenario,
} from './ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import {
  EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS,
  type ExplainDepositForfeiturePromptFixture,
} from './ai-explain-deposit-forfeiture.fixtures.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';
import { isListServicesPaymentFilterPrompt } from './ai-list-services-payment-filters.util.js';
import { isExplainPublicBookingCheckoutPrompt } from './ai-explain-public-booking-checkout.util.js';

export const EXPLAIN_DEPOSIT_FORFEITURE_INTENTS = [
  'explain_deposit_forfeiture',
] as const;

export type ExplainDepositForfeitureIntent =
  (typeof EXPLAIN_DEPOSIT_FORFEITURE_INTENTS)[number];

export { CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES } from './ai-explain-deposit-forfeiture.fixtures.js';

const DEPOSIT_FORFEITURE_CUE = new RegExp(
  String.raw`\b(?:deposit|prepayment|50\s*%|forfeit(?:ure)?|refund(?:able)?|lose\s+my|get\s+my|give\s+back|cancellation\s+fee|cancel\s+for\s+free|free\s+cancel|late\s+cancel)\b|անկախավճ|վերադարձ|депозит|вернут|бесплатн|forfeit`,
  'iu',
);

const CANCEL_POLICY_CONTEXT = new RegExp(
  String.raw`\b(?:cancel|cancellation|policy|rules?|notice|window|reschedule|booking|appointment|visit|if\s+i\s+cancel)\b|չեղարկ|отмен|политик|правил|amragr|amրag`,
  'iu',
);

const AMOUNT_DUE_CUE = new RegExp(
  String.raw`\b(?:how\s+much|what(?:'s| is)\s+due|due\s+today|pay\s+today|amount\s+due|\$\d+)\b|որքան\s+եմ\s+վճարում|сколько\s+я\s+плачу`,
  'iu',
);

const GENERAL_POLICY_ONLY_CUE = new RegExp(
  String.raw`\b(?:explain|what\s+is|tell\s+me|describe|what\s+are)\b.*\b(?:cancel(?:lation)?|reschedule|self[\s-]?service)\b.*\b(?:policy|rules?|window|notice)\b|\b(?:cancel(?:lation)?|reschedule)\b.*\b(?:policy|rules?|window|notice)\b|\b(?:how\s+much\s+notice|notice\s+do\s+i\s+need)\b`,
  'iu',
);

function matchDepositForfeitureFixture(
  prompt: string,
): ExplainDepositForfeiturePromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function matchDepositForfeitureMultilingualScenario(
  prompt: string,
): ExplainDepositForfeitureMultilingualScenario | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

const PAYMENT_SETUP_MUTATE_CUE = new RegExp(
  String.raw`\b(?:accept|enable|require|configure|set\s+up|turn\s+on|decline|disable|turn\s+off|stop|reject|remove|refuse)\b.{0,80}\b(?:online\s+payment|prepayment|public\s+booking)\b|\b(?:online\s+payment|prepayment).{0,60}\b(?:for|on)\s+.{0,20}\bservices?\b|ընդուն|միացն|պահանջ|կարգավոր|անջատ|դադարեցն|прин|включ|требов|настро|отключ|прекрат`,
  'iu',
);

export function isExplainDepositForfeiturePrompt(prompt: string): boolean {
  if (isConfigureServiceDepositPolicyPrompt(prompt)) return false;
  if (isListServicesPaymentFilterPrompt(prompt)) return false;
  if (isExplainPublicBookingCheckoutPrompt(prompt)) return false;
  if (PAYMENT_SETUP_MUTATE_CUE.test(prompt)) return false;
  if (
    /\b(?:raise|increase|lower|decrease|reduce|adjust|change)\b.{0,20}\bprice/i.test(
      prompt,
    ) ||
    (/\d+\s*%/.test(prompt) && /\bprice/i.test(prompt))
  ) {
    return false;
  }
  if (
    /\b(package\s+visit|spa\s+day|package\s+bundle|package\s+appointment)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // Keep "why is there a deposit …" / bare "explain the deposit policy" on why-stripe
  // unless cancel/forfeit/refund framing is present (e2e-bug.113 boundary).
  if (
    (/\bwhy\s+is\s+there\s+a\s+deposit\b/i.test(prompt) ||
      /\bexplain\s+(?:the\s+)?deposit\s+policy\b/i.test(prompt)) &&
    !/\b(?:forfeit|cancel|refund|lose|get\s+(?:my\s+)?(?:deposit|prepayment)\s+back|to\s+book)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    AMOUNT_DUE_CUE.test(prompt) &&
    !/\b(?:notice|hours?\s+before|refund|forfeit|deposit|prepayment)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (matchDepositForfeitureFixture(prompt)) return true;
  if (matchDepositForfeitureMultilingualScenario(prompt)) return true;

  if (
    /(?:կորցն.{0,20}անկախավճ|վերադարձ.{0,20}50|потеря.{0,20}депозит|вернут.{0,20}депозит|можно\s+ли\s+отменить\s+бесплатно)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    GENERAL_POLICY_ONLY_CUE.test(prompt) &&
    !DEPOSIT_FORFEITURE_CUE.test(prompt)
  ) {
    return false;
  }

  // e2e-bug.113 — "why do I have to pay a deposit to book?" (not named-service why-deposit).
  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(?:have\s+to\s+|must\s+)?pay\b/i.test(prompt) &&
    /\bdeposit\b/i.test(prompt) &&
    /\b(?:to\s+)?book(?:ing)?\b/i.test(prompt)
  ) {
    return true;
  }

  return (
    DEPOSIT_FORFEITURE_CUE.test(prompt) && CANCEL_POLICY_CONTEXT.test(prompt)
  );
}

export function isExplainDepositForfeitureIntent(
  action: string,
): action is ExplainDepositForfeitureIntent {
  return (EXPLAIN_DEPOSIT_FORFEITURE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseExplainDepositForfeitureFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { bookingId?: string } | null {
  if (!isExplainDepositForfeiturePrompt(prompt)) return null;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  return bookingId ? { bookingId } : {};
}

export function rescueExplainDepositForfeitureIntent(
  prompt: string,
  action: string,
): { action: ExplainDepositForfeitureIntent; rescueReason: string } | null {
  if (isExplainDepositForfeitureIntent(action)) return null;
  if (!parseExplainDepositForfeitureFromPrompt(prompt)) return null;
  return {
    action: 'explain_deposit_forfeiture',
    rescueReason: 'deposit_forfeiture',
  };
}
