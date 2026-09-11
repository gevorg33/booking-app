/** Dashboard classifier rules for post-checkout recommendation products (ai-cmd-rec-1..3). */
export const RECOMMENDATION_PRODUCT_CLASSIFIER_RULES = `- configure_recommendation_product: MUTATE — create or update an active inventory product shown on the post-checkout "You might also like" surface (name, description, imageUrl, externalLink, retailPrice). Triggers: add/create/set/update + product + post-checkout|checkout recommendation|recommendation product; include image and/or external shop link. Creates catalog Product rows with recommendation fields — NOT create_product (retail POS SKU/stock onboarding), NOT link_product_to_service (service consumption link), NOT link_recommended_products (attach products to services/categories for checkout), and NOT suggest_retail_upsell (staff upsell hints).
- link_recommended_products: MUTATE — attach one or more existing products to a service or category for post-checkout recommendations (ordered list replaces prior links). Triggers: recommend/suggest + product names + after/for + service|category; link/set + recommended/recommendation products + to service; set checkout recommendations for a service. Resolves catalog products by name — NOT configure_recommendation_product (create product rows), NOT link_product_to_service (inventory consumption per visit), and NOT suggest_retail_upsell (provider chair-side upsell).
- explain_recommendation_setup: READ — summarize checkout recommendation configuration: maxProductCount, active catalog products, and linked products per service/category (ordered). Triggers: explain/show/describe/what/which + recommendation setup|checkout recommendations|recommended products|post-checkout recommendations. Optional serviceName or categoryName filter. NOT link_recommended_products (mutate links), NOT configure_recommendation_product (create product), NOT list_products (retail inventory), NOT explain_recommendation_analytics (event counts), NOT summarize_recommendation_performance (CTR summary), NOT explain_checkout_recommendations (product cards on success screen), and NOT explain_consumer_checkout_success (consumer app success screen overview).
- Examples:
  - "Add a shampoo product for post-checkout with image and link" → configure_recommendation_product, productName=shampoo, wantsImage=true, wantsLink=true
  - "Create post-checkout product Repair Mask image https://cdn.test/mask.jpg link https://shop.test/mask" → configure_recommendation_product, productName=Repair Mask, imageUrl, externalLink
  - "Update recommendation product Shampoo image to /uploads/shampoo.jpg" → configure_recommendation_product, productName=Shampoo, imageUrl
  - "Recommend shampoo and conditioner after haircut service" → link_recommended_products, productNames=[shampoo, conditioner], serviceName=haircut
  - "Set checkout recommendations for Color to Repair Mask, Bond Oil" → link_recommended_products, serviceName=Color, productNames=[Repair Mask, Bond Oil]
  - "Explain recommendation setup" → explain_recommendation_setup
  - "Which products are linked for post-checkout recommendations?" → explain_recommendation_setup
  - "Describe recommendation setup for Haircut service" → explain_recommendation_setup, serviceName=Haircut`;

/** Declared so the array is one type, not a union of eight literal shapes. */
export type ConfigureRecommendationProductPromptFixture = {
  id: string;
  prompt: string;
  productName: string;
  externalLink?: string;
  imageUrl?: string;
  isUpdate?: boolean;
  wantsImage?: boolean;
  wantsLink?: boolean;
  description?: string;
  retailPrice?: number;
};

export const CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS: readonly ConfigureRecommendationProductPromptFixture[] = [
  {
    id: 'shampoo-post-checkout-image-link',
    prompt: 'Add a shampoo product for post-checkout with image and link',
    productName: 'shampoo',
    wantsImage: true,
    wantsLink: true,
  },
  {
    id: 'mask-with-urls',
    prompt:
      'Create post-checkout product Repair Mask image https://cdn.test/mask.jpg link https://shop.test/mask',
    productName: 'Repair Mask',
    imageUrl: 'https://cdn.test/mask.jpg',
    externalLink: 'https://shop.test/mask',
  },
  {
    id: 'conditioner-description-price',
    prompt:
      'Add a conditioner recommendation product for after checkout with description "Color-safe formula" retail 24',
    productName: 'conditioner',
    description: 'Color-safe formula',
    retailPrice: 24,
  },
  {
    id: 'update-shampoo-image',
    prompt:
      'Update recommendation product Shampoo image to /uploads/shampoo.jpg',
    productName: 'Shampoo',
    imageUrl: '/uploads/shampoo.jpg',
    isUpdate: true,
  },
  {
    id: 'serum-external-link',
    prompt:
      'Set post-checkout product Hair Serum external link https://shop.test/serum',
    productName: 'Hair Serum',
    externalLink: 'https://shop.test/serum',
    isUpdate: true,
  },
  {
    id: 'oil-checkout-recommendation',
    prompt:
      'Configure checkout recommendation product Argan Oil with image https://img.test/oil.png and link https://buy.test/oil',
    productName: 'Argan Oil',
    imageUrl: 'https://img.test/oil.png',
    externalLink: 'https://buy.test/oil',
  },
  {
    id: 'add-scalp-treatment',
    prompt: 'Add scalp treatment product for post-checkout recommendations',
    productName: 'scalp treatment',
  },
  {
    id: 'create-leave-in',
    prompt:
      'Create a leave-in conditioner product for the checkout recommendation carousel with link https://shop.test/leave-in',
    productName: 'leave-in conditioner',
    externalLink: 'https://shop.test/leave-in',
  },
] as const;

