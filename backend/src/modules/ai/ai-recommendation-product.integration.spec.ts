import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
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
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
} from './ai-recommendation-product.util.js';

describe('ai recommendation product integration (ai-cmd-rec-1)', () => {
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
    createProduct: jest.fn(async (_businessId: string, dto: Record<string, unknown>) => ({
      id: 'prod-new',
      businessId: 'biz-1',
      ...dto,
    })),
    updateProduct: jest.fn(
      async (_id: string, _businessId: string, dto: Record<string, unknown>) => ({
        ...products[0],
        ...dto,
      }),
    ),
  };

  const deps = () => ({ inventoryService });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each(CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS)(
    'rescues configure recommendation product $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_recommendation_product');
      expect(rescued?.rescueReason).toBe('configure_recommendation_product');
    },
  );

  it('validates shampoo prompt and clarifies missing image/link URLs', () => {
    const prompt =
      'Add a shampoo product for post-checkout with image and link';
    const parsed = parseConfigureRecommendationProductFromPrompt(prompt);
    expect(parsed?.productName?.toLowerCase()).toContain('shampoo');

    const validation = validateCommand({
      action: 'configure_recommendation_product',
      params: parsed ?? {},
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt,
    });
    expect(validation.ok).toBe(false);
    expect(validation.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['imageUrl', 'externalLink']),
    );
  });

  it('executes mask-with-urls end to end', async () => {
    const entry = CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS.find(
      (item) => item.id === 'mask-with-urls',
    )!;
    const validation = validateCommand({
      action: 'configure_recommendation_product',
      params: parseConfigureRecommendationProductFromPrompt(entry.prompt) ?? {},
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt: entry.prompt,
    });
    expect(validation.ok).toBe(true);

    const result = await handleConfigureRecommendationProductLogic(
      deps(),
      'biz-1',
      parseConfigureRecommendationProductFromPrompt(entry.prompt) ?? {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.productId).toBe('prod-new');
  });
});

describe('ai recommendation link integration (ai-cmd-rec-2)', () => {
  const products = [
    {
      id: 'prod-shampoo',
      businessId: 'biz-1',
      name: 'Shampoo',
      isActive: true,
    },
    {
      id: 'prod-conditioner',
      businessId: 'biz-1',
      name: 'Conditioner',
      isActive: true,
    },
    {
      id: 'prod-mask',
      businessId: 'biz-1',
      name: 'Repair Mask',
      isActive: true,
    },
    {
      id: 'prod-oil',
      businessId: 'biz-1',
      name: 'Bond Oil',
      isActive: true,
    },
  ];

  const services = [
    { id: 'svc-haircut', name: 'Haircut', businessId: 'biz-1', isActive: true },
    { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
    { id: 'svc-keratin', name: 'keratin', businessId: 'biz-1', isActive: true },
    { id: 'svc-blowout', name: 'Blowout', businessId: 'biz-1', isActive: true },
    { id: 'svc-highlights', name: 'highlights', businessId: 'biz-1', isActive: true },
  ];

  const categories = [{ id: 'cat-hair', name: 'Hair', businessId: 'biz-1' }];

  const inventoryService = {
    listProducts: jest.fn(async () => [...products]),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
  };

  const productRecommendationService = {
    setServiceRecommendations: jest.fn(async (_biz, _svc, ids: string[]) => ids),
    setCategoryRecommendations: jest.fn(async (_biz, _cat, ids: string[]) => ids),
  };

  const serviceRepo = {
    find: jest.fn(async () => [...services]),
    findOne: jest.fn(async ({ where }: { where: { id?: string } }) =>
      services.find((item) => item.id === where.id) ??
      services.find(
        (item) =>
          item.name.toLowerCase() === String(where.id ?? '').toLowerCase(),
      ),
    ),
  };

  const categoryRepo = {
    find: jest.fn(async () => [...categories]),
    findOne: jest.fn(async () => categories[0]),
  };

  const linkDeps = () => ({
    inventoryService,
    productRecommendationService,
    serviceRepo,
    categoryRepo,
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    serviceRepo.find.mockResolvedValue([...services]);
    rescue = new AiIntentRescueService();
  });

  it.each(LINK_RECOMMENDED_PRODUCTS_PROMPTS)(
    'rescues link recommended products $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('link_recommended_products');
      expect(rescued?.rescueReason).toBe('link_recommended_products');
    },
  );

  it('validates and executes shampoo-conditioner-after-haircut', async () => {
    const entry = LINK_RECOMMENDED_PRODUCTS_PROMPTS.find(
      (item) => item.id === 'shampoo-conditioner-after-haircut',
    )!;
    const parsed = parseLinkRecommendedProductsFromPrompt(entry.prompt);
    const validation = validateCommand({
      action: 'link_recommended_products',
      params: parsed ?? {},
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt: entry.prompt,
    });
    expect(validation.ok).toBe(true);

    const result = await handleLinkRecommendedProductsLogic(
      linkDeps(),
      'biz-1',
      parsed ?? {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.serviceName).toBe('Haircut');
  });
});

describe('ai recommendation explain integration (ai-cmd-rec-3)', () => {
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { recommendations: { maxProductCount: 5 } } },
  };

  const products = [
    { id: 'prod-shampoo', name: 'Shampoo', isActive: true },
    { id: 'prod-conditioner', name: 'Conditioner', isActive: true },
  ];

  const services = [
    { id: 'svc-haircut', name: 'Haircut', businessId: 'biz-1', isActive: true },
    { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
  ];

  const categories = [{ id: 'cat-hair', name: 'Hair', businessId: 'biz-1' }];

  const businessRepo = { findOne: jest.fn(async () => business) };
  const inventoryService = {
    listProducts: jest.fn(async () => [...products]),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
  };
  const serviceRepo = { find: jest.fn(async () => [...services]) };
  const categoryRepo = { find: jest.fn(async () => [...categories]) };
  const serviceLinkRepo = {
    find: jest.fn(async () => [
      { serviceId: 'svc-haircut', productId: 'prod-shampoo', sortOrder: 0 },
      { serviceId: 'svc-haircut', productId: 'prod-conditioner', sortOrder: 1 },
    ]),
  };
  const categoryLinkRepo = { find: jest.fn(async () => []) };

  const explainDeps = () => ({
    businessRepo,
    inventoryService,
    serviceRepo,
    categoryRepo,
    serviceLinkRepo,
    categoryLinkRepo,
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_RECOMMENDATION_SETUP_PROMPTS)(
    'rescues explain recommendation setup $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_recommendation_setup');
      expect(rescued?.rescueReason).toBe('explain_recommendation_setup');
    },
  );

  it('executes linked-products explain end to end', async () => {
    const entry = EXPLAIN_RECOMMENDATION_SETUP_PROMPTS.find(
      (item) => item.id === 'linked-products',
    )!;
    const parsed = parseExplainRecommendationSetupFromPrompt(entry.prompt);
    const result = await handleExplainRecommendationSetupLogic(
      explainDeps(),
      'biz-1',
      parsed ?? {},
      entry.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.maxProductCount).toBe(5);
    expect(result.details?.activeProductCount).toBe(2);
  });
});
