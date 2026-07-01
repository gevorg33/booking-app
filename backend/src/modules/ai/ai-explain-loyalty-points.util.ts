import { BONUS_DOLLAR_VALUE } from '../loyalty/loyalty.constants.js';
import { isConfigureLoyaltySettingsPrompt } from './ai-configure-loyalty-settings.util.js';
import {
  EXPLAIN_LOYALTY_POINTS_PROMPTS,
  type ExplainLoyaltyPointsPromptFixture,
} from './ai-explain-loyalty-points.fixtures.js';
import { EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS } from './ai-explain-loyalty-points-multilingual.fixtures.js';

export const EXPLAIN_LOYALTY_POINTS_INTENTS = [
  'explain_loyalty_points',
] as const;

export type ExplainLoyaltyPointsIntent =
  (typeof EXPLAIN_LOYALTY_POINTS_INTENTS)[number];

export type ExplainLoyaltyPointsFocus = 'earn' | 'worth' | 'program' | 'redeem';

export { CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES } from './ai-explain-loyalty-points.fixtures.js';

const BALANCE_ONLY_CUE =
  /\bhow\s+many\s+(?:loyalty\s+|reward\s+|bonus\s+)?points?\s+(?:do\s+i\s+have|are\s+on\s+my\b)/i;

