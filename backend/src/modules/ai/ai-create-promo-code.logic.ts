import type { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseCreatePromoCodeFromPrompt,
  type ParsedCreatePromoCode,
} from './ai-create-promo-code.util.js';

export interface CreatePromoCodeLogicDeps {
  promoCodesService?: PromoCodesService;
}

const NAVIGATE = {
  path: '/dashboard/monetization',
  label: 'Open Monetization → Promo codes',
};

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function formatDiscount(parsed: ParsedCreatePromoCode): string {
  if (parsed.discountType === 'fixed') {
    return `$${parsed.discountValue} off`;
  }
  return `${parsed.discountValue}% off`;
}

export async function handleCreatePromoCodeLogic(
  deps: CreatePromoCodeLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseCreatePromoCodeFromPrompt(effectivePrompt, params);

  if (!parsed) {
    return failure(
      'create_promo_code',
      'Ask to create a promo code (e.g. "Create promo code SAVE10 for 20% off").',
      {
        clarify: true,
        missing: ['code', 'discountType', 'discountValue'],
        navigate: NAVIGATE,
      },
    );
  }

  if (!parsed.code) {
    return failure(
      'create_promo_code',
      'Which promo code name should I create? Example: SAVE10.',
      { clarify: true, missing: ['code'], navigate: NAVIGATE },
    );
  }

  if (!parsed.discountType || parsed.discountValue == null) {
    return failure(
      'create_promo_code',
      `What discount should ${parsed.code} offer — percent (e.g. 20%) or fixed amount (e.g. $10)?`,
      {
        clarify: true,
        missing: ['discountType', 'discountValue'],
        code: parsed.code,
        navigate: NAVIGATE,
      },
    );
  }

  try {
    if (!deps.promoCodesService) {
      return failure(
        'create_promo_code',
        'Promo codes are not available on this surface.',
        { code: parsed.code, navigate: NAVIGATE },
      );
    }
    const promo = await deps.promoCodesService.create(businessId, {
      code: parsed.code,
      discountType: parsed.discountType,
      discountValue: parsed.discountValue,
      minOrderAmount: parsed.minOrderAmount,
      maxUses: parsed.maxUses,
      expiresAt: parsed.expiresAt,
      description: parsed.description,
    });

    const extras: string[] = [];
    if (parsed.minOrderAmount != null) {
      extras.push(`minimum order $${parsed.minOrderAmount}`);
    }
    if (parsed.maxUses != null) {
      extras.push(`max ${parsed.maxUses} uses`);
    }
    const extraNote = extras.length ? ` (${extras.join(', ')})` : '';

    return success(
      'create_promo_code',
      `Created promo code ${promo.code} — ${formatDiscount(parsed)}${extraNote}.`,
      {
        promo: {
          id: promo.id,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
          minOrderAmount:
            promo.minOrderAmount != null ? Number(promo.minOrderAmount) : null,
          maxUses: promo.maxUses,
          expiresAt: promo.expiresAt,
          description: promo.description,
        },
        navigate: NAVIGATE,
      },
    );
  } catch (err: any) {
    return failure(
      'create_promo_code',
      err?.message || 'Could not create promo code.',
      { code: parsed.code, navigate: NAVIGATE },
    );
  }
}

export async function handleDeactivatePromoCodeLogic(
  deps: CreatePromoCodeLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  if (!deps.promoCodesService) {
    return failure(
      'deactivate_promo_code',
      'Promo codes are not available on this surface.',
      { navigate: NAVIGATE },
    );
  }

  const codeParam =
    typeof params.code === 'string' && params.code.trim()
      ? params.code.trim().toUpperCase()
      : undefined;
  const idParam =
    typeof params.promoId === 'string' && params.promoId.trim()
      ? params.promoId.trim()
      : undefined;

  if (!codeParam && !idParam) {
    return failure(
      'deactivate_promo_code',
      'Which promo code should I deactivate? Example: SAVE10.',
      { clarify: true, missing: ['code'], navigate: NAVIGATE },
    );
  }

  const promos = await deps.promoCodesService.list(businessId);
  const promo = idParam
    ? promos.find((p) => p.id === idParam)
    : promos.find((p) => p.code === codeParam);

  if (!promo) {
    return failure(
      'deactivate_promo_code',
      `No promo code "${codeParam ?? idParam}" was found.`,
      { navigate: NAVIGATE },
    );
  }

  try {
    const updated = await deps.promoCodesService.deactivate(
      businessId,
      promo.id,
    );
    return success(
      'deactivate_promo_code',
      `Deactivated promo code ${updated.code}.`,
      { promoId: updated.id, code: updated.code, navigate: NAVIGATE },
    );
  } catch (err: any) {
    return failure(
      'deactivate_promo_code',
      err?.message || 'Could not deactivate promo code.',
      { code: promo.code, navigate: NAVIGATE },
    );
  }
}
