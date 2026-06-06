import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDateDisplay, formatTimeDisplay } from './date-format';
import { useAuthStore } from '../services/auth-store';

describe('Sprint 34 — fmt-1.8 provider auth business date formats', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com' },
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
      token: 'token',
      isAuthenticated: true,
      employee: null,
      businesses: [],
    });
  });

  it('setAuth persists dateFormat and timeFormat on business summary', () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', email: 'p@test.com' },
      {
        id: 'biz-2',
        name: 'Clinic',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      },
      'token-2',
    );
    expect(useAuthStore.getState().business).toEqual({
      id: 'biz-2',
      name: 'Clinic',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });
    expect(formatDateDisplay('2026-06-04')).toBe('2026-06-04');
    expect(formatTimeDisplay('2026-06-04T15:00:00.000Z')).toMatch(/15:00/);
  });
});
