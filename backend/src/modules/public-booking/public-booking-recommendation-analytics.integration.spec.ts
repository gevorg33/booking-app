import { ForbiddenException } from '@nestjs/common';
import { EventType } from '../../events/event-types.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function createAnalyticsHarness() {
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
    recordRecommendationEvent: jest.fn(),
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

describe('Public booking recommendation analytics integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records shown events through public booking service', async () => {
    const harness = createAnalyticsHarness();
    harness.productRecommendationService.recordRecommendationEvent.mockResolvedValue(
      {
        recorded: true,
      },
    );

    const result =
      await harness.publicBookingService.recordCheckoutRecommendationEvent(
        'glow-salon',
        {
          event: 'shown',
          productId: 'prod-1',
          serviceId: 'svc-1',
          categoryId: 'cat-1',
          bookingId: 'bk-1',
          surface: 'web_checkout',
        },
      );

    expect(result).toEqual({ recorded: true });
    expect(
      harness.productRecommendationService.recordRecommendationEvent,
    ).toHaveBeenCalledWith(harness.business, {
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-1',
      surface: 'web_checkout',
    });
    expect(EventType.PRODUCT_RECOMMENDATION_SHOWN).toBe(
      'product_recommendation.shown',
    );
  });

  it('records clicked events for consumer app surface', async () => {
    const harness = createAnalyticsHarness();
    harness.productRecommendationService.recordRecommendationEvent.mockResolvedValue(
      {
        recorded: true,
      },
    );

    await harness.publicBookingService.recordCheckoutRecommendationEvent(
      'glow-salon',
      {
        event: 'clicked',
        productId: 'prod-2',
        serviceId: 'svc-2',
        surface: 'consumer_app',
      },
    );

    expect(
      harness.productRecommendationService.recordRecommendationEvent,
    ).toHaveBeenCalledWith(
      harness.business,
      expect.objectContaining({
        event: 'clicked',
        surface: 'consumer_app',
      }),
    );
  });

  it('passes through recorded:false when product is not in recommendations', async () => {
    const harness = createAnalyticsHarness();
    harness.productRecommendationService.recordRecommendationEvent.mockResolvedValue(
      {
        recorded: false,
      },
    );

    const result =
      await harness.publicBookingService.recordCheckoutRecommendationEvent(
        'glow-salon',
        {
          event: 'shown',
          productId: 'prod-unknown',
          serviceId: 'svc-1',
        },
      );

    expect(result).toEqual({ recorded: false });
  });

  it('rejects analytics when public booking is disabled', async () => {
    const harness = createAnalyticsHarness();
    harness.business.settings = {
      ...harness.business.settings,
      publicBooking: { enabled: false },
    };

    await expect(
      harness.publicBookingService.recordCheckoutRecommendationEvent(
        'glow-salon',
        {
          event: 'shown',
          productId: 'prod-1',
          serviceId: 'svc-1',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
