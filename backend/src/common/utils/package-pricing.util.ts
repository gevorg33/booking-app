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

export function isPackageOfferExpired(expiresAt: Date | string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < now;
}

export function isPackagePubliclyVisible(
  isActive: boolean,
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  return isActive && !isPackageOfferExpired(expiresAt, now);
}

export function resolvePackageCheckoutGraceHours(settings: Record<string, unknown> | null | undefined): number {
  const publicBooking = settings?.publicBooking as Record<string, unknown> | undefined;
  const value = Number(publicBooking?.packageCheckoutGraceHours ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function isPackageBookable(
  isActive: boolean,
  expiresAt: Date | string | null | undefined,
  graceHours = 0,
  now = new Date(),
): boolean {
  if (!isActive) return false;
  if (!expiresAt) return true;
  const expires = new Date(expiresAt);
  if (expires >= now) return true;
  if (graceHours <= 0) return false;
  return now.getTime() <= expires.getTime() + graceHours * 3_600_000;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
