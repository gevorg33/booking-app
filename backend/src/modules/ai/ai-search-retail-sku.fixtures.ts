/** ai-cmd-provider-5.4.5 — navigate/search sellable retail products by name or SKU. */

export const SEARCH_RETAIL_SKU_CLASSIFIER_RULES = `- search_retail_sku: READ — provider mobile only: navigate/search sellable retail products by name or SKU (business-wide, not booking-specific). Triggers: find SKU 12345, do we carry bond builder, is olaplex in stock. NOT suggest_retail_upsell (ranked recommendations for a booking's service), NOT add_retail_to_booking (mutate).`;

export const SEARCH_RETAIL_SKU_PROMPT_SCENARIOS = [
  {
    id: 'search-retail-sku-find-en',
    prompt: 'Find SKU 12345',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-carry-en',
    prompt: 'Do we carry bond builder?',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-search-inventory-en',
    prompt: 'Search for shampoo in inventory',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-do-we-have-en',
    prompt: 'Do we have olaplex in stock?',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-look-up-en',
    prompt: 'Look up SKU 98765',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-is-in-stock-en',
    prompt: 'Is bond builder in stock?',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-check-carry-en',
    prompt: 'Check if we carry conditioner',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-find-product-en',
    prompt: 'Find the product with SKU AB123',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-do-you-have-en',
    prompt: 'Do you have argan oil?',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-search-serum-en',
    prompt: 'Search inventory for hair serum',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-hy',
    prompt: 'Ունե՞նք bond builder ապրանքը',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-sku-hy',
    prompt: 'Փնտրիր sku 12345',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-ru',
    prompt: 'У нас есть bond builder в наличии?',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
  {
    id: 'search-retail-sku-sku-ru',
    prompt: 'Найди sku 12345',
    surface: 'provider' as const,
    expectedAction: 'search_retail_sku',
  },
] as const;
