import {
  handleConfigureRecommendationProductLogic,
  handleExplainRecommendationSetupLogic,
  handleLinkRecommendedProductsLogic,
} from './ai-recommendation-product.logic.js';
import {
  CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS,
  EXPLAIN_RECOMMENDATION_SETUP_PROMPTS,
  LINK_RECOMMENDED_PRODUCTS_PROMPTS,
} from './ai-recommendation-product.fixtures.js';

describe('ai-recommendation-product.logic (ai-cmd-rec-1)', () => {
  const products = [
    {
      id: 'prod-shampoo',
      businessId: 'biz-1',
      name: 'Shampoo',
      description: null,
      imageUrl: null,
      externalLink: null,
      retailPrice: 0,
      isActive: true,
    },
  ];

  const inventoryService = {
    listProducts: jest.fn(async () => [...products]),
    createProduct: jest.fn(
      async (_businessId: string, dto: Record<string, unknown>) => ({
        id: 'prod-new',
        businessId: 'biz-1',
        ...dto,
      }),
    ),
    updateProduct: jest.fn(
      async (
        _id: string,
        _businessId: string,
        dto: Record<string, unknown>,
      ) => ({
        ...products[0],
        ...dto,
      }),
    ),
  };

  const deps = () => ({ inventoryService });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clarifies when image and link are requested without URLs', async () => {
    const prompt =
      'Add a shampoo product for post-checkout with image and link';
    const result = await handleConfigureRecommendationProductLogic(
      deps(),
      'biz-1',
      {},
      prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(
      expect.arrayContaining(['imageUrl', 'externalLink']),
    );
    expect(inventoryService.createProduct).not.toHaveBeenCalled();
  });

  it('creates recommendation product with image and external link', async () => {
    const entry = CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS.find(
      (item) => item.id === 'mask-with-urls',
    )!;
    const result = await handleConfigureRecommendationProductLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(inventoryService.createProduct).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        name: 'Repair Mask',
        imageUrl: 'https://cdn.test/mask.jpg',
        externalLink: 'https://shop.test/mask',
        isActive: true,
      }),
    );
  });

  it('updates an existing recommendation product image', async () => {
    const entry = CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS.find(
      (item) => item.id === 'update-shampoo-image',
    )!;
    const result = await handleConfigureRecommendationProductLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(inventoryService.updateProduct).toHaveBeenCalledWith(
      'prod-shampoo',
      'biz-1',
      expect.objectContaining({
        imageUrl: '/uploads/shampoo.jpg',
        isActive: true,
      }),
    );
  });
});