/** Declared so the array is one type, not a union of eight literal shapes. */
export type LinkRecommendedProductsPromptFixture = {
  id: string;
  prompt: string;
  productNames: readonly string[];
  serviceName?: string;
  categoryName?: string;
};

export const LINK_RECOMMENDED_PRODUCTS_PROMPTS: readonly LinkRecommendedProductsPromptFixture[] = [
  {
    id: 'shampoo-conditioner-after-haircut',
    prompt: 'Recommend shampoo and conditioner after haircut service',
    productNames: ['shampoo', 'conditioner'],
    serviceName: 'haircut',
  },
  {
    id: 'link-recommended-to-service',
    prompt:
      'Link recommended products Shampoo and Conditioner to Haircut service',
    productNames: ['Shampoo', 'Conditioner'],
    serviceName: 'Haircut',
  },
  {
    id: 'set-checkout-recommendations',
    prompt: 'Set checkout recommendations for Color to Repair Mask, Bond Oil',
    productNames: ['Repair Mask', 'Bond Oil'],
    serviceName: 'Color',
  },
  {
    id: 'suggest-single-after-service',
    prompt: 'Suggest Repair Mask after keratin service',
    productNames: ['Repair Mask'],
    serviceName: 'keratin',
  },
  {
    id: 'recommend-for-category',
    prompt: 'Recommend shampoo and conditioner for Hair category',
    productNames: ['shampoo', 'conditioner'],
    categoryName: 'Hair',
  },
  {
    id: 'attach-checkout-products',
    prompt:
      'Attach checkout recommendation products Argan Oil and Heat Protectant to Blowout service',
    productNames: ['Argan Oil', 'Heat Protectant'],
    serviceName: 'Blowout',
  },
  {
    id: 'following-color-service',
    prompt: 'Recommend bond oil following color service',
    productNames: ['bond oil'],
    serviceName: 'color',
  },
  {
    id: 'recommend-three-products',
    prompt: 'Recommend shampoo, conditioner, and mask after highlights service',
    productNames: ['shampoo', 'conditioner', 'mask'],
    serviceName: 'highlights',
  },
] as const;

/** Declared so the array is one type, not a union of ten literal shapes. */
export type ExplainRecommendationSetupPromptFixture = {
  id: string;
  prompt: string;
  serviceName?: string;
  categoryName?: string;
};

export const EXPLAIN_RECOMMENDATION_SETUP_PROMPTS: readonly ExplainRecommendationSetupPromptFixture[] = [
  { id: 'explain-setup', prompt: 'Explain recommendation setup' },
  {
    id: 'show-checkout-config',
    prompt: 'Show checkout recommendation configuration',
  },
  {
    id: 'linked-products',
    prompt: 'Which products are linked for post-checkout recommendations?',
  },
  {
    id: 'for-haircut-service',
    prompt: 'Describe recommendation setup for Haircut service',
    serviceName: 'Haircut',
  },
  {
    id: 'max-count',
    prompt: 'How many checkout recommendation products can we show?',
  },
  {
    id: 'links-per-service',
    prompt: 'Show recommendation links per service',
  },
  {
    id: 'for-hair-category',
    prompt: 'Explain post-checkout recommendation setup for Hair category',
    categoryName: 'Hair',
  },
  {
    id: 'which-after-color',
    prompt: 'Which products are recommended after Color service?',
    serviceName: 'Color',
  },
  {
    id: 'active-products-overview',
    prompt: 'What active products do we have for checkout recommendations?',
  },
  {
    id: 'recommendation-status',
    prompt: 'Show post-checkout recommendation status',
  },
];
