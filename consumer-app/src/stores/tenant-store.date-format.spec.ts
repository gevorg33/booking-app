import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getActiveBusinessDateFormats } from '../lib/business-date-format.js';
import { useTenantStore } from './tenant-store.js';

vi.mock('../lib/branding.js', () => ({
  applyBrandingCss: vi.fn(),
}));

vi.mock('../lib/recent-salons.js', () => ({
  rememberSalon: vi.fn(),
}));

describe('Sprint 34 — consumer tenant store date format bootstrap', () => {
  beforeEach(() => {
    useTenantStore.setState({ profile: null });
  });

  it('sets active business formats when tenant profile loads', () => {
    useTenantStore.getState().setProfile({
      id: 'biz-1',
      name: 'Salon',
      slug: 'salon',
      timezone: 'UTC',
      locale: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      branding: { primaryColor: '#000' },
      currency: 'USD',
      publicBookingEnabled: true,
    });

    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
  });

  it('does not change active formats when profile is cleared', () => {
    useTenantStore.getState().setProfile({
      id: 'biz-1',
      name: 'Salon',
      slug: 'salon',
      timezone: 'UTC',
      locale: 'en',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      branding: {},
      currency: 'EUR',
      publicBookingEnabled: true,
    });
    useTenantStore.getState().setProfile(null);
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });
  });
});