describe('ai-recommendation-product link logic (ai-cmd-rec-2)', () => {
  const products = [
    { id: 'prod-shampoo', name: 'Shampoo', isActive: true },
    { id: 'prod-conditioner', name: 'Conditioner', isActive: true },
  ];

  const services = [
    { id: 'svc-haircut', name: 'Haircut', businessId: 'biz-1', isActive: true },
  ];

  const categories = [{ id: 'cat-hair', name: 'Hair', businessId: 'biz-1' }];

  const inventoryService = {
    listProducts: jest.fn(async () => [...products]),
  };

  const productRecommendationService = {
    setServiceRecommendations: jest.fn(async () => [
      'prod-shampoo',
      'prod-conditioner',
    ]),
    setCategoryRecommendations: jest.fn(async () => [
      'prod-shampoo',
      'prod-conditioner',
    ]),
  };

  const serviceRepo = {
    find: jest.fn(async () => [...services]),
    findOne: jest.fn(async () => services[0]),
  };

  const categoryRepo = {
    find: jest.fn(async () => [...categories]),
    findOne: jest.fn(async () => categories[0]),
  };

  const deps = () => ({
    inventoryService,
    productRecommendationService,
    serviceRepo,
    categoryRepo,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links products to a service', async () => {
    const entry = LINK_RECOMMENDED_PRODUCTS_PROMPTS.find(
      (item) => item.id === 'shampoo-conditioner-after-haircut',
    )!;
    const result = await handleLinkRecommendedProductsLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(
      productRecommendationService.setServiceRecommendations,
    ).toHaveBeenCalledWith('biz-1', 'svc-haircut', [
      'prod-shampoo',
      'prod-conditioner',
    ]);
  });

  it('links products to a category', async () => {
    const entry = LINK_RECOMMENDED_PRODUCTS_PROMPTS.find(
      (item) => item.id === 'recommend-for-category',
    )!;
    const result = await handleLinkRecommendedProductsLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(
      productRecommendationService.setCategoryRecommendations,
    ).toHaveBeenCalledWith('biz-1', 'cat-hair', [
      'prod-shampoo',
      'prod-conditioner',
    ]);
  });

  it('clarifies when products are missing', async () => {
    inventoryService.listProducts.mockResolvedValueOnce([]);
    const result = await handleLinkRecommendedProductsLogic(
      deps(),
      'biz-1',
      {},
      'Recommend shampoo and conditioner after haircut service',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});

describe('ai-recommendation-product explain logic (ai-cmd-rec-3)', () => {
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { recommendations: { maxProductCount: 4 } } },
  };

  const products = [
    { id: 'prod-shampoo', name: 'Shampoo', isActive: true },
    { id: 'prod-conditioner', name: 'Conditioner', isActive: true },
    { id: 'prod-mask', name: 'Repair Mask', isActive: false },
  ];

  const services = [
    { id: 'svc-haircut', name: 'Haircut', businessId: 'biz-1', isActive: true },
    { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
  ];

  const categories = [{ id: 'cat-hair', name: 'Hair', businessId: 'biz-1' }];

  const businessRepo = {
    findOne: jest.fn(async () => business),
  };
  const inventoryService = {
    listProducts: jest.fn(
      async (_biz: string, _loc?: string, includeInactive?: boolean) =>
        includeInactive
          ? [...products]
          : products.filter((item) => item.isActive),
    ),
  };
  const serviceRepo = {
    find: jest.fn(async () => [...services]),
  };
  const categoryRepo = {
    find: jest.fn(async () => [...categories]),
  };
  const serviceLinkRepo = {
    find: jest.fn(async () => [
      { serviceId: 'svc-haircut', productId: 'prod-shampoo', sortOrder: 0 },
      { serviceId: 'svc-haircut', productId: 'prod-conditioner', sortOrder: 1 },
      { serviceId: 'svc-color', productId: 'prod-mask', sortOrder: 0 },
    ]),
  };
  const categoryLinkRepo = {
    find: jest.fn(async () => [
      { categoryId: 'cat-hair', productId: 'prod-mask', sortOrder: 0 },
    ]),
  };

  const deps = () => ({
    businessRepo,
    inventoryService,
    serviceRepo,
    categoryRepo,
    serviceLinkRepo,
    categoryLinkRepo,
  });

  it('explains full recommendation setup', async () => {
    const entry = EXPLAIN_RECOMMENDATION_SETUP_PROMPTS.find(
      (item) => item.id === 'explain-setup',
    )!;
    const result = await handleExplainRecommendationSetupLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.maxProductCount).toBe(4);
    expect(result.details?.activeProductCount).toBe(2);
    expect(result.details?.linkedServicesCount).toBe(2);
    expect(result.details?.linkedCategoriesCount).toBe(1);
    expect(result.summary).toContain('Haircut: Shampoo, Conditioner');
  });

  it('filters explain output to one service', async () => {
    const entry = EXPLAIN_RECOMMENDATION_SETUP_PROMPTS.find(
      (item) => item.id === 'for-haircut-service',
    )!;
    const result = await handleExplainRecommendationSetupLogic(
      deps(),
      'biz-1',
      {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.serviceName).toBe('Haircut');
    expect(result.summary).toContain('Haircut service: Shampoo, Conditioner');
  });
});
