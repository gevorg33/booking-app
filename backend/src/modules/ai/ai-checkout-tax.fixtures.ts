/** Customer/public classifier rules for booking-page tax display (ai-cmd-tax-5). */
export const CHECKOUT_TAX_CLASSIFIER_RULES = `- explain_checkout_tax: READ — explain why tax appears on the public booking page or checkout: tax line added at payment, inclusive vs exclusive pricing, and what "incl. VAT" / "incl. GST" badges mean on service cards. Uses salon public tax settings (enabled, name, rate, model). NOT explain_business_tax (dashboard admin settings), NOT explain_checkout_total (line-item total breakdown), NOT explain_stripe_checkout_currency (charge currency), and NOT explain_consumer_checkout_tax (logged-in consumer app confirmation).
- Examples:
  - "Why was tax added at checkout?" → explain_checkout_tax
  - "What does incl. VAT mean on the service cards?" → explain_checkout_tax
  - "Why do I see a tax line on the booking page?" → explain_checkout_tax
  - "Почему на странице записи добавлен налог?" → explain_checkout_tax
  - "Что значит incl. VAT на карточках услуг?" → explain_checkout_tax
  - "Ինչու է հարկը ավելացվում checkout-ում" → explain_checkout_tax`;

export const EXPLAIN_CHECKOUT_TAX_PROMPTS = [
  {
    id: 'why-tax-added-checkout',
    prompt: 'Why was tax added at checkout?',
  },
  {
    id: 'what-incl-vat-means',
    prompt: 'What does incl. VAT mean on the service cards?',
  },
  {
    id: 'tax-line-booking-page',
    prompt: 'Why do I see a tax line on the booking page?',
  },
  {
    id: 'why-vat-on-prices',
    prompt: 'Why is VAT shown on these booking prices?',
  },
  {
    id: 'inclusive-badge-help',
    prompt: 'What does the incl. GST badge on services mean?',
  },
  {
    id: 'ru-why-tax-booking-page',
    prompt: 'Почему на странице записи добавлен налог?',
  },
  {
    id: 'ru-what-incl-vat',
    prompt: 'Что значит incl. VAT на карточках услуг?',
  },
  {
    id: 'hy-why-tax-checkout',
    prompt: 'Ինչու է հարկը ավելացվում checkout-ում',
  },
  {
    id: 'hy-what-incl-vat',
    prompt: 'Ինչ է նշանակում incl. VAT-ը ծառայության քարտերում',
  },
  {
    id: 'explain-tax-before-pay',
    prompt: 'Explain why tax is added before I pay on this page',
  },
] as const;
