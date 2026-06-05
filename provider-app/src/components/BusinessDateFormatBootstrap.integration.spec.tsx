// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readAuthBusinessDateFormats } from '../lib/business-date-format';
import { useAuthStore } from '../services/auth-store';
import { BusinessDateFormatBootstrap } from './BusinessDateFormatBootstrap';

describe('Sprint 34 — fmt-1.8 BusinessDateFormatBootstrap integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com' },
      business: null,
      token: null,
      isAuthenticated: false,
      employee: null,
      businesses: [],
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('reads auth business formats after mount', () => {
    useAuthStore.setState({
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
    });
    act(() => {
      root.render(<BusinessDateFormatBootstrap />);
    });
    expect(readAuthBusinessDateFormats(useAuthStore.getState().business)).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
  });

  it('reacts when auth business dateFormat changes', () => {
    useAuthStore.setState({
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
    });
    act(() => {
      root.render(<BusinessDateFormatBootstrap />);
    });

    act(() => {
      useAuthStore.setState({
        business: {
          id: 'biz-1',
          name: 'Salon',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
        },
      });
      root.render(<BusinessDateFormatBootstrap />);
    });

    expect(readAuthBusinessDateFormats(useAuthStore.getState().business)).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });
  });
});
