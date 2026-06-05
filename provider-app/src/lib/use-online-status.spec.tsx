import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useOnlineStatus } from './use-online-status';

function OnlineHarness() {
  const online = useOnlineStatus();
  return <span data-testid="online">{String(online)}</span>;
}

describe('useOnlineStatus', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('defaults to online when navigator is unavailable', () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error test SSR guard
    delete globalThis.navigator;
    act(() => root.render(<OnlineHarness />));
    expect(container.querySelector('[data-testid="online"]')?.textContent).toBe('true');
    globalThis.navigator = originalNavigator;
  });

  it('tracks browser online/offline events', () => {
    act(() => root.render(<OnlineHarness />));
    expect(container.querySelector('[data-testid="online"]')?.textContent).toBe('true');
    act(() => window.dispatchEvent(new Event('offline')));
    expect(container.querySelector('[data-testid="online"]')?.textContent).toBe('false');
    act(() => window.dispatchEvent(new Event('online')));
    expect(container.querySelector('[data-testid="online"]')?.textContent).toBe('true');
  });
});
