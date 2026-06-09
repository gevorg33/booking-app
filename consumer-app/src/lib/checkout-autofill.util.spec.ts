import { describe, expect, it } from 'vitest';
import { shouldCompactCheckoutContact } from './checkout-autofill.util.js';

describe('shouldCompactCheckoutContact', () => {
  it('does not compact after a single email character', () => {
    expect(
      shouldCompactCheckoutContact({ name: 'Alex', email: 'g', phone: '' }),
    ).toBe(false);
  });

  it('does not compact with name only', () => {
    expect(
      shouldCompactCheckoutContact({ name: 'Alex', email: '', phone: '' }),
    ).toBe(false);
  });

  it('compacts with a complete email', () => {
    expect(
      shouldCompactCheckoutContact({ name: 'Alex', email: 'alex@gmail.com', phone: '' }),
    ).toBe(true);
  });

  it('compacts with a complete phone', () => {
    expect(
      shouldCompactCheckoutContact({ name: 'Alex', email: '', phone: '+37499123456' }),
    ).toBe(true);
  });
});
