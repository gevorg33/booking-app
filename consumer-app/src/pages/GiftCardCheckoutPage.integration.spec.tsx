import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GiftCardCheckoutPage from './GiftCardCheckoutPage.js';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicBusinessProfile } from '../lib/types.js';

vi.mock('../components/ConsumerAiShell.js', () => ({
  ConsumerAiShell: ({ children }: { children?: unknown }) => children ?? null,
}));

const quotePublicGiftCardPurchase = vi.fn(async () => ({
  label: '$50 Gift Card',
  subtotal: 50,
  shippingFee: 0,
  total: 50,
  currency: 'USD',
}));

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(() => 'token'),
  // Simulate localStorage JSON.parse — new object reference every call (e2e-bug.6).
  getStoredCustomerProfile: vi.fn(() => ({
    name: 'Test Customer',
    email: 'test-cancel-sub@example.com',
    phone: '+15551234567',
  })),
}));

const getPublicGiftCardCatalog = vi.fn(async () => ({
  purchaseEnabled: true,
  settings: {
    presetAmounts: [50],
    bundles: [],
    purchasablePackages: [{ packageId: 'pkg-1' }],
    purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
    shippingMethods: [
      { id: 'standard', label: 'Standard', fee: 5, estimatedDays: '3-5 days' },
      { id: 'express', label: 'Express', fee: 12, estimatedDays: '1-2 days' },
    ],
    digitalDeliveryEnabled: true,
    physicalDeliveryEnabled: false,
    acceptCashPayments: false,
  },
}));

const purchasePublicGiftCard = vi.fn(async () => ({ ok: true }));

vi.mock('../services/public-api.js', () => ({
  getPublicGiftCardCatalog: (...args: unknown[]) => getPublicGiftCardCatalog(...args),
  quotePublicGiftCardPurchase: (...args: unknown[]) =>
    quotePublicGiftCardPurchase(...args),
  confirmPublicBookingPayment: vi.fn(),
  createPublicGiftCardCheckout: vi.fn(),
  purchasePublicGiftCard: (...args: unknown[]) => purchasePublicGiftCard(...args),
}));

const salonProfile = {
  id: 'biz-1',
  name: 'Demo Salon',
  slug: 'gevgas-operations-7c299253',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: { primaryColor: '#336699' },
  publicBookingEnabled: true,
  businessType: 'salon',
} as PublicBusinessProfile;

vi.mock('../hooks/use-tenant-bootstrap.js', () => ({
  useTenantBootstrap: () => ({
    slug: 'gevgas-operations-7c299253',
    profile: salonProfile,
    loading: false,
    error: '',
  }),
}));

vi.mock('../hooks/use-consumer-copy.js', async () => {
  const { CONSUMER_COPY_EN } = await import('../lib/consumer-copy-catalog.js');
  return {
    useConsumerCopy: () => ({
      locale: 'en',
      copy: CONSUMER_COPY_EN,
    }),
  };
});

