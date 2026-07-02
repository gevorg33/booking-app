import type { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import type { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildApplyPromoCodeCheckoutNavigate,
  enrichApplyPromoCodeCheckoutParamsFromPrompt,
  parseApplyPromoCodeCheckoutFromPrompt,
} from './ai-apply-promo-code-checkout.util.js';
import { extractApplyPromoCodeFromPrompt } from './ai-apply-promo-code-checkout.util.js';

export interface ApplyPromoCodeCheckoutLogicDeps {
  promoCodesService?: PromoCodesService;
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

export async function handleApplyPromoCodeCheckoutLogic(
  deps: ApplyPromoCodeCheckoutLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const promptText = String(prompt ?? params._prompt ?? '');
  const enriched = enrichApplyPromoCodeCheckoutParamsFromPrompt(
    { ...params, _prompt: promptText },
    promptText,
  );
  const parsed = parseApplyPromoCodeCheckoutFromPrompt(promptText, enriched);
  const code =
    (enriched.promoCode as string | undefined) ??
    (enriched.code as string | undefined) ??
    extractApplyPromoCodeFromPrompt(promptText);

  if (!parsed && !code) {
    return failure(
      'apply_promo_code_checkout',
      'Ask to apply a promo code at checkout (e.g. "Apply code SAVE10 at checkout").',
      { clarify: true },
    );
  }

  if (!code) {
    return failure(
      'apply_promo_code_checkout',
      'Specify the promo code to apply at checkout.',
      { clarify: true, missing: ['promoCode'] },
    );
  }

  if (!deps.promoCodesService) {
    return failure(
      'apply_promo_code_checkout',
      'Promo codes are not available for this business.',
    );
  }

  const entitlements =
    await deps.planEntitlementsService.getEntitlements(businessId);
  const promoEnabled =
    entitlements.flags?.promoCodes ??
    entitlements.limits?.flags?.promoCodes ??
    false;
  if (!promoEnabled) {
    return failure(
      'apply_promo_code_checkout',
      'Promo codes are not enabled on this booking page.',
    );
  }

  const orderAmount = readOrderAmount(enriched);

  try {
    const promo = await deps.promoCodesService.findValidForCheckout(
      businessId,
      code,
      orderAmount,
    );
    const normalizedCode = promo.code;
    const discountLabel =
      promo.discountType === 'percent'
        ? `${promo.discountValue}% off`
        : `$${promo.discountValue} off`;
    const navigate = buildApplyPromoCodeCheckoutNavigate(
      enriched,
      normalizedCode,
    );

    return success(
      'apply_promo_code_checkout',
      `Promo code "${normalizedCode}" applied (${discountLabel}). Your checkout total will update.`,
      {
        promoCode: normalizedCode,
        sessionContext: { promoCode: normalizedCode },
        validated: true,
        promo: {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minOrderAmount: promo.minOrderAmount,
          expiresAt: promo.expiresAt,
        },
        ...(navigate ? { navigate } : {}),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Promo code could not be applied.';
    return failure(
      'apply_promo_code_checkout',
      `Promo code "${code}" could not be applied: ${message}`,
      { promoCode: code, validated: false, validationError: message },
    );
  }
}
