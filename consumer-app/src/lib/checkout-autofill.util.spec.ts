import { describe, expect, it } from 'vitest';
import { CHECKOUT_AUTOFILL_SCENARIOS } from './checkout-autofill.fixtures.js';
import {
  mergeCheckoutContactPrefill,
  resolveCheckoutContactPrefill,
  shouldCompactCheckoutContact,
} from './checkout-autofill.util.js';

describe('resolveCheckoutContactPrefill', () => {
  it.each(CHECKOUT_AUTOFILL_SCENARIOS)('$id', ({ sources, expected }) => {
    expect(resolveCheckoutContactPrefill(sources)).toEqual(expected);
  });
});

describe('mergeCheckoutContactPrefill (e2e-bug.8)', () => {
  it('fills empty fields from a signed-in profile without clobbering edits', () => {
    const profile = { id: 'c1', name: 'Test Customer', email: 'test@ex.com', phone: '+100' };
    const empty = { name: '', email: '', phone: '' };
    const filled = mergeCheckoutContactPrefill(empty, { profile });
    expect(filled).toEqual({
      name: 'Test Customer',
      email: 'test@ex.com',
      phone: '+100',
    });

    const edited = { name: 'Edited', email: '', phone: '' };
    const merged = mergeCheckoutContactPrefill(edited, { profile });
    expect(merged).toEqual({
      name: 'Edited',
      email: 'test@ex.com',
      phone: '+100',
    });
  });

  it('returns the same object when nothing changes', () => {
    const prev = { name: 'Alex', email: 'a@test.com', phone: '+1' };
    const result = mergeCheckoutContactPrefill(prev, {
      profile: { id: 'c1', name: 'Alex', email: 'a@test.com', phone: '+1' },
    });
    expect(result).toBe(prev);
  });
});

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
