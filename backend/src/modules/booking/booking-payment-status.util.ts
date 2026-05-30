import { PaymentStatus } from './entities/booking.entity.js';

export interface CheckoutPaymentStatusInput {
  amountDue: number;
  giftCardDiscount?: number;
  loyaltyDiscount?: number;
}

/** Credits (gift card / loyalty) applied with cash still owed → partially_paid. */
export function resolveCheckoutPaymentStatus(
  pricing: CheckoutPaymentStatusInput,
): PaymentStatus {
  const amountDue = Math.max(0, Number(pricing.amountDue) || 0);
  const giftCardDiscount = Math.max(0, Number(pricing.giftCardDiscount) || 0);
  const loyaltyDiscount = Math.max(0, Number(pricing.loyaltyDiscount) || 0);
  const creditsApplied = giftCardDiscount > 0 || loyaltyDiscount > 0;

  if (amountDue <= 0) {
    return PaymentStatus.PAID;
  }
  if (creditsApplied) {
    return PaymentStatus.PARTIALLY_PAID;
  }
  return PaymentStatus.PENDING;
}
