import type { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import type { CommandResult } from './command-completion.types.js';

const NAVIGATE = { path: '/dashboard/marketing/promo-codes' };

export interface ListPromoCodesLogicDeps {
  promoCodesService?: Pick<PromoCodesService, 'list'>;
}

export async function handleListPromoCodesLogic(
  deps: ListPromoCodesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  if (!deps.promoCodesService) {
    return {
      success: false,
      action: 'list_promo_codes',
      summary: 'Promo codes are not available on this surface.',
      details: { navigate: NAVIGATE },
    };
  }

  const activeOnly =
    params.activeOnly === true ||
    params.activeOnly === 'true' ||
    (typeof params._prompt === 'string' &&
      /\bactive\b/i.test(params._prompt as string));

  const promos = await deps.promoCodesService.list(businessId);
  const filtered = activeOnly
    ? promos.filter((p) => p.isActive)
    : promos;

  if (filtered.length === 0) {
    return {
      success: true,
      action: 'list_promo_codes',
      summary: activeOnly
        ? 'No active promo codes right now.'
        : 'No promo codes configured yet.',
      details: { promos: [], navigate: NAVIGATE },
    };
  }

  const lines = filtered.slice(0, 20).map((p) => {
    const value =
      p.discountType === 'percent'
        ? `${p.discountValue}% off`
        : `$${p.discountValue} off`;
    const status = p.isActive ? 'active' : 'inactive';
    return `• ${p.code} — ${value} (${status})`;
  });

  return {
    success: true,
    action: 'list_promo_codes',
    summary: [
      `${filtered.length} promo code(s)${activeOnly ? ' (active)' : ''}:`,
      ...lines,
    ].join('\n'),
    details: { promos: filtered, navigate: NAVIGATE },
  };
}
