import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import { ConsumerBookingAssistant } from './ConsumerBookingAssistant.js';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}));

vi.mock('../services/public-api.js', () => ({
  fetchPublicServices: vi.fn(async () => []),
  fetchPublicProviders: vi.fn(async () => []),
  sendPublicAssistantMessage: vi.fn(async () => ({ data: { success: true, action: 'unknown', summary: '' } })),
}));

vi.mock('../lib/use-draggable-floating-position.js', () => ({
  useDraggableFloatingPosition: () => ({
    floatingRef: () => {},
    floatingStyle: {},
    bindDragHandle: (options?: { onPress?: () => void }) => ({
      onPointerDown: () => options?.onPress?.(),
      style: {},
    }),
    isDragging: false,
  }),
  useViewportSize: () => ({ width: 375, height: 812 }),
}));

vi.mock('../lib/offline-queue.js', () => ({
  loadQueue: () => [],
}));

vi.mock('../lib/recent-salons.js', () => ({
  loadRecentSalons: () => [],
}));

vi.mock('../lib/checkout-payment.util.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/checkout-payment.util.js')>(
    '../lib/checkout-payment.util.js',
  );
  return { ...actual, loadPendingCheckoutPayment: () => null };
});

const profile: PublicBusinessProfile = {
  id: 'biz-1',
  name: 'GevGas Salon',
  slug: 'gevgas-salon',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: { primaryColor: '#7c3aed' },
  publicBookingEnabled: true,
};

describe('ConsumerBookingAssistant FAB keyboard accessibility (e2e-bug.178)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  async function renderAssistant() {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/book/gevgas-salon']}>
            <ConsumerBookingAssistant
              slug="gevgas-salon"
              profile={profile}
              copy={CONSUMER_COPY_EN}
              locale="en"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
  }

  function getFab(): HTMLButtonElement {
    // ConsumerBodyPortal renders into document.body directly, not into `container`.
    const fab = document.body.querySelector('button.consumer-ai-fab');
    expect(fab).toBeTruthy();
    return fab as HTMLButtonElement;
  }

  function isPanelOpen(): boolean {
    // The close button (aria-label from copy.assistantClose) only exists once the panel is open.
    return Array.from(document.body.querySelectorAll('button')).some(
      (btn) => btn.getAttribute('aria-label') === CONSUMER_COPY_EN.assistantClose,
    );
  }

  it('renders the FAB as a real, focusable button with a correct aria-label', async () => {
    await renderAssistant();
    const fab = getFab();
    expect(fab.tagName).toBe('BUTTON');
    expect(fab.getAttribute('type')).toBe('button');
    expect(fab.getAttribute('aria-label')).toBe(CONSUMER_COPY_EN.assistantTitle);
    // A native <button> is keyboard-reachable by default; it must not be explicitly
    // pulled out of tab order (tabindex="-1" would break the very fix under test).
    expect(fab.getAttribute('tabindex')).not.toBe('-1');
    expect(isPanelOpen()).toBe(false);
  });

  it('opens the panel when Enter is pressed on the focused FAB', async () => {
    await renderAssistant();
    const fab = getFab();
    fab.focus();
    expect(document.activeElement).toBe(fab);

    await act(async () => {
      fab.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });

    expect(isPanelOpen()).toBe(true);
  });

  it('opens the panel when Space is pressed on the focused FAB, and prevents the page-scroll default', async () => {
    await renderAssistant();
    const fab = getFab();
    fab.focus();

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    await act(async () => {
      fab.dispatchEvent(event);
    });

    expect(isPanelOpen()).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not open the panel for an unrelated key (e.g. "a")', async () => {
    await renderAssistant();
    const fab = getFab();
    fab.focus();

    await act(async () => {
      fab.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }),
      );
    });

    expect(isPanelOpen()).toBe(false);
  });

  it('still opens on a real mouse/tap interaction (no regression from the keyboard fix)', async () => {
    await renderAssistant();
    const fab = getFab();

    await act(async () => {
      fab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });

    expect(isPanelOpen()).toBe(true);
  });

  it('closes the open panel on Escape (pre-existing behavior, confirmed still intact)', async () => {
    await renderAssistant();
    const fab = getFab();
    fab.focus();
    await act(async () => {
      fab.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    });
    expect(isPanelOpen()).toBe(true);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(isPanelOpen()).toBe(false);
  });
});
