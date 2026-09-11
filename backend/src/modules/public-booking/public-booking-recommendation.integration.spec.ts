import { ForbiddenException } from '@nestjs/common';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function createRecommendationPublicBookingHarness() {
  const business: Business = makeBusiness({
    id: 'biz-rec',
    name: 'Glow Salon',
    slug: 'glow-salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      publicBooking: {
        enabled: true,
        recommendations: { maxProductCount: 2 },
      },
    },
  });

  const productRecommendationService = {
    getCheckoutRecommendations: jest.fn(),
  };

  const publicBookingService = createPublicBookingServiceHarness({
    businessService: {
      findBySlug: jest.fn().mockResolvedValue(business),
    },
    productRecommendationService: productRecommendationService,
    configService: {
      get: jest.fn((key: string) =>
        key === 'PUBLIC_API_URL' ? 'https://app.test' : undefined,
      ),
    } as any,
  });

  return { publicBookingService, business, productRecommendationService };
}

describe('Public booking recommendation integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns checkout recommendations with resolved image URLs', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.productRecommendationService.getCheckoutRecommendations.mockResolvedValue(
      [
        {
          id: 'prod-1',
          name: 'Shampoo',
          imageUrl: '/uploads/shampoo.jpg',
          price: 25,
        },
      ],
    );

    const result =
      await harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        'svc-1',
        'cat-1',
      );

    expect(
      harness.productRecommendationService.getCheckoutRecommendations,
    ).toHaveBeenCalledWith(harness.business, 'svc-1', 'cat-1');
    expect(result.products[0]?.imageUrl).toBe(
      'https://app.test/uploads/shampoo.jpg',
    );
  });

  it('passes through absolute image URLs unchanged', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.productRecommendationService.getCheckoutRecommendations.mockResolvedValue(
      [
        {
          id: 'prod-2',
          name: 'Mask',
          imageUrl: 'https://cdn.example/mask.jpg',
        },
      ],
    );

    const result =
      await harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        'svc-2',
      );

    expect(result.products[0]?.imageUrl).toBe('https://cdn.example/mask.jpg');
  });

  it('omits imageUrl when recommendation product has no image', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.productRecommendationService.getCheckoutRecommendations.mockResolvedValue(
      [{ id: 'prod-3', name: 'Comb' }],
    );

    const result =
      await harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        'svc-3',
        'cat-3',
      );

    expect(result.products[0]).toEqual({ id: 'prod-3', name: 'Comb' });
  });

  it('returns empty products when recommendation service finds none', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.productRecommendationService.getCheckoutRecommendations.mockResolvedValue(
      [],
    );

    const result =
      await harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        'svc-1',
      );

    expect(result.products).toEqual([]);
  });

  it('supports category-only recommendation lookup', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.productRecommendationService.getCheckoutRecommendations.mockResolvedValue(
      [{ id: 'prod-4', name: 'Oil', price: 15 }],
    );

    const result =
      await harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        undefined,
        'cat-spa',
      );

    expect(
      harness.productRecommendationService.getCheckoutRecommendations,
    ).toHaveBeenCalledWith(harness.business, undefined, 'cat-spa');
    expect(result.products[0]?.name).toBe('Oil');
  });

  it('rejects disabled public booking like standard flow', async () => {
    const harness = createRecommendationPublicBookingHarness();
    harness.business.settings = {
      ...harness.business.settings,
      publicBooking: { enabled: false },
    };

    await expect(
      harness.publicBookingService.getCheckoutRecommendations(
        'glow-salon',
        'svc-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
