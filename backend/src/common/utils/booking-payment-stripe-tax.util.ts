import type { CheckoutPricingResult } from '../../modules/promo-codes/checkout-pricing.types.js';

/** Tax-aware amount charged via Stripe (inclusive: gross price; exclusive: net + tax). */
export function resolveStripeChargeAmount(
  pricing: Pick<CheckoutPricingResult, 'amountDue'>,
): number {
  return Math.max(0, Number(pricing.amountDue) || 0);
}

export function resolveStripeChargeAmountCents(
  pricing: Pick<CheckoutPricingResult, 'amountDue'>,
): number {
  return Math.round(resolveStripeChargeAmount(pricing) * 100);
}

export function isCheckoutPricingResult(
  value: unknown,
): value is CheckoutPricingResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as CheckoutPricingResult;
  return (
    typeof candidate.amountDue === 'number' &&
    typeof candidate.subtotal === 'number' &&
    typeof candidate.servicePrice === 'number' &&
    typeof candidate.currency === 'string'
  );
}

/** Prefer frozen checkout pricing from a Stripe draft when fulfilling payment. */
export function resolveFulfillmentCheckoutPricing(
  recalculated: CheckoutPricingResult,
  frozen?: unknown,
): CheckoutPricingResult {
  if (isCheckoutPricingResult(frozen)) {
    return frozen;
  }
  return recalculated;
}

function stringifyMetadataValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.slice(0, 500);
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function assignMetadataField(
  metadata: Record<string, string>,
  key: string,
  value: unknown,
): void {
  const normalized = stringifyMetadataValue(value);
  if (normalized !== undefined && normalized !== '') {
    metadata[key] = normalized;
  }
}

export function stripeTaxIsChargeable(pricing: CheckoutPricingResult): boolean {
  return pricing.taxEnabled === true && (pricing.taxAmount ?? 0) > 0;
}

/** Stripe metadata keys for tax audit on Checkout Session + PaymentIntent. */
export function buildStripeTaxMetadata(
  pricing: CheckoutPricingResult,
): Record<string, string> {
  const amountCents = resolveStripeChargeAmountCents(pricing);
  const metadata: Record<string, string> = {
    chargeAmount: String(resolveStripeChargeAmount(pricing)),
    chargeAmountCents: String(amountCents),
  };

  if (!stripeTaxIsChargeable(pricing)) {
    metadata.taxEnabled = 'false';
    return metadata;
  }

  metadata.taxEnabled = 'true';
  assignMetadataField(metadata, 'taxName', pricing.taxName);
  assignMetadataField(metadata, 'taxModel', pricing.taxModel);
  assignMetadataField(metadata, 'taxRate', pricing.taxRate);
  assignMetadataField(metadata, 'taxAmount', pricing.taxAmount);
  assignMetadataField(metadata, 'netAmount', pricing.netAmount);

  if (pricing.taxRules?.length) {
    metadata.taxRuleCount = String(pricing.taxRules.length);
    metadata.taxRules = JSON.stringify(
      pricing.taxRules.map(({ id, name, rate, amount }) => ({
        id,
        name,
        rate,
        amount,
      })),
    ).slice(0, 500);
  }

  return metadata;
}

export function mergeStripeCheckoutMetadata(
  base: Record<string, string>,
  pricing: CheckoutPricingResult,
): Record<string, string> {
  return {
    ...base,
    ...buildStripeTaxMetadata(pricing),
  };
}
