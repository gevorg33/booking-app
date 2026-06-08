import { describe, expect, it, beforeEach } from 'vitest';
import { loadCachedTenantSnapshot, saveCachedTenantSnapshot } from './cached-tenant-data.util.js';

describe('cached-tenant-data.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads tenant snapshots per slug', () => {
    saveCachedTenantSnapshot({
      slug: 'Demo-Salon',
      profile: {
        id: '1',
        name: 'Demo',
        slug: 'demo-salon',
        timezone: 'UTC',
        locale: 'en',
        currency: 'USD',
        branding: {},
        publicBookingEnabled: true,
      },
      services: [{ id: 's1', name: 'Cut', durationMinutes: 30, price: 20 }],
    });
    const loaded = loadCachedTenantSnapshot('demo-salon');
    expect(loaded?.profile.name).toBe('Demo');
    expect(loaded?.services).toHaveLength(1);
  });
});
