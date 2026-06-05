import { EventType } from '../../events/event-types.js';
import { ProductRecommendationService } from './product-recommendation.service.js';

describe('ProductRecommendationService analytics integration', () => {
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { recommendations: { maxProductCount: 5 } } },
  } as any;

  const products = [
    {
      id: 'prod-1',
      businessId: 'biz-1',
      name: 'Shampoo',
      retailPrice: 25,
      isActive: true,
    },
  ];

  const serviceLinkRepo = {
    find: jest.fn().mockResolvedValue([{ productId: 'prod-1', sortOrder: 0 }]),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const categoryLinkRepo = {
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const productRepo = {
    find: jest.fn().mockResolvedValue(products),
    count: jest.fn(),
  };
  const serviceRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      categoryId: 'cat-1',
      isActive: true,
    }),
  };
  const categoryRepo = { findOne: jest.fn() };
  const eventStore = { publish: jest.fn().mockResolvedValue({}) };

  const service = new ProductRecommendationService(
    productRepo as any,
    serviceLinkRepo as any,
    categoryLinkRepo as any,
    serviceRepo as any,
    categoryRepo as any,
    eventStore as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records product_recommendation.shown with checkout context', async () => {
    const result = await service.recordRecommendationEvent(business, {
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-1',
      surface: 'web_checkout',
    });

    expect(result).toEqual({ recorded: true });
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        aggregateType: 'product_recommendation',
        aggregateId: 'prod-1',
        businessId: 'biz-1',
        payload: {
          productId: 'prod-1',
          serviceId: 'svc-1',
          categoryId: 'cat-1',
          bookingId: 'bk-1',
          surface: 'web_checkout',
        },
      }),
    );
  });

  it('records product_recommendation.clicked for consumer app surface', async () => {
    await service.recordRecommendationEvent(business, {
      event: 'clicked',
      productId: 'prod-1',
      serviceId: 'svc-1',
      surface: 'consumer_app',
    });

    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
        payload: expect.objectContaining({ surface: 'consumer_app' }),
      }),
    );
  });

  it('rejects unknown events and products outside checkout recommendations', async () => {
    expect(
      await service.recordRecommendationEvent(business, {
        event: 'dismissed',
        productId: 'prod-1',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });
    expect(eventStore.publish).not.toHaveBeenCalled();

    expect(
      await service.recordRecommendationEvent(business, {
        event: 'shown',
        productId: 'prod-9',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });
    expect(eventStore.publish).not.toHaveBeenCalled();
  });

  it('requires serviceId or categoryId context', async () => {
    expect(
      await service.recordRecommendationEvent(business, {
        event: 'shown',
        productId: 'prod-1',
      }),
    ).toEqual({ recorded: false });
  });
});
