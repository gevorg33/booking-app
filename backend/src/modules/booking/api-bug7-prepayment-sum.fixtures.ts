/**
 * api-bug.7 — online `amountDue` / `prepaymentAmount` is the sum of per-line
 * prepayments (0 for `prepaymentMode:none`), not the catalog/package total.
 * Catalog cart total stays in `servicePrice`.
 */

export const API_BUG7_SOURCE_RULES = [
  {
    id: 'api7-source-package-uses-sum',
    file: 'booking-payment.service.ts',
    mustContain:
      'api-bug.7 — online amount is sum of per-line prepayments, not full package price.',
  },
  {
    id: 'api7-source-multi-uses-sum',
    file: 'booking-payment.service.ts',
    mustContain:
      "api-bug.7 — charge only what each line's prepaymentMode requires (0 for none).",
  },
  {
    id: 'api7-source-sum-helper',
    file: 'booking-payment.service.ts',
    mustContain: 'private async sumServicesPrepaymentAmount(',
  },
] as const;

export const API_BUG7_UNIT_SCENARIOS = [
  {
    id: 'api7-unit-all-none-zero-prepay',
    modes: ['none', 'none'] as const,
    prices: [120, 100],
    deposits: [null, null] as const,
    expectPrepayment: 0,
  },
  {
    id: 'api7-unit-mixed-deposit-only',
    modes: ['none', 'deposit'] as const,
    prices: [120, 100],
    deposits: [null, 25] as const,
    expectPrepayment: 25,
  },
  {
    id: 'api7-unit-full-plus-none',
    modes: ['full', 'none'] as const,
    prices: [40, 80],
    deposits: [null, null] as const,
    expectPrepayment: 40,
  },
  {
    id: 'api7-unit-cap-at-package-price',
    modes: ['full', 'full'] as const,
    prices: [120, 100],
    deposits: [null, null] as const,
    packageCap: 180,
    expectPrepayment: 180,
  },
] as const;

export const API_BUG7_LIVE_SCENARIOS = [
  {
    id: 'api7-live-package-quote-deposit-line-only',
    description:
      'Massage Package quote: servicePrice=packagePrice; amountDue=sum of line deposits (not full package)',
  },
  {
    id: 'api7-live-package-checkout-charges-prepay-only',
    description:
      'POST packages/checkout succeeds when amountDue>0 and Stripe session amount matches prepay sum',
  },
  {
    id: 'api7-live-package-all-none-amount-due-zero',
    description:
      'With all package lines temporarily prepaymentMode:none → amountDue:0 and checkout 400 No payment is due',
  },
  {
    id: 'api7-live-multi-all-none-quote',
    description:
      'Multi-service quote of two none lines: servicePrice>0, amountDue:0',
  },
  {
    id: 'api7-live-multi-all-none-checkout-refused',
    description:
      'Multi-service checkout with amountDue:0 → 400 No payment is due…',
  },
  {
    id: 'api7-live-multi-mixed-deposit',
    description:
      'Multi quote deposit+none → amountDue equals deposit only',
  },
  {
    id: 'api7-live-single-deposit-quote',
    description:
      'Single-service deposit quote: servicePrice=catalog, amountDue=deposit',
  },
  {
    id: 'api7-live-frontend-cart-total-semantics',
    description:
      'resolvePublicCheckoutCartTotal keeps servicePrice when amountDue is 0',
  },
] as const;

export type ApiBug7LiveScenario = (typeof API_BUG7_LIVE_SCENARIOS)[number];
