/** ai-cmd-provider-5.0.1 / prov-exp-5.1 — provider mobile chair-side retail upsell suggestions. */

export const PROVIDER_SUGGEST_RETAIL_UPSELL_PROMPT_SCENARIOS = [
  {
    id: 'provider-suggest-retail-upsell-booking-en',
    prompt: 'Suggest retail upsell for this booking',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-recommend-product-en',
    prompt: 'Recommend a product for this client',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-what-should-i-en',
    prompt: 'What retail product should I suggest here',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-upsell-ideas-en',
    prompt: 'Suggest an upsell for Jane',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-any-product-en',
    prompt: 'Any product I should recommend right now',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-recommend-retail-en',
    prompt: 'Recommend retail for this visit',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-good-fit-en',
    prompt: 'Suggest a good product fit for this client',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-suggest-upsell-en',
    prompt: 'Suggest upsell options for this visit',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
  {
    id: 'provider-suggest-retail-upsell-recommend-something-en',
    prompt: 'Recommend something from retail for her',
    surface: 'provider' as const,
    expectedAction: 'suggest_retail_upsell',
  },
] as const;
