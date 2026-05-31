export type SubscriptionDiscountType = 'percent' | 'fixed';

export interface SubscriptionPricingPreview {
  unitPrice: number;
  appointments: number;
  regularTotal: number;
  subscriptionPrice: number;
  savings: number;
  perAppointmentPrice: number;
}

export function calculateSubscriptionPricing(
  unitPrice: number,
  appointments: number,
  discountType: SubscriptionDiscountType,
  discountValue: number,
): SubscriptionPricingPreview {
  const regularTotal = roundMoney(unitPrice * appointments);
  let subscriptionPrice = regularTotal;

  if (discountType === 'percent') {
    subscriptionPrice = roundMoney(regularTotal * (1 - discountValue / 100));
  } else {
    subscriptionPrice = roundMoney(regularTotal - discountValue);
  }

  subscriptionPrice = Math.max(0, subscriptionPrice);
  const savings = roundMoney(regularTotal - subscriptionPrice);
  const perAppointmentPrice =
    appointments > 0 ? roundMoney(subscriptionPrice / appointments) : 0;

  return {
    unitPrice,
    appointments,
    regularTotal,
    subscriptionPrice,
    savings,
    perAppointmentPrice,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
