import type { PublicBusinessProfile, PublicCheckoutQuote } from './types.js';
import type { PackageBookingLine } from './package-booking.js';

export type PackageCheckoutPaymentMethod = 'online' | 'cash';

const PENDING_KEY = 'consumer_pending_package_checkout_payment';

export interface PendingPackageCheckoutPayment {
  slug: string;
  sessionId: string;
  packageId: string;
  linesKey: string;
  lines?: PackageBookingLine[];
  updatedAt: string;
}

export function packageLinesKey(lines: PackageBookingLine[]): string {
  return lines.map((line) => `${line.serviceId}:${line.startTime}`).join('|');
}

export function packageLinesMatch(left: PackageBookingLine[], right: PackageBookingLine[]): boolean {
  return packageLinesKey(left) === packageLinesKey(right);
}

export function resolvePackageAmountDue(
  quote: PublicCheckoutQuote | null | undefined,
  fallbackSubtotal: number,
): number {
  if (quote && Number.isFinite(quote.amountDue)) return quote.amountDue;
  return fallbackSubtotal;
}

export function showPackageCashOption(
  profile: Pick<PublicBusinessProfile, 'acceptCashPayments' | 'onlinePaymentsEnabled'>,
  amountDue: number,
): boolean {
  return (
    profile.acceptCashPayments === true &&
    profile.onlinePaymentsEnabled === true &&
    amountDue > 0
  );
}

export function requiresPackageOnlinePayment(
  profile: Pick<PublicBusinessProfile, 'onlinePaymentsEnabled'>,
  amountDue: number,
  paymentMethod: PackageCheckoutPaymentMethod,
): boolean {
  if (amountDue <= 0) return false;
  if (!profile.onlinePaymentsEnabled) return false;
  return paymentMethod !== 'cash';
}

export function savePendingPackageCheckoutPayment(
  pending: Omit<PendingPackageCheckoutPayment, 'updatedAt' | 'linesKey'> & {
    lines: PackageBookingLine[];
  },
): void {
  if (typeof localStorage === 'undefined') return;
  const next: PendingPackageCheckoutPayment = {
    slug: pending.slug.trim().toLowerCase(),
    sessionId: pending.sessionId,
    packageId: pending.packageId,
    lines: pending.lines,
    linesKey: packageLinesKey(pending.lines),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

function readPendingPackageCheckoutRaw(): PendingPackageCheckoutPayment | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPackageCheckoutPayment;
  } catch {
    return null;
  }
}

/** Load pending package checkout by slug + packageId (for Stripe return restore). */
export function loadPendingPackageCheckoutByPackage(
  slug: string,
  packageId: string,
): PendingPackageCheckoutPayment | null {
  if (!slug.trim() || !packageId.trim()) return null;
  const parsed = readPendingPackageCheckoutRaw();
  if (!parsed?.sessionId) return null;
  if (parsed.slug !== slug.trim().toLowerCase()) return null;
  if (parsed.packageId !== packageId) return null;
  return parsed;
}

export function loadPendingPackageCheckoutPayment(
  slug: string,
  packageId: string,
  lines: PackageBookingLine[],
): PendingPackageCheckoutPayment | null {
  const parsed = loadPendingPackageCheckoutByPackage(slug, packageId);
  if (!parsed) return null;
  if (parsed.linesKey !== packageLinesKey(lines)) return null;
  return parsed;
}

export function clearPendingPackageCheckoutPayment(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PENDING_KEY);
}
