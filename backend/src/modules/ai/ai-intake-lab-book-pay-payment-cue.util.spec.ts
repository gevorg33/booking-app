import { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';

describe('ai-intake-lab-book-pay-payment-cue.util (ai-cmd-customer-4.21.1)', () => {
  it('detects pay online and deposit phrasing', () => {
    expect(hasIntakeLabBookPayPaymentCue('pay online')).toBe(true);
    expect(
      hasIntakeLabBookPayPaymentCue('pay deposit for my lab booking'),
    ).toBe(true);
  });

  it('detects payment options when lab intake context is present', () => {
    expect(
      hasIntakeLabBookPayPaymentCue(
        'Fill intake and book blood draw; what payment options at checkout',
      ),
    ).toBe(true);
  });

  it('returns false without payment language', () => {
    expect(
      hasIntakeLabBookPayPaymentCue('Fill intake and book blood draw'),
    ).toBe(false);
  });
});
