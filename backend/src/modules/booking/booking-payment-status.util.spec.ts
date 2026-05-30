import { PaymentStatus } from './entities/booking.entity.js';
import { resolveCheckoutPaymentStatus } from './booking-payment-status.util.js';

describe('resolveCheckoutPaymentStatus', () => {
  it('returns paid when nothing is owed', () => {
    expect(
      resolveCheckoutPaymentStatus({
        amountDue: 0,
        giftCardDiscount: 50,
        loyaltyDiscount: 0,
      }),
    ).toBe(PaymentStatus.PAID);
  });

  it('returns partially_paid when gift card or loyalty used and cash remains', () => {
    expect(
      resolveCheckoutPaymentStatus({
        amountDue: 30,
        giftCardDiscount: 20,
        loyaltyDiscount: 0,
      }),
    ).toBe(PaymentStatus.PARTIALLY_PAID);

    expect(
      resolveCheckoutPaymentStatus({
        amountDue: 10,
        giftCardDiscount: 0,
        loyaltyDiscount: 40,
      }),
    ).toBe(PaymentStatus.PARTIALLY_PAID);
  });

  it('returns pending when full amount is still owed in cash', () => {
    expect(
      resolveCheckoutPaymentStatus({
        amountDue: 100,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
      }),
    ).toBe(PaymentStatus.PENDING);
  });

  it('returns pending when only promo discount reduced price (no credits)', () => {
    expect(
      resolveCheckoutPaymentStatus({
        amountDue: 80,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
      }),
    ).toBe(PaymentStatus.PENDING);
  });
});
