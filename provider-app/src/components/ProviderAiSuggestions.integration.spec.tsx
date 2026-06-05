import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProviderAiSuggestions from './ProviderAiSuggestions';
import { saveSuggestionsCache } from '../lib/provider-ai-suggestions-cache.util';

const apiState = vi.hoisted(() => ({
  online: true,
  getShouldFail: false,
}));

vi.mock('../lib/use-online-status', () => ({
  useOnlineStatus: () => apiState.online,
}));

const operationalState = vi.hoisted(() => ({
  handler: null as ((type: string) => void) | null,
}));

vi.mock('../lib/use-operational-events', () => ({
  useOperationalEvents: (_businessId: string, handler: (type: string) => void) => {
    operationalState.handler = handler;
  },
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(async () => {
      if (apiState.getShouldFail) throw { code: 'ERR_NETWORK' };
      return { data: { data: [{ id: 'live', priority: 'high', title: 'Live', prompt: 'live', category: 'pay' }] } };
    }),
  },
  unwrap: <T,>(data: unknown) => ((data as { data?: T })?.data ?? data) as T,
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProviderAiSuggestions integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  let selectedPrompt: string | null;

  beforeEach(() => {
    apiState.online = true;
    apiState.getShouldFail = false;
    selectedPrompt = null;
    localStorage.clear();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    saveSuggestionsCache('biz-1', [
      { id: 'cached', priority: 'medium', title: 'Cached paid', prompt: 'mark paid', category: 'pay' },
    ]);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  function mount() {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ProviderAiSuggestions
            businessId="biz-1"
            onSelectPrompt={(prompt) => {
              selectedPrompt = prompt;
            }}
          />
        </QueryClientProvider>,
      );
    });
  }

  it('renders cached suggestions while offline with stale banner', async () => {
    apiState.online = false;
    mount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Cached paid');
    expect(container.textContent).toContain('provider.offlineSuggestionsStale');
    act(() => container.querySelector('button')!.click());
    expect(selectedPrompt).toBe('mark paid');
  });

  it('returns null when offline without cached suggestions', () => {
    localStorage.clear();
    apiState.online = false;
    mount();
    expect(container.querySelector('.ai-suggestions-card')).toBeNull();
  });

  it('shows stale banner without refresh hint when online fetch fails', async () => {
    localStorage.clear();
    saveSuggestionsCache('biz-1', [
      { id: 'cached', priority: 'medium', title: 'Cached', prompt: 'cached', category: 'pay' },
    ]);
    apiState.online = true;
    apiState.getShouldFail = true;
    mount();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(container.textContent).toContain('provider.offlineSuggestionsStale');
    expect(container.textContent).not.toContain('provider.offlineRefreshWhenOnline');
  });

  it('invalidates suggestions after operational booking events', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    mount();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    act(() => operationalState.handler?.('booking.updated'));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['provider-ai-suggestions', 'biz-1'],
    });
    act(() => operationalState.handler?.('ai.clarify'));
    invalidateSpy.mockRestore();
  });

  it('shows spinner while waiting for first online fetch', () => {
    localStorage.clear();
    apiState.getShouldFail = false;
    mount();
    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });

  it('renders fresh suggestions when the query resolves online', async () => {
    localStorage.clear();
    queryClient.clear();
    mount();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(container.textContent).toContain('Live');
    expect(container.textContent).not.toContain('provider.offlineSuggestionsStale');
  });
});
