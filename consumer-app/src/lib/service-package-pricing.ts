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
  const savingsPercent = regularTotal > 0 ? roundMoney((savings / regularTotal) * 100) : 0;

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

export interface PackageLineAllocation {
  lineTotal: number;
  discountedLineTotal: number;
  lineSavings: number;
}

/** Proportional per-line discount so line totals sum to packagePrice. */
export function allocatePackageLinePricing(
  items: PackageLineItemInput[],
  packagePrice: number,
): PackageLineAllocation[] {
  const lineTotals = items.map((item) => roundMoney(item.unitPrice * item.quantity));
  const regularTotal = roundMoney(lineTotals.reduce((sum, total) => sum + total, 0));

  if (regularTotal <= 0 || items.length === 0) {
    return items.map(() => ({
      lineTotal: 0,
      discountedLineTotal: 0,
      lineSavings: 0,
    }));
  }

  if (packagePrice >= regularTotal) {
    return lineTotals.map((lineTotal) => ({
      lineTotal,
      discountedLineTotal: lineTotal,
      lineSavings: 0,
    }));
  }

  const discountedLines = lineTotals.map((lineTotal) =>
    roundMoney((lineTotal / regularTotal) * packagePrice),
  );
  const allocatedSum = roundMoney(discountedLines.reduce((sum, total) => sum + total, 0));
  const remainder = roundMoney(packagePrice - allocatedSum);
  if (remainder !== 0) {
    const lastIndex = discountedLines.length - 1;
    discountedLines[lastIndex] = roundMoney(discountedLines[lastIndex] + remainder);
  }

  return lineTotals.map((lineTotal, index) => {
    const discountedLineTotal = discountedLines[index];
    return {
      lineTotal,
      discountedLineTotal,
      lineSavings: roundMoney(lineTotal - discountedLineTotal),
    };
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
