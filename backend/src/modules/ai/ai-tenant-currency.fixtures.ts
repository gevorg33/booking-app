/** Consumer app classifier rules for tenant currency display (ai-cmd-curr-6). */
export const TENANT_CURRENCY_CLASSIFIER_RULES = `- explain_tenant_currency: READ — explain why the salon consumer app shows prices in € / ֏ / ₽ / $ after the customer's profile loads for this tenant. Uses the salon business default currency; individual catalog services may still show a legacy ISO code until aligned. Mention in-app online checkout support when relevant. NOT explain_checkout_currency (anonymous public booking page) and NOT explain_business_currency (dashboard admin settings).
- Examples:
  - "Why does the salon app show prices in euros after I log in?" → explain_tenant_currency
  - "What currency does this salon use in the consumer app?" → explain_tenant_currency
  - "Why are amounts in dram (֏) in the mobile app?" → explain_tenant_currency
  - "Почему в приложении цены в рублях?" → explain_tenant_currency
  - "Ինչու է հավելվածում գները ցուցադրվում եվրոյով" → explain_tenant_currency`;

export const EXPLAIN_TENANT_CURRENCY_PROMPTS = [
  {
    id: 'why-euros-consumer-app',
    prompt: 'Why does the salon app show prices in euros after I log in?',
  },
  {
    id: 'what-currency-consumer-app',
    prompt: 'What currency does this salon use in the consumer app?',
  },
  {
    id: 'why-dram-mobile-app',
    prompt: 'Why are amounts in dram (֏) in the mobile app?',
  },
  {
    id: 'why-ruble-in-app',
    prompt: 'Why do I see ruble prices (₽) in the salon app?',
  },
  {
    id: 'why-currency-after-profile',
    prompt: 'Why are all prices in AMD after my profile loads?',
  },
  {
    id: 'why-dollar-app-prices',
    prompt: 'Why does the consumer app show dollar prices for this salon?',
  },
  {
    id: 'ru-why-ruble-app',
    prompt: 'Почему в приложении цены в рублях после входа?',
  },
  {
    id: 'ru-what-currency-app',
    prompt: 'В какой валюте показаны цены в мобильном приложении салона?',
  },
  {
    id: 'hy-why-euro-app',
    prompt: 'Ինչու է հավելվածում գները ցուցադրվում եվրոյով',
  },
  {
    id: 'hy-what-currency-app',
    prompt: 'Որ արժույթով են գները ցուցադրվում հավելվածում',
  },
] as const;
