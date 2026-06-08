import { describe, expect, it } from 'vitest';
import { GUEST_CONTACT_SCENARIOS } from './guest-booking.fixtures.js';
import {
  guestContactAutocomplete,
  resolveCheckoutContact,
  validateGuestCheckoutContact,
} from './guest-booking.util.js';

describe('guest-booking.util', () => {
  it.each(GUEST_CONTACT_SCENARIOS)(
    'resolveCheckoutContact $id',
    ({ stored, guest, expected }) => {
      const resolved = resolveCheckoutContact(stored, guest);
      expect(resolved).toEqual(expected);
    },
  );

  it.each(GUEST_CONTACT_SCENARIOS.filter((scenario) => scenario.error))(
    'validateGuestCheckoutContact $id',
    ({ stored, guest, error }) => {
      const resolved = resolveCheckoutContact(stored, guest);
      if (!resolved) {
        expect(validateGuestCheckoutContact({ name: guest.name, email: guest.email, phone: guest.phone })).toBe(error);
        return;
      }
      expect(validateGuestCheckoutContact(resolved)).toBe(error);
    },
  );

  it('maps autocomplete tokens', () => {
    expect(guestContactAutocomplete('name')).toBe('name');
    expect(guestContactAutocomplete('email')).toBe('email');
    expect(guestContactAutocomplete('phone')).toBe('tel');
  });
});
