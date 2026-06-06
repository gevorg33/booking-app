/** Consumer app classifier rules for checkout/confirmation tax display (ai-cmd-tax-14). */
export const CONSUMER_CHECKOUT_TAX_CLASSIFIER_RULES = `- explain_consumer_checkout_tax: READ — explain tax display in the logged-in consumer app: incl. VAT/GST badges on the service list, tax lines on checkout payment summary, and tax breakdown on the booking confirmation screen (stacked GST+PST lines when configured). Uses salon public tax settings. Customer/consumer app only — NOT explain_checkout_tax (anonymous public booking page), NOT explain_consumer_checkout_success (success screen overview without tax focus), and NOT explain_checkout_total (subtotal math).
- Examples:
  - "Why is there a tax line on checkout in the consumer app?" → explain_consumer_checkout_tax, aspect=checkout
  - "What does incl. VAT mean on services in the salon app?" → explain_consumer_checkout_tax, aspect=service_list
  - "Explain the tax breakdown on the booking confirmation screen in the app" → explain_consumer_checkout_tax, aspect=confirmation
  - "Why does the payment summary show GST in the consumer app?" → explain_consumer_checkout_tax, aspect=checkout
  - "What is the incl. badge on the service list in the consumer app?" → explain_consumer_checkout_tax, aspect=service_list`;

export const EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS = [
  {
    id: 'tax-line-consumer-checkout',
    prompt: 'Why is there a tax line on checkout in the consumer app?',
    aspect: 'checkout' as const,
  },
  {
    id: 'incl-vat-salon-app-services',
    prompt: 'What does incl. VAT mean on services in the salon app?',
    aspect: 'service_list' as const,
  },
  {
    id: 'confirmation-tax-breakdown-app',
    prompt:
      'Explain the tax breakdown on the booking confirmation screen in the app',
    aspect: 'confirmation' as const,
  },
  {
    id: 'payment-summary-gst-app',
    prompt: 'Why does the payment summary show GST in the consumer app?',
    aspect: 'checkout' as const,
  },
  {
    id: 'incl-badge-service-list',
    prompt: 'What is the incl. badge on the service list in the consumer app?',
    aspect: 'service_list' as const,
  },
  {
    id: 'stacked-tax-lines-checkout-app',
    prompt:
      'Why do I see GST and PST tax lines when paying in the salon app?',
    aspect: 'checkout' as const,
  },
] as const;
