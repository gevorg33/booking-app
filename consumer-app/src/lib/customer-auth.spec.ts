import {
  clearCustomerSession,
  getCustomerToken,
  getStoredCustomerProfile,
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
});
