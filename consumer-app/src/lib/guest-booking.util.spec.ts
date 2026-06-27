import { describe, expect, it } from 'vitest';
import {
  normalizeGuestContact,
  resolveCheckoutContact,
  validateGuestCheckoutContact,
} from './guest-booking.util.js';

describe('guest-booking.util', () => {
  it('validates required contact fields', () => {
    expect(validateGuestCheckoutContact(normalizeGuestContact({ name: 'A' }))).toMatch(/email|phone/i);
    expect(validateGuestCheckoutContact(normalizeGuestContact({ name: 'A', email: 'a@b.com' }))).toBeNull();
  });

  it('prefers stored profile over guest draft', () => {
    expect(
      resolveCheckoutContact(
        { id: 'c1', name: 'Logged In', email: 'a@b.com', phone: null },
        normalizeGuestContact({ name: 'Guest', email: 'g@b.com' }),
      ),
    ).toEqual({ name: 'Logged In', email: 'a@b.com', phone: '' });
  });

  it('merges guest email and phone when stored profile only has a name', () => {
    expect(
      resolveCheckoutContact(
        { id: 'c1', name: 'Tina Kristina', email: null, phone: null },
        normalizeGuestContact({
          name: 'Tina Kristina',
          email: 'guest@example.com',
          phone: '+37495018414',
        }),
      ),
    ).toEqual({
      name: 'Tina Kristina',
      email: 'guest@example.com',
      phone: '+37495018414',
    });
  });
});
