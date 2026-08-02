/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicCustomerSubscription } from '../lib/types.js';
import * as publicApi from '../services/public-api.js';
import { ConsumerSubscriptionsSection } from './ConsumerSubscriptionsSection.js';

const unusedSub: PublicCustomerSubscription = {
  id: 'sub-1',
  status: 'active',
  appointmentsRemaining: 4,
  appointmentsIncluded: 4,
  expiresAt: '2027-01-01T00:00:00.000Z',
  plan: { name: 'Monthly Massage Plan', service: { id: 'svc-1', name: 'Massage' } },
};

describe('ConsumerSubscriptionsSection cancel refund notice (e2e-bug.187)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function clickCancel() {
    await act(async () => {
      root.render(
        <ConsumerSubscriptionsSection
          slug="demo"
          subscriptions={[unusedSub]}
          primary="#000"
          copy={CONSUMER_COPY_EN}
          locale="en"
        />,
      );
    });
    const cancelBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.subscriptionsCancel));
    expect(cancelBtn).toBeTruthy();
    await act(async () => {
      cancelBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }

  it('shows the refunded notice when refundStatus is refunded', async () => {
    vi.spyOn(publicApi, 'cancelCustomerSubscription').mockResolvedValue({
      subscription: { ...unusedSub, status: 'cancelled' },
      refundStatus: 'refunded',
    });
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.subscriptionsCancelRefunded);
  });

  it('shows the refund-failed notice when refundStatus is failed', async () => {
    vi.spyOn(publicApi, 'cancelCustomerSubscription').mockResolvedValue({
      subscription: { ...unusedSub, status: 'cancelled' },
      refundStatus: 'failed',
    });
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.subscriptionsCancelRefundFailed);
  });

  it('shows the ineligible notice when refundStatus is ineligible (usage ledger has a CONSUME entry, even if later restored)', async () => {
    vi.spyOn(publicApi, 'cancelCustomerSubscription').mockResolvedValue({
      subscription: { ...unusedSub, status: 'cancelled' },
      refundStatus: 'ineligible',
    });
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.subscriptionsCancelIneligible);
  });

  it('shows no refund notice when refundStatus is absent (e.g. cash / no online payment)', async () => {
    vi.spyOn(publicApi, 'cancelCustomerSubscription').mockResolvedValue({
      subscription: { ...unusedSub, status: 'cancelled' },
    });
    await clickCancel();
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.subscriptionsCancelRefunded);
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.subscriptionsCancelRefundFailed);
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.subscriptionsCancelIneligible);
  });
});

describe('ConsumerSubscriptionsSection native CTAs (e2e-bug.314)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  function findByText(text: string) {
    return Array.from(container.querySelectorAll('button.consumer-action-button')).find((el) =>
      (el.textContent ?? '').includes(text),
    );
  }

  it('renders Book next / Usage history / Cancel as native button.consumer-action-button, no ion-button hosts', async () => {
    await act(async () => {
      root.render(
        <ConsumerSubscriptionsSection
          slug="demo"
          subscriptions={[unusedSub]}
          primary="#000"
          copy={CONSUMER_COPY_EN}
          locale="en"
        />,
      );
    });

    expect(container.querySelectorAll('ion-button')).toHaveLength(0);
    expect(findByText(CONSUMER_COPY_EN.subscriptionsBookNext)).toBeTruthy();
    expect(findByText(CONSUMER_COPY_EN.subscriptionsUsageHistory)).toBeTruthy();
    expect(findByText(CONSUMER_COPY_EN.subscriptionsCancel)).toBeTruthy();
  });

  it('sets aria-expanded on the usage-history toggle and flips it on click', async () => {
    vi.spyOn(publicApi, 'fetchMySubscriptionUsage').mockResolvedValue({
      subscription: unusedSub,
      usage: [],
    });
    await act(async () => {
      root.render(
        <ConsumerSubscriptionsSection
          slug="demo"
          subscriptions={[unusedSub]}
          primary="#000"
          copy={CONSUMER_COPY_EN}
          locale="en"
        />,
      );
    });
    const toggleBtn = findByText(CONSUMER_COPY_EN.subscriptionsUsageHistory);
    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
    await act(async () => {
      toggleBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(findByText(CONSUMER_COPY_EN.subscriptionsUsageHistory)?.getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('does not render a Cancel CTA once a subscription has usage (isUnused false)', async () => {
    const usedSub: PublicCustomerSubscription = {
      ...unusedSub,
      id: 'sub-2',
      appointmentsRemaining: 2,
    };
    await act(async () => {
      root.render(
        <ConsumerSubscriptionsSection
          slug="demo"
          subscriptions={[usedSub]}
          primary="#000"
          copy={CONSUMER_COPY_EN}
          locale="en"
        />,
      );
    });
    expect(findByText(CONSUMER_COPY_EN.subscriptionsCancel)).toBeUndefined();
  });
});
