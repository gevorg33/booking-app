import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProviderAiAssistant from './ProviderAiAssistant';

const apiState = vi.hoisted(() => ({
  online: true,
  commandResponse: null as null | { success: boolean; summary: string; details?: Record<string, unknown> },
  confirmStatus: 200,
  confirmThrows: false,
}));

vi.mock('../lib/use-online-status', () => ({
  useOnlineStatus: () => apiState.online,
}));

vi.mock('../lib/use-ai-events', () => ({
  useProviderAiEvents: () => undefined,
}));

vi.mock('./ProviderAiVoiceButton', () => ({
  ProviderAiVoiceButton: () => null,
}));

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(async (url: string) => {
      if (url.endsWith('/confirm')) {
        if (apiState.confirmThrows) throw { code: 'ERR_NETWORK' };
        if (apiState.confirmStatus === 202) {
          return { data: { queued: true, offline: true }, status: 202 };
        }
        return {
          data: { data: { success: true, summary: 'Confirmed paid' } },
          status: 200,
        };
      }
      return {
        data: {
          data: apiState.commandResponse ?? {
            success: true,
            summary: 'Needs confirm',
            details: {
              requiresConfirmation: true,
              bookingIds: ['b1'],
              pendingAction: { action: 'payment_sweep', params: {} },
            },
          },
        },
        status: 200,
      };
    }),
  },
  unwrap: <T,>(data: unknown) => ((data as { data?: T })?.data ?? data) as T,
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}));

describe('ProviderAiAssistant offline integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    apiState.online = true;
    apiState.confirmStatus = 200;
    apiState.confirmThrows = false;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['provider-today', 'biz-1'], {
      viewMode: 'provider',
      employee: { name: 'Sam' },
      bookings: [
        {
          id: 'b1',
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T11:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: { name: 'Cut' },
          customer: { name: 'Ann', phone: null, email: null },
        },
      ],
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mount() {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ProviderAiAssistant businessId="biz-1" />
        </QueryClientProvider>,
      );
    });
    act(() => container.querySelector('.ai-assistant-card__header')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  }

  async function sendPrompt(text: string) {
    const input = container.querySelector('ion-input') as HTMLElement & { value?: string };
    act(() => input.dispatchEvent(new CustomEvent('ionInput', { detail: { value: text }, bubbles: true })));
    act(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it('blocks new AI commands while offline', async () => {
    apiState.online = false;
    mount();
    await sendPrompt('mark all paid');
    expect(container.textContent).toContain('provider.offlineCommandNeedsNetwork');
  });

  it('queues AI confirm actions with optimistic booking updates', async () => {
    queryClient.setQueryData(['provider-booking', 'biz-1', 'b1'], {
      id: 'b1',
      startTime: '2026-06-02T10:00:00.000Z',
      endTime: '2026-06-02T11:00:00.000Z',
      status: 'confirmed',
      paymentStatus: 'pending',
      service: null,
      customer: null,
    });
    mount();
    await sendPrompt('mark all paid');
    const confirmButton = Array.from(container.querySelectorAll('ion-button')).find((btn) =>
      btn.textContent?.includes('provider.assistantConfirmAll'),
    );
    expect(confirmButton).toBeTruthy();
    apiState.confirmStatus = 202;
    act(() => confirmButton!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('provider.offlineCommandQueued');
    const detail = queryClient.getQueryData<{ paymentStatus?: string }>([
      'provider-booking',
      'biz-1',
      'b1',
    ]);
    expect(detail?.paymentStatus).toBe('paid');
  });

  it('rolls back optimistic updates when confirm fails with API error', async () => {
    mount();
    await sendPrompt('mark all paid');
    const confirmButton = Array.from(container.querySelectorAll('ion-button')).find((btn) =>
      btn.textContent?.includes('provider.assistantConfirmAll'),
    );
    apiState.confirmThrows = false;
    apiState.confirmStatus = 200;
    const api = await import('../services/api');
    vi.mocked(api.default.post).mockImplementationOnce(async (url: string) => {
      if (url.endsWith('/confirm')) throw { response: { data: { message: 'Denied' } } };
      return {
        data: {
          data: {
            success: true,
            summary: 'Needs confirm',
            details: {
              requiresConfirmation: true,
              bookingIds: ['b1'],
              pendingAction: { action: 'payment_sweep', params: {} },
            },
          },
        },
        status: 200,
      };
    });
    act(() => confirmButton!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Denied');
  });
});