function renderCheckout(search = '?cardType=monetary&amount=50') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[`/s/gevgas-operations-7c299253/gift-cards/checkout${search}`]}
      >
        <Route path="/s/:slug/gift-cards/checkout">
          <GiftCardCheckoutPage />
        </Route>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('GiftCardCheckoutPage integration (e2e-bug.6 / e2e-bug.37)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    quotePublicGiftCardPurchase.mockClear();
    getPublicGiftCardCatalog.mockClear();
    getPublicGiftCardCatalog.mockResolvedValue({
      purchaseEnabled: true,
      settings: {
        presetAmounts: [50],
        bundles: [],
        purchasablePackages: [{ packageId: 'pkg-1' }],
        purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
        shippingMethods: [
          { id: 'standard', label: 'Standard', fee: 5, estimatedDays: '3-5 days' },
          { id: 'express', label: 'Express', fee: 12, estimatedDays: '1-2 days' },
        ],
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: false,
        acceptCashPayments: false,
      },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each([
    {
      id: 'e2e-bug.37-monetary',
      search: '?cardType=monetary&amount=50',
    },
    {
      id: 'e2e-bug.37-package',
      search: '?cardType=package&packageId=pkg-1',
    },
    {
      id: 'e2e-bug.37-subscription',
      search: '?cardType=subscription&subscriptionPlanId=plan-1',
    },
  ])(
    '$id: does not storm quotePublicGiftCardPurchase on mount for signed-in customer',
    async ({ search }) => {
      act(() => {
        root.render(renderCheckout(search));
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
      });

      // One quote after catalog+prefill settle — never dozens (pre-fix storm).
      expect(quotePublicGiftCardPurchase.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(quotePublicGiftCardPurchase.mock.calls.length).toBeLessThanOrEqual(2);
      expect(container.textContent).toContain(CONSUMER_COPY_EN.giftCardYourDetails);
      expect(container.textContent).toContain(CONSUMER_COPY_EN.giftCardPayNow);
    },
  );

  it('shows shipping method + address form when physical delivery is enabled', async () => {
    getPublicGiftCardCatalog.mockResolvedValue({
      purchaseEnabled: true,
      settings: {
        presetAmounts: [50],
        bundles: [],
        purchasablePackages: [],
        purchasableSubscriptionPlans: [],
        shippingMethods: [
          { id: 'standard', label: 'Standard', fee: 5, estimatedDays: '3-5 days' },
          { id: 'express', label: 'Express', fee: 12, estimatedDays: '1-2 days' },
        ],
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: true,
        acceptCashPayments: false,
      },
    });

    act(() => {
      root.render(renderCheckout());
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    const physicalBtn = Array.from(container.querySelectorAll('ion-button')).find((el) =>
      (el.textContent ?? '').includes(CONSUMER_COPY_EN.giftCardDeliveryPhysical),
    );
    expect(physicalBtn).toBeTruthy();
    await act(async () => {
      physicalBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    // IonLabel stacked text is not always in textContent; assert shipping options + address inputs.
    expect(container.textContent).toContain('Standard');
    expect(container.textContent).toContain('Express');
    expect(container.querySelector('ion-select')).toBeTruthy();
    expect(container.querySelectorAll('ion-input').length).toBeGreaterThanOrEqual(5);
  });

  it('shows cash payment option and confirms cash purchase when acceptCashPayments', async () => {
    getPublicGiftCardCatalog.mockResolvedValue({
      purchaseEnabled: true,
      settings: {
        presetAmounts: [50],
        bundles: [],
        purchasablePackages: [],
        purchasableSubscriptionPlans: [],
        shippingMethods: [],
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: false,
        acceptCashPayments: true,
      },
    });
    purchasePublicGiftCard.mockClear();

    act(() => {
      root.render(renderCheckout());
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(container.textContent).toContain(CONSUMER_COPY_EN.giftCardPaymentMethod);
    expect(container.textContent).toContain(CONSUMER_COPY_EN.giftCardPayCashShort);

    const cashBtn = Array.from(container.querySelectorAll('ion-button')).find((el) =>
      (el.textContent ?? '').trim() === CONSUMER_COPY_EN.giftCardPayCashShort,
    );
    expect(cashBtn).toBeTruthy();
    await act(async () => {
      cashBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });

    // Consent checkbox required before purchase.
    const checkbox = container.querySelector('ion-checkbox');
    expect(checkbox).toBeTruthy();
    await act(async () => {
      checkbox!.dispatchEvent(
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }),
      );
    });

    const confirmBtn = Array.from(container.querySelectorAll('ion-button')).find((el) =>
      (el.textContent ?? '').includes(CONSUMER_COPY_EN.giftCardConfirmCashPurchase),
    );
    expect(confirmBtn).toBeTruthy();
    await act(async () => {
      confirmBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    expect(purchasePublicGiftCard).toHaveBeenCalledWith(
      'gevgas-operations-7c299253',
      expect.objectContaining({ paymentMethod: 'cash' }),
    );
  });
});
