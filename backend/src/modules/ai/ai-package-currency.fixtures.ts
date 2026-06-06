/** Public booking classifier rules for package and gift-card currency (ai-cmd-curr-7). */
export const PACKAGE_CURRENCY_CLASSIFIER_RULES = `- explain_package_currency: READ — explain why service package or gift-card totals show € / ֏ / ₽ / $ using the salon business default vs legacy bundled service ISO codes. Package totals resolve currency from the first bundled service (fallback to business default). Monetary gift-card presets always use the business default; package- and service-based gift cards follow the same resolve rules as catalog packages. NOT explain_checkout_currency (generic single-service booking page prices) and NOT explain_tenant_currency (logged-in consumer app).
- Examples:
  - "Why is the spa package total in dollars?" → explain_package_currency
  - "What currency is the gift card package priced in?" → explain_package_currency
  - "Why does the gift card total show euros?" → explain_package_currency
  - "Почему пакет услуг показан в драмах?" → explain_package_currency
  - "Ինչու է նվեր քարտի գումարը ցուցադրվում ռուբլով" → explain_package_currency`;

export const EXPLAIN_PACKAGE_CURRENCY_PROMPTS = [
  {
    id: 'why-spa-package-dollars',
    prompt: 'Why is the spa package total in dollars?',
  },
  {
    id: 'what-currency-gift-card-package',
    prompt: 'What currency is the gift card package priced in?',
  },
  {
    id: 'why-gift-card-total-euros',
    prompt: 'Why does the gift card total show euros (€)?',
  },
  {
    id: 'why-package-dram',
    prompt: 'Why is this service package shown in dram (֏)?',
  },
  {
    id: 'why-bundle-rubles',
    prompt: 'Why does the package bundle use ruble prices (₽)?',
  },
  {
    id: 'why-preset-gift-card-currency',
    prompt: 'What currency are the gift card preset amounts in?',
  },
  {
    id: 'ru-why-package-dram',
    prompt: 'Почему пакет услуг показан в драмах?',
  },
  {
    id: 'ru-gift-card-currency',
    prompt: 'В какой валюте показана сумма подарочной карты?',
  },
  {
    id: 'hy-why-gift-card-ruble',
    prompt: 'Ինչու է նվեր քարտի գումարը ցուցադրվում ռուբլով',
  },
  {
    id: 'hy-what-currency-package',
    prompt: 'Որ արժույթով է ցուցադրվում փաթեթի գինը',
  },
] as const;
