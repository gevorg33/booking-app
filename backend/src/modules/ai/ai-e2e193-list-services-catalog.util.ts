/**
 * e2e-bug.193 — list_services catalog browse must not treat list-phrasing
 * fillers ("you offer", "are available") as service filters, and must not be
 * stolen by check_multi_service_block_availability.
 */
export const E2E193_LIST_SERVICES_PROMPTS = [
  {
    id: 'what-services-do-you-offer',
    prompt: 'What services do you offer?',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'what-services-do-you-offer-lower',
    prompt: 'what services do you offer',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'what-services-are-available',
    prompt: 'What services are available?',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'what-services-do-you-have',
    prompt: 'What services do you have?',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'show-me-your-services',
    prompt: 'Show me your services',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'list-services',
    prompt: 'list services',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'list-all-services',
    prompt: 'list all services',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'what-services-do-we-offer',
    prompt: 'What services do we offer?',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'services-do-you-offer',
    prompt: 'services do you offer',
    expectAction: 'list_services' as const,
    expectFullCatalog: true,
  },
  {
    id: 'do-you-offer-swedish',
    prompt: 'do you offer Swedish massage?',
    expectAction: 'list_services' as const,
    expectFullCatalog: false,
  },
] as const;

export const E2E193_FILLER_FILTER_CASES = [
  { id: 'filler-you-offer', value: 'you offer', expected: null },
  { id: 'filler-are-available', value: 'are available', expected: null },
  { id: 'filler-available', value: 'available', expected: null },
  { id: 'filler-do-you-have', value: 'do you have', expected: null },
  { id: 'keep-massage', value: 'massage', expected: 'massage' },
  {
    id: 'strip-trailing-offer',
    value: 'massage you offer',
    expected: 'massage',
  },
] as const;

export const E2E193_NEGATIVE_PROMPTS = [
  {
    id: 'neg-under-budget',
    prompt: 'services under $50',
    forbidMultiServiceBlock: true,
  },
  {
    id: 'neg-multi-service-block',
    prompt: 'Check multi-service block availability',
    expectMultiServiceBlock: true,
  },
  {
    id: 'neg-services-block-slots',
    prompt: 'What services block slots tomorrow',
    expectMultiServiceBlock: true,
  },
] as const;
