import { beforeEach, describe, expect, it } from 'vitest';
import { REMEMBERED_TENANT_SCENARIOS } from './customer-auth.fixtures.js';
import {
  buildRememberedTenants,
  canSwitchWithoutReLogin,
  clearCustomerSession,
  getActiveTenantSlug,
  getCustomerToken,
  getStoredCustomerProfile,
  listKnownCustomerTenants,
  recordActiveTenant,
  setCustomerSession,
} from './customer-auth.js';
import { writeStoredConsumerLocale } from './tenant-locale.js';
import { rememberSalon } from './recent-salons.js';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
  });
}

describe('customer-auth', () => {
  const slug = 'test-salon';

  beforeEach(() => {
    installLocalStorageMock();
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

  it('lists known tenants from stored sessions', () => {
    setCustomerSession('salon-a', 'tok-a', {
      id: 'c1',
      name: 'Alex',
      email: 'a@test.com',
      phone: null,
    });
    setCustomerSession('salon-b', null, {
      id: 'c2',
      name: 'Sam',
      email: 's@test.com',
      phone: null,
    });
    const tenants = listKnownCustomerTenants();
    expect(tenants.map((tenant) => tenant.slug).sort()).toEqual(['salon-a', 'salon-b']);
    expect(tenants.find((tenant) => tenant.slug === 'salon-a')?.hasSession).toBe(true);
    expect(tenants.find((tenant) => tenant.slug === 'salon-b')?.hasSession).toBe(false);
  });

  it('records and reads the active tenant slug', () => {
    recordActiveTenant('Glow-Nails');
    expect(getActiveTenantSlug()).toBe('glow-nails');
  });

  it('canSwitchWithoutReLogin reflects stored token', () => {
    expect(canSwitchWithoutReLogin(slug)).toBe(false);
    setCustomerSession(slug, 'tok-1', {
      id: 'c1',
      name: 'Alex',
      email: 'a@test.com',
      phone: null,
    });
    expect(canSwitchWithoutReLogin(slug)).toBe(true);
  });

  it.each(REMEMBERED_TENANT_SCENARIOS)(
    'buildRememberedTenants $id',
    ({
      activeSlug,
      sessions,
      recent,
      storedLocales,
      expectedOrder,
      expectedActive,
    }) => {
      localStorage.clear();
      if (activeSlug) recordActiveTenant(activeSlug);
      for (const session of sessions) {
        setCustomerSession(session.slug, session.token, {
          id: session.slug,
          name: session.profileName,
          email: `${session.slug}@test.com`,
          phone: null,
        });
      }
      for (const salon of recent) rememberSalon(salon);
      for (const [tenantSlug, locale] of Object.entries(storedLocales)) {
        writeStoredConsumerLocale(tenantSlug, locale as 'en');
      }

      const tenants = buildRememberedTenants({
        activeSlug,
        now: new Date('2026-06-08T12:00:00.000Z'),
      });

      expect(tenants.map((tenant) => tenant.slug)).toEqual(expectedOrder);
      if (expectedActive) {
        expect(tenants.find((tenant) => tenant.isActive)?.slug).toBe(expectedActive);
      } else {
        expect(tenants.some((tenant) => tenant.isActive)).toBe(false);
      }
    },
  );

  it('includes stored locale labels and signed-in subtitles', () => {
    setCustomerSession('salon-a', 'tok-a', {
      id: 'c1',
      name: 'Alex',
      email: 'a@test.com',
      phone: null,
    });
    rememberSalon({
      slug: 'salon-a',
      name: 'Salon A',
      visitedAt: '2026-06-08T10:00:00.000Z',
      lastBookedAt: '2026-06-08T11:00:00.000Z',
    });
    writeStoredConsumerLocale('salon-a', 'hy');

    const [tenant] = buildRememberedTenants({
      now: new Date('2026-06-08T12:00:00.000Z'),
    });

    expect(tenant?.storedLocaleLabel).toBe('Հայերեն');
    expect(tenant?.subtitle).toContain('Signed in');
    expect(tenant?.subtitle).toContain('Booked today');
  });
});
