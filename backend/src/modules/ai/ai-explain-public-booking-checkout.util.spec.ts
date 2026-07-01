import { EXPLAIN_PUBLIC_BOOKING_CHECKOUT_PROMPTS } from './ai-explain-public-booking-checkout.fixtures.js';
import {
  isExplainPublicBookingCheckoutPrompt,
  rescueExplainPublicBookingCheckoutIntent,
} from './ai-explain-public-booking-checkout.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

describe('ai-explain-public-booking-checkout.util', () => {
  it.each(EXPLAIN_PUBLIC_BOOKING_CHECKOUT_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainPublicBookingCheckoutPrompt(prompt)).toBe(true);
    },
  );

  it('does not detect configure cash mutate', () => {
    expect(
      isExplainPublicBookingCheckoutPrompt(
        'Enable cash payments on public booking',
      ),
    ).toBe(false);
  });

  it('does not detect per-service online payment setup explain', () => {
    expect(
      isExplainPublicBookingCheckoutPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(false);
    expect(
      isExplainServiceOnlinePaymentSetupPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(true);
  });

  it('does not detect checkout total breakdown', () => {
    expect(
      isExplainPublicBookingCheckoutPrompt(
        'Explain checkout total for Massage',
      ),
    ).toBe(false);
  });

  it('does not detect customer apply gift card', () => {
    expect(
      isExplainPublicBookingCheckoutPrompt('Apply my gift card at checkout'),
    ).toBe(false);
  });

  it('rescues unknown action to explain_public_booking_checkout', () => {
    expect(
      rescueExplainPublicBookingCheckoutIntent(
        'Explain public booking checkout payment options',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_public_booking_checkout',
      rescueReason: 'explain_public_booking_checkout',
    });
  });
});
