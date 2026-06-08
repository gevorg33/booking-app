import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsumerPushBridge } from './ConsumerPushBridge.js';
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

function LocationSpy({ paths }: { paths: string[] }) {
  const location = useLocation();
  paths.push(`${location.pathname}${location.search}`);
  return null;
}

describe('ConsumerPushBridge integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    capacitorState.isNative = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mountBridge(paths: string[]) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <ConsumerPushBridge />
          <Route path="*" render={() => <LocationSpy paths={paths} />} />
        </MemoryRouter>,
      );
    });
  }

  it('handles native cold-start and appUrlOpen deep links', async () => {
    capacitorState.isNative = true;
    const remove = vi.fn();
    const paths: string[] = [];

    vi.mocked(CapacitorApp.getLaunchUrl).mockResolvedValueOnce({
      url: 'optischedule://book/glow-nails/manage?bookingId=cold-1&token=tok-1',
    });
    vi.mocked(CapacitorApp.addListener).mockResolvedValue({ remove });

    mountBridge(paths);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(paths).toContain('/s/glow-nails/manage?bookingId=cold-1&token=tok-1');

    const listener = vi.mocked(CapacitorApp.addListener).mock.calls[0]?.[1] as
      | ((event: { url?: string }) => void)
      | undefined;
    act(() => listener?.({ url: 'optischedule://book/glow-nails/results' }));
    expect(paths).toContain('/s/glow-nails/results');
    act(() => listener?.({}));
    await act(async () => {
      root.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(remove).toHaveBeenCalled();
  });
});
