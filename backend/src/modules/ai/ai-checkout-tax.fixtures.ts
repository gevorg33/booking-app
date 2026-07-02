/** Customer/public classifier rules for booking-page tax display (ai-cmd-tax-5). */
export const CHECKOUT_TAX_CLASSIFIER_RULES = `- explain_checkout_tax: READ — explain tax display on the public booking page: incl. VAT/GST badges on service cards, tax lines on checkout payment summary, and tax breakdown on the booking confirmation step before payment (stacked GST+PST lines when configured). Uses salon public tax settings (enabled, name, rate, model). Set aspect=service_list | checkout | confirmation when clear. NOT explain_business_tax (dashboard admin settings), NOT explain_checkout_total (line-item total breakdown), NOT explain_stripe_checkout_currency (charge currency), NOT explain_checkout_currency (price currency symbols), and NOT explain_consumer_checkout_tax (logged-in consumer app).
- Examples:
  - "Why was tax added at checkout?" → explain_checkout_tax, aspect=checkout
  - "What does incl. VAT mean on the service cards?" → explain_checkout_tax, aspect=service_list
  - "Why do I see a tax line on the booking page?" → explain_checkout_tax, aspect=checkout
  - "Explain the tax breakdown before I confirm on this page" → explain_checkout_tax, aspect=confirmation
  - "Why do I see GST and PST tax lines when paying on this booking page?" → explain_checkout_tax, aspect=checkout
  - "Почему на странице записи добавлен налог?" → explain_checkout_tax
  - "Что значит incl. VAT на карточках услуг?" → explain_checkout_tax, aspect=service_list
  - "Ինչու է հարկը ավելացվում checkout-ում" → explain_checkout_tax`;

export type CheckoutTaxAspect =
  | 'checkout'
  | 'confirmation'
  | 'service_list'
  | 'all';

export const EXPLAIN_CHECKOUT_TAX_PROMPTS = [
  {
    id: 'why-tax-added-checkout',
    prompt: 'Why was tax added at checkout?',
    aspect: 'checkout' as const,
  },
  {
    id: 'what-incl-vat-means',
    prompt: 'What does incl. VAT mean on the service cards?',
    aspect: 'service_list' as const,
  },
  {
    id: 'tax-line-booking-page',
    prompt: 'Why do I see a tax line on the booking page?',
    aspect: 'checkout' as const,
  },
  {
    id: 'why-vat-on-prices',
    prompt: 'Why is VAT shown on these booking prices?',
    aspect: 'service_list' as const,
  },
  {
    id: 'inclusive-badge-help',
    prompt: 'What does the incl. GST badge on services mean?',
    aspect: 'service_list' as const,
  },
  {
    id: 'payment-summary-gst-booking-page',
    prompt: 'Why does the payment summary show GST on this booking page?',
    aspect: 'checkout' as const,
  },
  {
    id: 'confirmation-tax-breakdown-booking',
    prompt:
      'Explain the tax breakdown on the booking confirmation step before I pay',
    aspect: 'confirmation' as const,
  },
  {
    id: 'stacked-tax-lines-checkout-page',
    prompt:
      'Why do I see GST and PST tax lines when paying on this booking page?',
    aspect: 'checkout' as const,
  },
  {
    id: 'incl-badge-service-cards-page',
    prompt: 'What is the incl. badge on service cards on this page?',
    aspect: 'service_list' as const,
  },
  {
    id: 'ru-why-tax-booking-page',
    prompt: 'Почему на странице записи добавлен налог?',
    aspect: 'checkout' as const,
  },
  {
    id: 'ru-what-incl-vat',
    prompt: 'Что значит incl. VAT на карточках услуг?',
    aspect: 'service_list' as const,
  },
  {
    id: 'hy-why-tax-checkout',
    prompt: 'Ինչու է հարկը ավելացվում checkout-ում',
    aspect: 'checkout' as const,
  },
  {
    id: 'hy-what-incl-vat',
    prompt: 'Ինչ է նշանակում incl. VAT-ը ծառայության քարտերում',
    aspect: 'service_list' as const,
  },
  {
    id: 'explain-tax-before-pay',
    prompt: 'Explain why tax is added before I pay on this page',
    aspect: 'checkout' as const,
  },
] as const;
