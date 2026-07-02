import type { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import type { LoyaltyService } from '../loyalty/loyalty.service.js';
import { resolveLoyaltyRedemption } from '../promo-codes/checkout-pricing.util.js';
import { maxRedeemablePoints } from '../loyalty/loyalty-settings.util.js';
import { pointsToCurrency } from '../loyalty/loyalty-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildApplyLoyaltyAtCheckoutNavigate,
  enrichApplyLoyaltyAtCheckoutParamsFromPrompt,
  parseApplyLoyaltyAtCheckoutFromPrompt,
} from './ai-apply-loyalty-at-checkout.util.js';

export interface ApplyLoyaltyAtCheckoutLogicDeps {
  loyaltyService: Pick<
    LoyaltyService,
    'getBalance' | 'maxRedeemablePoints' | 'pointsToCurrency'
  >;
  planEntitlementsService: Pick<PlanEntitlementsService, 'getEntitlements'>;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function readOrderAmount(params: Record<string, unknown>): number {
  if (typeof params.orderAmount === 'number' && params.orderAmount > 0) {
    return params.orderAmount;
  }
  if (typeof params.servicePrice === 'number' && params.servicePrice > 0) {
    return params.servicePrice;
  }
  return 100;
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleApplyLoyaltyAtCheckoutLogic(
  deps: ApplyLoyaltyAtCheckoutLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const promptText = String(prompt ?? params._prompt ?? '');
  const enriched = enrichApplyLoyaltyAtCheckoutParamsFromPrompt(
    { ...params, _prompt: promptText },
    promptText,
  );
  const parsed = parseApplyLoyaltyAtCheckoutFromPrompt(promptText, enriched);

  if (!parsed) {
    return failure(
      'apply_loyalty_at_checkout',
      'Ask to apply loyalty points at checkout (e.g. "Use my points on this booking").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(enriched);
  if (!customerId) {
    return failure(
      'apply_loyalty_at_checkout',
      'Sign in to use loyalty points at checkout.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const entitlements =
    await deps.planEntitlementsService.getEntitlements(businessId);
  const loyaltyEnabled =
    entitlements.flags?.loyalty ?? entitlements.limits?.flags?.loyalty ?? false;
  if (!loyaltyEnabled) {
    return failure(
      'apply_loyalty_at_checkout',
      'Loyalty points are not enabled on this booking page.',
    );
  }

  try {
    const { account } = await deps.loyaltyService.getBalance(
      businessId,
      customerId,
    );
    const balance = account.pointsBalance;
    const amountDue = readOrderAmount(enriched);
    const maxAllowed = maxRedeemablePoints(balance, amountDue);
    const requested =
      parsed.loyaltyPointsToRedeem === 'max'
        ? maxAllowed
        : Number(parsed.loyaltyPointsToRedeem);

    const loyaltyPointsToRedeem = resolveLoyaltyRedemption(
      requested,
      balance,
      amountDue,
    );

    if (balance <= 0) {
      return failure(
        'apply_loyalty_at_checkout',
        'You have no loyalty points to redeem.',
        { pointsBalance: balance, validated: false },
      );
    }

    if (loyaltyPointsToRedeem <= 0) {
      return failure(
        'apply_loyalty_at_checkout',
        'No loyalty points can be applied to this checkout amount.',
        {
          pointsBalance: balance,
          amountDue,
          maxRedeemable: maxAllowed,
          validated: false,
        },
      );
    }

    const discountValue = pointsToCurrency(loyaltyPointsToRedeem);
    const navigate = buildApplyLoyaltyAtCheckoutNavigate(
      enriched,
      loyaltyPointsToRedeem,
    );

    return success(
      'apply_loyalty_at_checkout',
      `${loyaltyPointsToRedeem} loyalty point${loyaltyPointsToRedeem === 1 ? '' : 's'} applied ($${discountValue} off). Your checkout total will update.`,
      {
        loyaltyPointsToRedeem,
        sessionContext: { loyaltyPointsToRedeem },
        validated: true,
        pointsBalance: balance,
        discountValue,
        ...(navigate ? { navigate } : {}),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Loyalty points could not be applied.';
    return failure(
      'apply_loyalty_at_checkout',
      `Loyalty points could not be applied: ${message}`,
      { validated: false, validationError: message },
    );
  }
}
