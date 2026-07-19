import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearCustomerSession,
  getCustomerToken,
  getStoredCustomerProfile,
  mergeCustomerProfileCache,
  setCustomerSession,
} from './customer-auth.js';

describe('customer-auth', () => {
  const slug = 'test-salon';

  beforeEach(() => {
    clearCustomerSession(slug);
  });

  it('stores token and profile per slug', () => {
    setCustomerSession(slug, 'tok-1', {
      id: 'c1',
      name: 'Alex',
      email: 'a@test.com',
      phone: null,
    });
    expect(getCustomerToken(slug)).toBe('tok-1');
    expect(getStoredCustomerProfile(slug)?.name).toBe('Alex');
    clearCustomerSession(slug);
    expect(getCustomerToken(slug)).toBeNull();
  });

  it('returns null for corrupt stored profile', () => {
    localStorage.setItem('consumer_profile_test-salon', '{not-json');
    expect(getStoredCustomerProfile('test-salon')).toBeNull();
  });

  it.each([
    {
      id: 'e2e-bug.31-thin-booking-preserves-contact',
      existing: {
        id: 'c1',
        name: 'Gev Gas',
        email: 'gev@example.com',
        phone: '+15551234567',
      },
      incoming: { id: 'c1', name: 'Gev Gas' },
      expected: {
        id: 'c1',
        name: 'Gev Gas',
        email: 'gev@example.com',
        phone: '+15551234567',
      },
    },
    {
      id: 'e2e-bug.31-incoming-contact-wins',
      existing: {
        id: 'c1',
        name: 'Old',
        email: 'old@example.com',
        phone: '+10000000000',
      },
      incoming: {
        id: 'c1',
        name: 'New',
        email: 'new@example.com',
        phone: '+19999999999',
      },
      expected: {
        id: 'c1',
        name: 'New',
        email: 'new@example.com',
        phone: '+19999999999',
      },
    },
    {
      id: 'e2e-bug.31-empty-incoming-strings-keep-existing',
      existing: {
        id: 'c1',
        name: 'Gev',
        email: 'gev@example.com',
        phone: '+15551234567',
      },
      incoming: { id: 'c1', name: 'Gev', email: '', phone: '   ' },
      expected: {
        id: 'c1',
        name: 'Gev',
        email: 'gev@example.com',
        phone: '+15551234567',
      },
    },
  ])('$id: mergeCustomerProfileCache', ({ existing, incoming, expected }) => {
    expect(mergeCustomerProfileCache(existing, incoming)).toEqual(expected);
  });

  it('e2e-bug.31: setCustomerSession merges thin booking customer onto stored profile', () => {
    setCustomerSession(slug, 'tok-1', {
      id: 'c1',
      name: 'Gev Gas',
      email: 'gev@example.com',
      phone: '+15551234567',
    });
    // Booking-creation shape: id + name only (no email/phone).
    setCustomerSession(slug, 'tok-1', {
      id: 'c1',
      name: 'Gev Gas',
      email: null,
      phone: null,
    });
    expect(getStoredCustomerProfile(slug)).toEqual({
      id: 'c1',
      name: 'Gev Gas',
      email: 'gev@example.com',
      phone: '+15551234567',
    });
    expect(getCustomerToken(slug)).toBe('tok-1');
  });
});
