import { resolveBookingTipAmount } from './booking-tip.util.js';

describe('booking-tip.util (prov-exp-2.3)', () => {
  it('returns zero when no tip metadata exists', () => {
    expect(resolveBookingTipAmount({ metadata: null })).toBe(0);
    expect(resolveBookingTipAmount({ metadata: {} })).toBe(0);
  });

  it('prefers metadata.payment.tipAmount', () => {
    expect(
      resolveBookingTipAmount({
        metadata: {
          payment: { tipAmount: 12.5 },
          pricing: { tipAmount: 5 },
        },
      }),
    ).toBe(12.5);
  });

  it('falls back to metadata.pricing.tipAmount', () => {
    expect(
      resolveBookingTipAmount({
        metadata: { pricing: { tipAmount: 8 } },
      }),
    ).toBe(8);
  });

  it('ignores invalid or non-positive tip amounts', () => {
    expect(
      resolveBookingTipAmount({
        metadata: { payment: { tipAmount: 0 } },
      }),
    ).toBe(0);
    expect(
      resolveBookingTipAmount({
        metadata: { payment: { tipAmount: 'bad' } },
      }),
    ).toBe(0);
    expect(
      resolveBookingTipAmount({
        metadata: { payment: { tipAmount: -3 } },
      }),
    ).toBe(0);
  });
});
