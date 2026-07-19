/** e2e-bug.18 — tell the API Stripe should return to this consumer-app origin. */

export type CheckoutClientReturnFields = {
  clientSurface: 'consumer';
  returnOrigin?: string;
};

/** Safe http(s) origin for Stripe return URLs (skips capacitor:// etc.). */
export function resolveCheckoutReturnOrigin(
  origin: string | undefined = typeof window !== 'undefined' ? window.location.origin : undefined,
): string | undefined {
  const trimmed = origin?.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

export function checkoutClientReturnFields(
  origin?: string,
): CheckoutClientReturnFields {
  const returnOrigin = resolveCheckoutReturnOrigin(origin);
  return returnOrigin
    ? { clientSurface: 'consumer', returnOrigin }
    : { clientSurface: 'consumer' };
}
