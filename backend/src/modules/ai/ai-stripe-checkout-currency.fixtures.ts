/** Customer/public classifier rules for Stripe online checkout currency (ai-cmd-curr-11). */
export const STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES = `- explain_stripe_checkout_currency: READ — explain why online Stripe checkout charges in € / ֏ / ₽ / $ (resolvePriceCurrency on the booked service, fallback to business default). When stripeCurrencySupported is false, online card checkout may be unavailable — cash or pay-at-venue is the alternative when enabled. NOT explain_checkout_currency (catalog price display on the booking page), NOT explain_why_stripe_required (why card/Stripe payment is mandatory), NOT explain_stripe_currency_warning (dashboard Settings Connect banner), and NOT explain_package_currency (package/gift-card totals).
- Examples:
  - "Why was I charged in euros on Stripe checkout?" → explain_stripe_checkout_currency
  - "What currency does Stripe charge for my booking?" → explain_stripe_checkout_currency
  - "Why can't I pay online in this currency?" → explain_stripe_checkout_currency
  - "Can I pay cash at the venue if Stripe doesn't support this currency?" → explain_stripe_checkout_currency
  - "Почему онлайн-оплата списалась в евро?" → explain_stripe_checkout_currency
  - "Ինչ արժույթով է Stripe-ը գանձում առցանց վճարման ժամանակ" → explain_stripe_checkout_currency`;

export const EXPLAIN_STRIPE_CHECKOUT_CURRENCY_PROMPTS = [
  {
    id: 'why-charged-euros-stripe',
    prompt: 'Why was I charged in euros on Stripe checkout?',
  },
  {
    id: 'why-online-checkout-dram',
    prompt: 'Why does online checkout use dram (֏)?',
  },
  {
    id: 'what-currency-stripe-charge',
    prompt: 'What currency does Stripe charge for my booking?',
  },
  {
    id: 'why-cant-pay-online-currency',
    prompt: "Why can't I pay online in this currency?",
  },
  {
    id: 'cash-when-stripe-unsupported',
    prompt:
      "Can I pay cash at the venue if Stripe doesn't support this currency?",
  },
  {
    id: 'why-dollar-card-charge',
    prompt: 'Why was my card charged in dollars on the booking page checkout?',
  },
  {
    id: 'pay-online-currency-symbol',
    prompt: 'Why does pay online show rubles (₽) on checkout?',
  },
  {
    id: 'ru-why-euro-stripe-charge',
    prompt: 'Почему онлайн-оплата списалась в евро?',
  },
  {
    id: 'ru-cash-if-stripe-unsupported',
    prompt: 'Можно ли платить наличными, если Stripe не поддерживает валюту?',
  },
  {
    id: 'hy-stripe-online-currency',
    prompt: 'Ինչ արժույթով է Stripe-ը գանձում առցանց վճարման ժամանակ',
  },
] as const;
