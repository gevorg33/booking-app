/** Tip amounts stored on booking metadata (prov-exp-2.3). */

export interface BookingTipSource {
  metadata?: Record<string, unknown> | null;
}

function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function readPricing(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const safe = metadata ?? {};
  const pricing = safe.pricing;
  return pricing && typeof pricing === 'object'
    ? (pricing as Record<string, unknown>)
    : null;
}

function readPayment(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const safe = metadata ?? {};
  const payment = safe.payment;
  return payment && typeof payment === 'object'
    ? (payment as Record<string, unknown>)
    : null;
}

/** Tip collected on a paid visit (`metadata.payment.tipAmount` or checkout pricing). */
export function resolveBookingTipAmount(source: BookingTipSource): number {
  const payment = readPayment(source.metadata);
  const fromPayment = readNumber(payment?.tipAmount);
  if (fromPayment != null && fromPayment > 0) return fromPayment;

  const pricing = readPricing(source.metadata);
  const fromPricing = readNumber(pricing?.tipAmount);
  if (fromPricing != null && fromPricing > 0) return fromPricing;

  return 0;
}
