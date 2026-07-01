import { isApplyPromoCodeCheckoutPrompt } from './ai-apply-promo-code-checkout.util.js';
import { isExplainLoyaltyPointsPrompt } from './ai-explain-loyalty-points.util.js';
import {
  APPLY_LOYALTY_AT_CHECKOUT_PROMPTS,
  type ApplyLoyaltyAtCheckoutPromptFixture,
} from './ai-apply-loyalty-at-checkout.fixtures.js';
import { APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-apply-loyalty-at-checkout-multilingual.fixtures.js';

export const APPLY_LOYALTY_AT_CHECKOUT_INTENTS = [
  'apply_loyalty_at_checkout',
] as const;

export type ApplyLoyaltyAtCheckoutIntent =
  (typeof APPLY_LOYALTY_AT_CHECKOUT_INTENTS)[number];

export type ParsedApplyLoyaltyAtCheckout = {
  loyaltyPointsToRedeem?: number | 'max';
};

const APPLY_LOYALTY_AT_CHECKOUT_CUE =
  /\b(use|apply|redeem|spend|pay\s+with)\b.*\b(?:loyalty\s+|reward\s+|bonus\s+)?points?\b|\b(?:loyalty\s+|reward\s+)?points?\b.*\b(on|for|at)\b.*\b(booking|checkout|visit|appointment|order|this)\b|\buse\s+my\s+(?:loyalty\s+|reward\s+|bonus\s+)?(?:points?|balance)\b|\bspend\s+(?:all\s+)?(?:my\s+)?(?:loyalty\s+|reward\s+|bonus\s+)?points?\b/i;

const EXPLAIN_REDEEM_CUE =
  /\b(how\s+(?:can|do)\s+i\s+(?:use|redeem)|what\s+can\s+i\s+(?:use|redeem)|where\s+(?:can|do)\s+i\s+(?:use|redeem)|explain|tell\s+me)\b/i;

function matchApplyLoyaltyScenario(
  prompt: string,
): ApplyLoyaltyAtCheckoutPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of APPLY_LOYALTY_AT_CHECKOUT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractLoyaltyPointsToRedeemFromPrompt(
  prompt: string,
): number | 'max' | null {
  const scenario = matchApplyLoyaltyScenario(prompt);
  if (scenario?.loyaltyPointsToRedeem != null) {
    return scenario.loyaltyPointsToRedeem;
  }

  if (
    /\b(all|every|maximum|max)\b/i.test(prompt) &&
    /\bpoints?\b/i.test(prompt)
  ) {
    return 'max';
  }

  const amountMatch = prompt.match(
    /\b(\d+(?:\.\d+)?)\s*(?:loyalty\s+|reward\s+|bonus\s+)?points?\b/i,
  );
  if (amountMatch) return Number(amountMatch[1]);

  if (APPLY_LOYALTY_AT_CHECKOUT_CUE.test(prompt)) return 'max';
  return null;
}

export function isApplyLoyaltyAtCheckoutPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchApplyLoyaltyScenario(text)) return true;
  if (isExplainLoyaltyPointsPrompt(text)) return false;
  if (isApplyPromoCodeCheckoutPrompt(text)) return false;
  if (
    EXPLAIN_REDEEM_CUE.test(text) &&
    !/\b(use my points|apply.*points|redeem my points|spend my points)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (
    /(?:օգտագործ|կիրառ|примен|использ|списать).{0,30}(?:point|միավոր|балл|бонус|loyalty)/iu.test(
      text,
    ) &&
    /(?:checkout|amragr|запис|booking|order|visit)/iu.test(text)
  ) {
    return true;
  }

  return APPLY_LOYALTY_AT_CHECKOUT_CUE.test(text);
}

export function isApplyLoyaltyAtCheckoutIntent(
  action: string,
): action is ApplyLoyaltyAtCheckoutIntent {
  return (APPLY_LOYALTY_AT_CHECKOUT_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseApplyLoyaltyAtCheckoutFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedApplyLoyaltyAtCheckout | null {
  if (!isApplyLoyaltyAtCheckoutPrompt(prompt)) return null;

  const fromParams = readLoyaltyPointsParam(params);
  const fromPrompt = extractLoyaltyPointsToRedeemFromPrompt(prompt);
  const loyaltyPointsToRedeem = fromParams ?? fromPrompt ?? 'max';
  return { loyaltyPointsToRedeem };
}

function readLoyaltyPointsParam(
  params: Record<string, unknown>,
): number | 'max' | undefined {
  const raw =
    params.loyaltyPointsToRedeem ??
    params.loyaltyPoints ??
    params.pointsToRedeem;
  if (raw === 'max' || raw === 'all') return 'max';
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    if (/^(max|all)$/i.test(raw.trim())) return 'max';
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function enrichApplyLoyaltyAtCheckoutParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (readLoyaltyPointsParam(next) == null) {
    const points = extractLoyaltyPointsToRedeemFromPrompt(prompt);
    if (points != null && points !== 'max') {
      next.loyaltyPointsToRedeem = points;
    }
  }
  return next;
}

export function buildApplyLoyaltyAtCheckoutNavigate(
  params: Record<string, unknown>,
  loyaltyPointsToRedeem: number,
): { path: string; query: Record<string, string> } | null {
  const serviceId = params.serviceId as string | undefined;
  const startTime = params.startTime as string | undefined;
  const employeeId = params.employeeId as string | undefined;
  const packageId = params.packageId as string | undefined;
  const points = String(loyaltyPointsToRedeem);

  if (packageId) {
    return {
      path: 'checkout',
      query: {
        packageId,
        loyaltyPointsToRedeem: points,
        ...(startTime ? { startTime } : {}),
      },
    };
  }

  if (serviceId && startTime && employeeId) {
    return {
      path: 'checkout',
      query: {
        serviceId,
        startTime,
        employeeId,
        loyaltyPointsToRedeem: points,
      },
    };
  }

  if (serviceId) {
    return {
      path: 'checkout',
      query: { serviceId, loyaltyPointsToRedeem: points },
    };
  }

  return null;
}

export function rescueApplyLoyaltyAtCheckoutIntent(
  prompt: string,
  action: string,
): { action: ApplyLoyaltyAtCheckoutIntent; rescueReason: string } | null {
  if (isApplyLoyaltyAtCheckoutIntent(action)) return null;
  if (!parseApplyLoyaltyAtCheckoutFromPrompt(prompt)) return null;
  return {
    action: 'apply_loyalty_at_checkout',
    rescueReason: 'apply_loyalty_at_checkout',
  };
}
