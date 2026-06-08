import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import { ConsumerRewardsCard } from './ConsumerRewardsCard.js';

vi.mock('../services/public-api.js', () => ({
  fetchPublicPromotions: vi.fn(),
  fetchMyRewards: vi.fn(),
}));

import { fetchMyRewards, fetchPublicPromotions } from '../services/public-api.js';

const mockedPromotions = vi.mocked(fetchPublicPromotions);
const mockedRewards = vi.mocked(fetchMyRewards);

const profile = {
  id: 'biz-1',
  name: 'Demo Salon',
  slug: 'demo-salon',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: {},
  publicBookingEnabled: true,
};

describe('ConsumerRewardsCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderCard(authed: boolean) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <ConsumerRewardsCard
            slug="demo-salon"
            profile={profile}
            copy={CONSUMER_COPY_EN}
            authed={authed}
          />
        </QueryClientProvider>,
      );
    });
  }

  it('shows active promotions for guests', async () => {
    mockedPromotions.mockResolvedValue({
      promotions: [
        {
          code: 'SAVE10',
          description: 'Welcome back',
          discountLabel: '10% off',
          expiresAt: null,
          minOrderAmount: null,
        },
      ],
    });

    renderCard(false);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Rewards & offers');
    expect(container.textContent).toContain('10% off');
    expect(container.textContent).toContain('SAVE10');
  });

  it('shows loyalty balance for signed-in customers', async () => {
    mockedRewards.mockResolvedValue({
      loyaltyEnabled: true,
      loyalty: {
        pointsBalance: 12,
        lifetimeEarned: 20,
        pointsValue: 12,
        earnPercentCashback: 10,
        bonusDollarValue: 1,
      },
      promotions: [],
    });

    renderCard(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Your rewards balance');
    expect(container.textContent).toContain('$12.00 available');
  });
});
