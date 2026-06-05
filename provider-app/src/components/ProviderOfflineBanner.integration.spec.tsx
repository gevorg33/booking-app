import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderOfflineBanner } from './ProviderOfflineBanner';
import { PROVIDER_OFFLINE_QUEUE_CHANGED_EVENT } from '../lib/provider-api-offline.util';
import { enqueueMutation } from '../lib/offline-queue';

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

describe('ProviderOfflineBanner integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it('renders nothing when online with an empty queue', () => {
    act(() => root.render(<ProviderOfflineBanner />));
    expect(container.querySelector('.provider-offline-banner')).toBeNull();
  });

  it('shows offline status when navigator is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    act(() => root.render(<ProviderOfflineBanner />));
    expect(container.textContent).toContain('provider.offlineStatusOffline');
  });

  it('shows syncing status when mutations are queued', () => {
    enqueueMutation({ method: 'put', url: '/businesses/b1/provider/bookings/b1', data: {} });
    act(() => root.render(<ProviderOfflineBanner />));
    act(() => window.dispatchEvent(new CustomEvent(PROVIDER_OFFLINE_QUEUE_CHANGED_EVENT)));
    expect(container.textContent).toContain('provider.offlineStatusSyncing');
  });
});
