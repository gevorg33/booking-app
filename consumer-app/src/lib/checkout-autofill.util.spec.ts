import { beforeEach, describe, expect, it } from 'vitest';
import { CHECKOUT_AUTOFILL_SCENARIOS } from './checkout-autofill.fixtures.js';
import {
  guestContactFieldAttrs,
  loadRememberedCheckoutContact,
  rememberedCheckoutContactKey,
  resolveCheckoutContactPrefill,
  saveRememberedCheckoutContact,
} from './checkout-autofill.util.js';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
  });
}

describe('checkout-autofill.util', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it.each(CHECKOUT_AUTOFILL_SCENARIOS)(
    'resolveCheckoutContactPrefill $id',
    ({ sources, expected }) => {
      expect(resolveCheckoutContactPrefill(sources)).toEqual(expected);
    },
  );

  it('persists remembered checkout contact per slug', () => {
    saveRememberedCheckoutContact('Salon-A', {
      name: 'Alex',
      email: 'a@test.com',
      phone: '+100',
    });
    expect(rememberedCheckoutContactKey('Salon-A')).toBe('consumer_checkout_contact_salon-a');
    expect(loadRememberedCheckoutContact('salon-a')).toEqual({
      name: 'Alex',
      email: 'a@test.com',
      phone: '+100',
    });
    expect(loadRememberedCheckoutContact('other')).toBeNull();
  });

  it('maps guest contact field autofill attrs', () => {
    expect(guestContactFieldAttrs('email')).toMatchObject({
      name: 'email',
      autocomplete: 'email',
      inputMode: 'email',
    });
    expect(guestContactFieldAttrs('phone')).toMatchObject({
      name: 'tel',
      autocomplete: 'tel',
      inputMode: 'tel',
      enterKeyHint: 'done',
    });
  });
});
