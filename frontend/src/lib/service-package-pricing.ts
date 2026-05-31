export type PackageDiscountType = 'percent' | 'fixed';

export interface PackageLineItemInput {
  unitPrice: number;
  quantity: number;
}

export interface PackagePricingPreview {
  regularTotal: number;
  packagePrice: number;
  savings: number;
  savingsPercent: number;
  discountType: PackageDiscountType;
  discountValue: number;
  lineItems: Array<{
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
}

export function calculatePackagePricing(
  items: PackageLineItemInput[],
  discountType: PackageDiscountType,
  discountValue: number,
): PackagePricingPreview {
  const lineItems = items.map((item) => ({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: roundMoney(item.unitPrice * item.quantity),
  }));
  const regularTotal = roundMoney(lineItems.reduce((sum, line) => sum + line.lineTotal, 0));

  let packagePrice = regularTotal;
  if (discountType === 'percent') {
    packagePrice = roundMoney(regularTotal * (1 - discountValue / 100));
  } else {
    packagePrice = roundMoney(regularTotal - discountValue);
  }

  packagePrice = Math.max(0, packagePrice);
  const savings = roundMoney(regularTotal - packagePrice);
  const savingsPercent =
    regularTotal > 0 ? roundMoney((savings / regularTotal) * 100) : 0;

  return {
    regularTotal,
    packagePrice,
    savings,
    savingsPercent,
    discountType,
    discountValue,
    lineItems,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
