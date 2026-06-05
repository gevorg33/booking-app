import { beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapAuthBusinessDateFormats,
  getActiveBusinessDateFormats,
  setActiveBusinessDateFormats,
} from './business-date-format';
import { formatDateDisplay } from './date-format';
import { useAuthStore } from './store';

describe('auth store — fmt-1.6 business date formats', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
    useAuthStore.setState({
      user: { id: 'u1', email: 'owner@test.com' },
      business: {
        id: 'biz-1',
        name: 'Glow Salon',
        slug: 'glow-salon',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
      employee: null,
      businesses: [
        {
          id: 'biz-1',
          name: 'Glow Salon',
          slug: 'glow-salon',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          membershipRole: 'owner',
          employee: null,
        },
        {
          id: 'biz-2',
          name: 'Nails Co',
          slug: 'nails-co',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '12h',
          membershipRole: 'admin',
          employee: null,
        },
      ],
      token: 'token',
      isAuthenticated: true,
    });
  });

  it('updates active business formats after settings save', () => {
    useAuthStore.getState().updateBusinessFormats('MM/DD/YYYY', '12h');

    expect(useAuthStore.getState().business).toMatchObject({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(useAuthStore.getState().businesses[0]).toMatchObject({
      id: 'biz-1',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(useAuthStore.getState().businesses[1]).toMatchObject({
      id: 'biz-2',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12h',
    });
  });

  it('simulates settings save syncing auth store and format cache', () => {
    const { updateBusinessFormats } = useAuthStore.getState();
    updateBusinessFormats('MM/DD/YYYY', '12h');
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });

    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('06/04/2026');
  });

  it('no-ops when business is null', () => {
    useAuthStore.setState({ business: null, businesses: [] });
    useAuthStore.getState().updateBusinessFormats('MM/DD/YYYY', '12h');
    expect(useAuthStore.getState().business).toBeNull();
  });
});
