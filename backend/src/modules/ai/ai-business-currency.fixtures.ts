/** Dashboard classifier rules for tenant default currency (ai-cmd-curr-1..3). */
export const BUSINESS_CURRENCY_CLASSIFIER_RULES = `- configure_business_currency: MUTATE — set the business default ISO currency for new catalog prices, reports KPIs, and checkout display. Triggers: set/switch/change/use + default currency / currency to / salon to + AMD|EUR|RUB|USD|etc. Set currencyCode to a 3-letter ISO code. "Use rubles for new services" means default currency RUB for new items — NOT bulk-updating existing service rows.
- explain_business_currency: READ — explain current business default currency, whether Stripe supports online card charges for it, and how many active catalog services still use a different ISO code. Triggers: what/which/explain/show + default/business/salon currency; how many services on a different/legacy currency; Stripe + currency questions without a target code to set. NOT explain_stripe_currency_warning (Settings Stripe Connect warning banner or supported ISO list vs cash/pay-at-venue), NOT diagnose_stripe_checkout_failure (checkout session creation failure troubleshooting), and NOT explain_reports_currency (why Reports/P&L KPIs show a currency code).
- bulk_update_service_currency: MUTATE — align existing catalog service.currency values to the current business default (optional fromCurrency filter). Requires user confirmation before updating rows. Triggers: align/migrate/sync/convert/update all services + currency/default; bulk service currency migration. Does NOT change business default — only service rows.
- Examples:
  - "Set default currency to AMD" → configure_business_currency, currencyCode=AMD
  - "Switch the salon to euros" → configure_business_currency, currencyCode=EUR
  - "Use rubles for new services" → configure_business_currency, currencyCode=RUB
  - "What is our default currency?" → explain_business_currency
  - "Explain our salon currency settings" → explain_business_currency
  - "Is Stripe supported for our currency?" → explain_business_currency
  - "How many services are on a different currency?" → explain_business_currency
  - "Align all services to business default currency" → bulk_update_service_currency
  - "Migrate legacy service currencies to match default" → bulk_update_service_currency
  - "Update all existing service currencies to the default" → bulk_update_service_currency`;

export const CONFIGURE_BUSINESS_CURRENCY_PROMPTS = [
  {
    id: 'set-default-amd',
    prompt: 'Set default currency to AMD',
    currencyCode: 'AMD',
  },
  {
    id: 'switch-salon-euros',
    prompt: 'Switch the salon to euros',
    currencyCode: 'EUR',
  },
  {
    id: 'rubles-new-services',
    prompt: 'Use rubles for new services',
    currencyCode: 'RUB',
  },
] as const;

export const EXPLAIN_BUSINESS_CURRENCY_PROMPTS = [
  {
    id: 'what-default-currency',
    prompt: 'What is our default currency?',
  },
  {
    id: 'explain-salon-currency',
    prompt: 'Explain our salon currency settings',
  },
  {
    id: 'stripe-supported',
    prompt: 'Is Stripe supported for our currency?',
  },
  {
    id: 'services-different-currency',
    prompt: 'How many services are on a different currency?',
  },
  {
    id: 'which-currency-salon',
    prompt: 'Which currency does the salon use?',
  },
  {
    id: 'currency-overview',
    prompt: 'Show currency overview',
  },
  {
    id: 'services-still-usd',
    prompt: 'How many services are still on USD?',
  },
  {
    id: 'business-currency-status',
    prompt: "What's our business currency status?",
  },
  {
    id: 'stripe-amd-payments',
    prompt: 'Can we take online card payments in AMD?',
  },
  {
    id: 'legacy-service-currencies',
    prompt: 'Do any services still use a legacy currency code?',
  },
] as const;

export const BULK_UPDATE_SERVICE_CURRENCY_PROMPTS = [
  {
    id: 'align-services-default',
    prompt: 'Align all services to business default currency',
  },
  {
    id: 'migrate-legacy-currencies',
    prompt: 'Migrate legacy service currencies to match default',
  },
  {
    id: 'update-all-service-currency',
    prompt: 'Update all existing service currencies to the default',
  },
  {
    id: 'sync-service-currency',
    prompt: 'Sync service catalog currency with business default',
  },
  {
    id: 'convert-services-default',
    prompt: 'Convert all services to use the default currency',
  },
  {
    id: 'bulk-align-usd-services',
    prompt: 'Bulk align services still on USD to our default',
    fromCurrency: 'USD',
  },
  {
    id: 'fix-mismatched-currencies',
    prompt: 'Fix mismatched service currencies in the catalog',
  },
  {
    id: 'standardize-service-currency',
    prompt: 'Standardize all service currencies to the salon default',
  },
  {
    id: 'match-default-currency',
    prompt: 'Make every service match the default currency',
  },
  {
    id: 'update-catalog-currency',
    prompt: 'Update catalog service currencies to business default',
  },
] as const;
