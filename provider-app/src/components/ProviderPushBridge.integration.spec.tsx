import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderPushBridge } from './ProviderPushBridge';
import { PROVIDER_OPEN_BOOKING_EVENT, PROVIDER_PUSH_NAVIGATE_EVENT } from '../lib/provider-push-deep-link.util';
import { App as CapacitorApp } from '@capacitor/app';

const capacitorState = vi.hoisted(() => ({ isNative: false }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => capacitorState.isNative },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    getLaunchUrl: vi.fn(async () => ({ url: null })),
    addListener: vi.fn(async () => ({ remove: vi.fn() })),
  },
}));

describe('ProviderPushBridge integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let openedBooking: string | null;
  let historyPush: string | null;

  beforeEach(() => {
    openedBooking = null;
    historyPush = null;
    capacitorState.isNative = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mountBridge() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/tabs/today']}>
          <Route path="/tabs/today">
            <ProviderPushBridge onOpenBooking={(id) => { openedBooking = id; }} />
            <div data-testid="outlet" />
          </Route>
        </MemoryRouter>,
      );
    });
  }

  it('navigates on push navigate event and ignores empty paths', () => {
    mountBridge();
    act(() => {
      window.dispatchEvent(new CustomEvent(PROVIDER_PUSH_NAVIGATE_EVENT, { detail: {} }));
      window.dispatchEvent(
        new CustomEvent(PROVIDER_PUSH_NAVIGATE_EVENT, {
          detail: { path: '/tabs/today?bookingId=b1' },
        }),
      );
    });
    expect(container.querySelector('[data-testid="outlet"]')).toBeTruthy();
  });

  it('opens booking from push open-booking event', () => {
    mountBridge();
    act(() => {
      window.dispatchEvent(new CustomEvent(PROVIDER_OPEN_BOOKING_EVENT, { detail: {} }));
      window.dispatchEvent(
        new CustomEvent(PROVIDER_OPEN_BOOKING_EVENT, { detail: { bookingId: 'b9' } }),
      );
    });
    expect(openedBooking).toBe('b9');
  });

  it('handles native cold-start and appUrlOpen deep links', async () => {
    capacitorState.isNative = true;
    const remove = vi.fn();
    const navigated: string[] = [];
    const onNavigate = (e: Event) => {
      navigated.push((e as CustomEvent<{ path?: string }>).detail?.path ?? '');
    };
    window.addEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);

    vi.mocked(CapacitorApp.getLaunchUrl).mockResolvedValueOnce({
      url: 'https://app.local/provider/today?bookingId=cold-1',
    });
    vi.mocked(CapacitorApp.addListener).mockResolvedValue({ remove });

    mountBridge();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(navigated).toContain('/tabs/today?bookingId=cold-1');

    const listener = vi.mocked(CapacitorApp.addListener).mock.calls[0]?.[1] as
      | ((event: { url?: string }) => void)
      | undefined;
    act(() => listener?.({ url: 'https://app.local/provider/schedule' }));
    expect(navigated).toContain('/tabs/schedule');
    act(() => listener?.({}));
    await act(async () => {
      root.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(remove).toHaveBeenCalled();
    window.removeEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);
  });
});
