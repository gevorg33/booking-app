/** Customer/public classifier rules for booking-page currency display (ai-cmd-curr-5). */
export const CHECKOUT_CURRENCY_CLASSIFIER_RULES = `- explain_checkout_currency: READ — explain why catalog and checkout prices show € / ֏ / ₽ / $ on the booking page. Uses the salon business default currency; individual services may still show a legacy ISO code until aligned. Mention Stripe online checkout support when relevant. NOT explain_checkout_total (line-item breakdown), NOT explain_why_stripe_required (payment method requirement), and NOT explain_stripe_checkout_currency (Stripe charge currency vs cash/pay-at-venue when stripeCurrencySupported is false).
- Examples:
  - "Why do prices show euros on the booking page?" → explain_checkout_currency
  - "Why are amounts in dram (֏)?" → explain_checkout_currency
  - "What currency are these prices in?" → explain_checkout_currency
  - "Почему цены в рублях на странице записи?" → explain_checkout_currency
  - "Ինչու են գները ցուցադրվում եվրոյով" → explain_checkout_currency`;

export const EXPLAIN_CHECKOUT_CURRENCY_PROMPTS = [
  {
    id: 'why-euros-booking-page',
    prompt: 'Why do prices show euros on the booking page?',
  },
  {
    id: 'why-dram-symbol',
    prompt: 'Why are amounts shown in dram (֏)?',
  },
  {
    id: 'why-ruble-prices',
    prompt: 'Why do I see ruble prices (₽) here?',
  },
  {
    id: 'what-currency-prices',
    prompt: 'What currency are these booking prices in?',
  },
  {
    id: 'why-currency-checkout',
    prompt: 'Why is checkout in AMD on this page?',
  },
  {
    id: 'ru-why-ruble-booking',
    prompt: 'Почему цены в рублях на странице записи?',
  },
  {
    id: 'ru-what-currency',
    prompt: 'В какой валюте показаны цены на сайте?',
  },
  {
    id: 'hy-why-euro-prices',
    prompt: 'Ինչու են գները ցուցադրվում եվրոյով',
  },
  {
    id: 'hy-what-currency',
    prompt: 'Որ արժույթով են ցուցադրվում գները այս էջում',
  },
  {
    id: 'why-dollar-sign',
    prompt: 'Why does the salon booking page use dollar prices?',
  },
] as const;
