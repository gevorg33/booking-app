import { EventType } from '../../events/event-types.js';
import { ProductRecommendationService } from './product-recommendation.service.js';

describe('Sprint 32 — rec-1.8 recommendation analytics scenario matrix', () => {
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
    {
      id: 'prod-2',
      businessId: 'biz-1',
      name: 'Mask',
      retailPrice: 40,
      isActive: true,
    },
  ];

  const serviceLinkRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const categoryLinkRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const productRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const serviceRepo = {
    findOne: jest.fn(),
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
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      categoryId: 'cat-1',
      isActive: true,
    });
    serviceLinkRepo.find.mockResolvedValue([
      { productId: 'prod-1', sortOrder: 0 },
      { productId: 'prod-2', sortOrder: 1 },
    ]);
    categoryLinkRepo.find.mockResolvedValue([]);
    productRepo.find.mockResolvedValue(products);
  });

  it('records web checkout shown with booking attribution', async () => {
    const result = await service.recordRecommendationEvent(business, {
      event: 'shown',
      productId: ' prod-1 ',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-42',
      surface: 'web_checkout',
    });

    expect(result).toEqual({ recorded: true });
    expect(eventStore.publish).toHaveBeenCalledWith({
      eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
      aggregateType: 'product_recommendation',
      aggregateId: 'prod-1',
      businessId: 'biz-1',
      payload: {
        productId: 'prod-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingId: 'bk-42',
        surface: 'web_checkout',
      },
    });
  });

  it('records consumer app clicked without booking id', async () => {
    await service.recordRecommendationEvent(business, {
      event: 'clicked',
      productId: 'prod-2',
      serviceId: 'svc-1',
      surface: 'consumer_app',
    });

    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
        payload: {
          productId: 'prod-2',
          serviceId: 'svc-1',
          surface: 'consumer_app',
        },
      }),
    );
  });

  it('records category-only shown when no service context is sent', async () => {
    serviceLinkRepo.find.mockResolvedValue([]);
    categoryLinkRepo.find.mockResolvedValue([
      { productId: 'prod-1', sortOrder: 0 },
    ]);
    productRepo.find.mockResolvedValue([products[0]]);

    const result = await service.recordRecommendationEvent(business, {
      event: 'shown',
      productId: 'prod-1',
      categoryId: 'cat-1',
      surface: 'web_checkout',
    });

    expect(result).toEqual({ recorded: true });
    expect(serviceRepo.findOne).not.toHaveBeenCalled();
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: expect.objectContaining({ categoryId: 'cat-1' }),
      }),
    );
  });

  it('rejects unknown events, out-of-list products, and missing context', async () => {
    expect(
      await service.recordRecommendationEvent(business, {
        event: 'dismissed',
        productId: 'prod-1',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });

    expect(
      await service.recordRecommendationEvent(business, {
        event: 'shown',
        productId: 'prod-9',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });

    expect(
      await service.recordRecommendationEvent(business, {
        event: 'clicked',
        productId: 'prod-1',
      }),
    ).toEqual({ recorded: false });

    expect(
      await service.recordRecommendationEvent(business, {
        event: 'shown',
        productId: '   ',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });

    expect(eventStore.publish).not.toHaveBeenCalled();
  });

  it('does not publish when checkout recommendations resolve empty', async () => {
    serviceLinkRepo.find.mockResolvedValue([]);
    categoryLinkRepo.find.mockResolvedValue([]);

    expect(
      await service.recordRecommendationEvent(business, {
        event: 'shown',
        productId: 'prod-1',
        serviceId: 'svc-1',
      }),
    ).toEqual({ recorded: false });
    expect(eventStore.publish).not.toHaveBeenCalled();
  });
});
