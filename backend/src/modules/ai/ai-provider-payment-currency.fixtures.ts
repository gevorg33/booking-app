/** Provider mobile classifier rules for appointment/POS payment currency (ai-cmd-curr-8). */
export const PROVIDER_PAYMENT_CURRENCY_CLASSIFIER_RULES = `- explain_provider_payment_currency: READ — explain why appointment payment breakdown or POS grand total shows € / ֏ / ₽ / $ in the provider app. Service line uses resolvePriceCurrency on the booked service ISO code (fallback to business default). Retail POS add-ons inherit the same currency as the appointment — products have no separate ISO code. NOT explain_payment_status (paid/pending/cash collection status) and NOT dashboard explain_business_currency.
- Examples:
  - "Why is the payment breakdown in euros for this appointment?" → explain_provider_payment_currency
  - "What currency is the POS total showing?" → explain_provider_payment_currency
  - "Why does the grand total show dram (֏) with a retail add-on?" → explain_provider_payment_currency
  - "Почему разбивка оплаты в рублях?" → explain_provider_payment_currency
  - "Ինչու է վճարման գումարը ցուցադրվում դրամով" → explain_provider_payment_currency`;

export const EXPLAIN_PROVIDER_PAYMENT_CURRENCY_PROMPTS = [
  {
    id: 'why-breakdown-euros',
    prompt: 'Why is the payment breakdown in euros for this appointment?',
  },
  {
    id: 'what-currency-pos-total',
    prompt: 'What currency is the POS total showing?',
  },
  {
    id: 'why-grand-total-dram',
    prompt: 'Why does the grand total show dram (֏) with a retail add-on?',
  },
  {
    id: 'why-appointment-rubles',
    prompt: 'Why is this appointment payment in rubles (₽)?',
  },
  {
    id: 'why-retail-pos-dollars',
    prompt:
      'Why does the POS total use dollar amounts for service plus retail?',
  },
  {
    id: 'why-collect-cash-currency',
    prompt:
      'What currency should I collect cash in for this booking breakdown?',
  },
  {
    id: 'ru-why-payment-ruble',
    prompt: 'Почему разбивка оплаты в рублях на кассе?',
  },
  {
    id: 'ru-pos-currency',
    prompt: 'В какой валюте показана сумма POS с допродажей?',
  },
  {
    id: 'hy-why-payment-dram',
    prompt: 'Ինչու է վճարման գումարը ցուցադրվում դրամով',
  },
  {
    id: 'hy-pos-total-currency',
    prompt: 'Որ արժույթով է ցուցադրվում POS-ի ընդհանուր գումարը',
  },
] as const;