function isLoyaltyPointsBalanceOnlyPrompt(prompt: string): boolean {
  if (BALANCE_ONLY_CUE.test(prompt)) return true;
  if (
    /\bwhat(?:'s|\s+is)\s+my\s+points?\s+balance\b/i.test(prompt) ||
    /\bmy\s+points?\s+balance\b/i.test(prompt) ||
    /\bloyalty\s+balance\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    (/\b(loyalty|bonus|reward)\b/i.test(prompt) ||
      /(loyalty|bonus|reward|бонус|лояльн|балл)/i.test(prompt)) &&
    (/\b(points?|balance|how\s+many)\b/i.test(prompt) ||
      /(points|balance|балл|очк|point)/i.test(prompt)) &&
    (/\bmy\b/i.test(prompt) ||
      /\b(check|show|what(?:'s|\s+is))\b/i.test(prompt) ||
      /(իմ|my|мои|показ|check|show|tsuyts|ցույց)/i.test(prompt)) &&
    !/\b(how\s+do\s+i\s+earn|how\s+to\s+earn|what\s+are\s+(?:my\s+)?points\s+worth|how\s+does\s+loyalty\s+work|explain|worth|earn|get\s+me|on\s+every\s+visit|сколько\s+стоят|стоят)\b/i.test(
      prompt,
    )
  );
}

const APPLY_AT_CHECKOUT_CUE =
  /\b(use|apply|redeem|spend)\b.*\bpoints?\b.*\b(booking|checkout|visit|appointment|order|this)\b|\bpoints?\b.*\b(on|for)\b.*\b(booking|checkout|visit|appointment|order|this)\b/i;

const ADMIN_LOYALTY_CUE =
  /\b(summarize|configure|set|enable|disable|update)\b.*\bloyalty\b|\bloyalty\b.*\b(settings|program overview|dashboard)\b/i;

const EARN_CUE =
  /\b(how\s+do\s+i\s+earn|how\s+to\s+earn|when\s+do\s+i\s+earn|earn\s+points|how\s+are\s+points?\s+calculated|do\s+i\s+earn\s+points)\b/i;

const WORTH_CUE =
  /\b(what\s+are\s+(?:my\s+)?points?\s+worth|what\s+is\s+each\s+point\s+worth|how\s+much\s+are\s+.*points?\s+worth|what\s+do\s+my\s+bonus\s+points\s+get\s+me|point\s+value|dollar\s+value)\b/i;

const PROGRAM_CUE =
  /\b(how\s+does\s+(?:the\s+)?loyalty|how\s+do\s+loyalty\s+points|explain\s+loyalty|tell\s+me\s+how\s+reward\s+points|how\s+does\s+the\s+reward\s+program)\b/i;

const REDEEM_EXPLAIN_CUE =
  /\b(how\s+(?:can|do)\s+i\s+(?:use|redeem)|where\s+(?:can|do)\s+i\s+(?:use|redeem)|what\s+can\s+i\s+(?:use|redeem))\b.*\bpoints?\b/i;

function matchExplainLoyaltyScenario(
  prompt: string,
): ExplainLoyaltyPointsPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_LOYALTY_POINTS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferExplainLoyaltyPointsFocus(
  prompt: string,
): ExplainLoyaltyPointsFocus {
  const scenario = matchExplainLoyaltyScenario(prompt);
  if (scenario?.focus) return scenario.focus;
  if (EARN_CUE.test(prompt)) return 'earn';
  if (WORTH_CUE.test(prompt)) return 'worth';
  if (REDEEM_EXPLAIN_CUE.test(prompt)) return 'redeem';
  return 'program';
}

export function isExplainLoyaltyPointsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainLoyaltyScenario(text)) return true;
  if (isConfigureLoyaltySettingsPrompt(text)) return false;
  if (ADMIN_LOYALTY_CUE.test(text)) return false;
  if (APPLY_AT_CHECKOUT_CUE.test(text)) return false;
  if (isLoyaltyPointsBalanceOnlyPrompt(text)) return false;

  if (
    /(?:ինչպես|how).{0,24}(?:միավոր|point|балл|бонус)/iu.test(text) &&
    /(?:ստան|earn|заработ)/iu.test(text)
  ) {
    return true;
  }
  if (
    /(?:ինչ\s+արժ|сколько\s+стоят|what\s+are.*worth|point\s+value)/iu.test(
      text,
    ) &&
    /(?:միավոր|point|балл|бонус|loyalty)/iu.test(text)
  ) {
    return true;
  }
  if (
    /(?:բացատր|объясн|explain)/iu.test(text) &&
    /(?:loyalty|reward|bonus|միավոր|лояльн|балл)/iu.test(text)
  ) {
    return true;
  }

  if (EARN_CUE.test(text) || WORTH_CUE.test(text) || PROGRAM_CUE.test(text)) {
    return true;
  }

  if (REDEEM_EXPLAIN_CUE.test(text)) return true;

  return (
    (/\b(explain|tell\s+me|how\s+does|how\s+do)\b/i.test(text) ||
      /(?:բացատր|объясн)/iu.test(text)) &&
    /\b(loyalty|reward|bonus)\b/i.test(text) &&
    /\b(points?|program|cashback|балл|мիավոր)/iu.test(text)
  );
}

export function isExplainLoyaltyPointsIntent(
  action: string,
): action is ExplainLoyaltyPointsIntent {
  return (EXPLAIN_LOYALTY_POINTS_INTENTS as readonly string[]).includes(action);
}

export function parseExplainLoyaltyPointsFromPrompt(
  prompt: string,
): { focus: ExplainLoyaltyPointsFocus } | null {
  if (!isExplainLoyaltyPointsPrompt(prompt)) return null;
  return { focus: inferExplainLoyaltyPointsFocus(prompt) };
}

export function buildLoyaltyPointsExplainCopy(input: {
  enabled: boolean;
  earnPercentCashback: number;
  bonusDollarValue?: number;
  pointsBalance?: number;
  pointsValue?: number;
  lifetimeEarned?: number;
  focus: ExplainLoyaltyPointsFocus;
}): {
  summary: string;
  earnPercentCashback: number;
  bonusDollarValue: number;
  focus: ExplainLoyaltyPointsFocus;
  pointsBalance?: number;
  pointsValue?: number;
} {
  const bonusDollarValue = input.bonusDollarValue ?? BONUS_DOLLAR_VALUE;
  const earnRate = input.earnPercentCashback;

  if (!input.enabled) {
    return {
      summary:
        'This salon has not enabled the loyalty rewards program yet. Ask the front desk when points earning will be available.',
      earnPercentCashback: earnRate,
      bonusDollarValue,
      focus: input.focus,
    };
  }

  const earnLine = `You earn ${earnRate}% back as loyalty points on eligible cash paid after completed visits (amounts paid with points do not earn more points).`;
  const worthLine = `Each point is worth $${bonusDollarValue} when you redeem at checkout on a future booking.`;
  const redeemLine =
    'Redeem points during checkout before you pay — they reduce the cash due on that booking.';
  const balanceLine =
    input.pointsBalance != null
      ? `You currently have ${input.pointsBalance} points (≈ $${input.pointsValue ?? input.pointsBalance} value).`
      : null;

  const parts: string[] = [];
  if (input.focus === 'earn') {
    parts.push(earnLine);
    parts.push(
      'Points usually post after your visit is marked completed and payment is recorded.',
    );
  } else if (input.focus === 'worth' || input.focus === 'redeem') {
    parts.push(worthLine);
    if (input.focus === 'redeem') parts.push(redeemLine);
    parts.push(earnLine);
  } else {
    parts.push(earnLine, worthLine, redeemLine);
  }

  if (balanceLine) parts.push(balanceLine);

  return {
    summary: parts.join(' '),
    earnPercentCashback: earnRate,
    bonusDollarValue,
    focus: input.focus,
    ...(input.pointsBalance != null
      ? {
          pointsBalance: input.pointsBalance,
          pointsValue: input.pointsValue ?? input.pointsBalance,
        }
      : {}),
  };
}

export function rescueExplainLoyaltyPointsIntent(
  prompt: string,
  action: string,
): { action: ExplainLoyaltyPointsIntent; rescueReason: string } | null {
  if (isExplainLoyaltyPointsIntent(action)) return null;
  if (!parseExplainLoyaltyPointsFromPrompt(prompt)) return null;
  return {
    action: 'explain_loyalty_points',
    rescueReason: 'explain_loyalty_points',
  };
}

export function detectExplainLoyaltyPointsAction(
  prompt: string,
): ExplainLoyaltyPointsIntent | null {
  return rescueExplainLoyaltyPointsIntent(prompt, 'unknown')?.action ?? null;
}
