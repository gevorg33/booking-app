import { roundBonus } from '../loyalty/loyalty.constants.js';

export interface BookingPaymentAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty' | 'retail';
  label: string;
  code?: string;
  amount: number;
  points?: number;
}

export interface BookingRetailLineSummary {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingPaymentSummary {
  currency: string;
  servicePrice: number | null;
  subtotal: number | null;
  promoDiscount: number;
  giftCardDiscount: number;
  loyaltyDiscount: number;
  loyaltyPointsRedeemed: number;
  promoCode: string | null;
  giftCardCode: string | null;
  cashPaid: number;
  retailTotal: number;
  retailLines: BookingRetailLineSummary[];
  grandTotal: number;
  totalDiscount: number;
  hasDiscounts: boolean;
  adjustments: BookingPaymentAdjustment[];
}

export interface BookingPaymentSummarySource {
  metadata?: Record<string, unknown> | null;
  service?: { price?: number | string | null; currency?: string | null } | null;
}

function readPricing(metadata: Record<string, unknown>): Record<string, unknown> | null {
  const pricing = metadata.pricing;
  return pricing && typeof pricing === 'object' ? (pricing as Record<string, unknown>) : null;
}

function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function readAdjustments(pricing: Record<string, unknown>): BookingPaymentAdjustment[] {
  const raw = pricing.adjustments;
  if (!Array.isArray(raw)) return [];

  const adjustments: BookingPaymentAdjustment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const type =
      row.type === 'promo' || row.type === 'gift_card' || row.type === 'loyalty' || row.type === 'retail'
        ? row.type
        : null;
    const amount = readNumber(row.amount);
    if (!type || amount == null || amount <= 0) continue;
    const defaultLabel =
      type === 'promo'
        ? 'Promo discount'
        : type === 'gift_card'
          ? 'Gift card'
          : type === 'retail'
            ? 'Retail product'
            : 'Loyalty bonuses';
    adjustments.push({
      type,
      label: typeof row.label === 'string' ? row.label : defaultLabel,
      code: typeof row.code === 'string' ? row.code : undefined,
      amount: roundBonus(amount),
      points: readNumber(row.points) ?? undefined,
    });
  }
  return adjustments;
}

function fallbackAdjustments(
  promoDiscount: number,
  giftCardDiscount: number,
  loyaltyDiscount: number,
  promoCode: string | null,
  giftCardCode: string | null,
  loyaltyPointsRedeemed: number,
): BookingPaymentAdjustment[] {
  const adjustments: BookingPaymentAdjustment[] = [];
  if (promoDiscount > 0) {
    adjustments.push({
      type: 'promo',
      label: promoCode ? `Promo ${promoCode}` : 'Promo discount',
      code: promoCode ?? undefined,
      amount: promoDiscount,
    });
  }
  if (giftCardDiscount > 0) {
    adjustments.push({
      type: 'gift_card',
      label: giftCardCode ? `Gift card ${giftCardCode}` : 'Gift card',
      code: giftCardCode ?? undefined,
      amount: giftCardDiscount,
    });
  }
  if (loyaltyDiscount > 0) {
    adjustments.push({
      type: 'loyalty',
      label: 'Loyalty bonuses',
      amount: loyaltyDiscount,
      points: loyaltyPointsRedeemed > 0 ? loyaltyPointsRedeemed : undefined,
    });
  }
  return adjustments;
}

/** Structured checkout payment breakdown for admin/provider appointment details. */
export function resolveBookingPaymentSummary(
  source: BookingPaymentSummarySource,
  retailLines: BookingRetailLineSummary[] = [],
): BookingPaymentSummary | null {
  const metadata = source.metadata ?? {};
  const pricing = readPricing(metadata);
  if (
    !pricing &&
    metadata.amountPaid == null &&
    metadata.prepaymentAmount == null &&
    retailLines.length === 0
  ) {
    return null;
  }

  const currency =
    (typeof source.service?.currency === 'string' && source.service.currency) || 'USD';
  const servicePrice =
    readNumber(pricing?.servicePrice) ?? readNumber(source.service?.price);
  const subtotal = readNumber(pricing?.subtotal);
  const promoDiscount = roundBonus(readNumber(pricing?.promoDiscount) ?? 0);
  const giftCardDiscount = roundBonus(readNumber(pricing?.giftCardDiscount) ?? 0);
  const loyaltyDiscount = roundBonus(readNumber(pricing?.loyaltyDiscount) ?? 0);
  const loyaltyPointsRedeemed = roundBonus(
    readNumber(pricing?.loyaltyPointsRedeemed ?? pricing?.loyaltyPointsToRedeem) ?? 0,
  );
  const promoCode = typeof pricing?.promoCode === 'string' ? pricing.promoCode : null;
  const giftCardCode = typeof pricing?.giftCardCode === 'string' ? pricing.giftCardCode : null;

  let cashPaid =
    readNumber(pricing?.amountDue) ??
    readNumber(metadata.amountPaid) ??
    readNumber(metadata.cashPaidEligible) ??
    readNumber(metadata.prepaymentAmount);

  if (cashPaid == null && subtotal != null) {
    cashPaid = Math.max(0, subtotal - promoDiscount - giftCardDiscount - loyaltyDiscount);
  }
  cashPaid = roundBonus(cashPaid ?? 0);

  const retailTotal = roundBonus(
    retailLines.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const grandTotal = roundBonus(cashPaid + retailTotal);

  const totalDiscount = roundBonus(
    readNumber(pricing?.totalDiscount) ?? promoDiscount + giftCardDiscount + loyaltyDiscount,
  );

  const parsedAdjustments = pricing ? readAdjustments(pricing) : [];
  const adjustments =
    parsedAdjustments.length > 0
      ? parsedAdjustments
      : fallbackAdjustments(
          promoDiscount,
          giftCardDiscount,
          loyaltyDiscount,
          promoCode,
          giftCardCode,
          loyaltyPointsRedeemed,
        );

  return {
    currency,
    servicePrice,
    subtotal,
    promoDiscount,
    giftCardDiscount,
    loyaltyDiscount,
    loyaltyPointsRedeemed,
    promoCode,
    giftCardCode,
    cashPaid,
    retailTotal,
    retailLines,
    grandTotal,
    totalDiscount,
    hasDiscounts: promoDiscount > 0 || giftCardDiscount > 0 || loyaltyDiscount > 0 || retailTotal > 0,
    adjustments,
  };
}

export function withBookingPaymentSummary<T extends BookingPaymentSummarySource>(
  booking: T,
  retailLines: BookingRetailLineSummary[] = [],
): T & { paymentSummary: BookingPaymentSummary | null } {
  return {
    ...booking,
    paymentSummary: resolveBookingPaymentSummary(booking, retailLines),
  };
}
