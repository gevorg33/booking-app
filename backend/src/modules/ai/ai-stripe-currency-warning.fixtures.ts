/** Dashboard classifier rules for Settings Stripe Connect currency warning (ai-cmd-curr-10). */
export const STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES = `- explain_stripe_currency_warning: READ — explain why Settings shows a Stripe Connect warning for the current business currency; list which ISO codes Stripe supports for online card payments; clarify that cash and pay-at-venue bookings are unaffected when online card checkout is unavailable. Warning appears when Stripe Connect is linked and the business default is outside Stripe's charge-currency list. NOT explain_business_currency (default currency overview or legacy service mismatch counts), NOT diagnose_stripe_checkout_failure (checkout session creation errors), and NOT explain_why_stripe_required (customer checkout requirement).
- Examples:
  - "Why does Settings show a Stripe Connect warning for our currency?" → explain_stripe_currency_warning
  - "Explain the Stripe warning on the business currency settings page" → explain_stripe_currency_warning
  - "Which ISO codes does Stripe support for online card payments?" → explain_stripe_currency_warning
  - "What currencies work for Stripe online checkout vs cash at the venue?" → explain_stripe_currency_warning
  - "Почему в настройках показывается предупреждение Stripe?" → explain_stripe_currency_warning
  - "Ինչու է Settings-ում Stripe նախազգուշացում ցուցադրվում" → explain_stripe_currency_warning`;

export const EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS = [
  {
    id: 'why-settings-stripe-warning',
    prompt: 'Why does Settings show a Stripe Connect warning for our currency?',
  },
  {
    id: 'explain-currency-settings-warning',
    prompt: 'Explain the Stripe warning on the business currency settings page',
  },
  {
    id: 'which-iso-stripe-online',
    prompt: 'Which ISO codes does Stripe support for online card payments?',
  },
  {
    id: 'why-no-online-card-stripe',
    prompt: "Why can't we charge cards online in this currency on Stripe?",
  },
  {
    id: 'stripe-vs-cash-venue',
    prompt:
      'What currencies work for Stripe online checkout vs cash at the venue?',
  },
  {
    id: 'stripe-connect-warning-meaning',
    prompt: 'Stripe Connect warning — what does it mean for our salon?',
  },
  {
    id: 'online-card-supported-list',
    prompt:
      'List the currencies Stripe accepts for online card payments in Settings',
  },
  {
    id: 'ru-settings-stripe-warning',
    prompt: 'Почему в настройках показывается предупреждение Stripe?',
  },
  {
    id: 'ru-stripe-online-currencies',
    prompt: 'Какие валюты Stripe поддерживает для онлайн-оплаты картой?',
  },
  {
    id: 'hy-settings-stripe-warning',
    prompt: 'Ինչու է Settings-ում Stripe նախազգուշացում ցուցադրվում',
  },
] as const;
