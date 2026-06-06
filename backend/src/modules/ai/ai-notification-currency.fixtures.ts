/** Customer classifier rules for notification channel currency display (ai-cmd-curr-9). */
export const NOTIFICATION_CURRENCY_CLASSIFIER_RULES = `- explain_notification_currency: READ — explain why confirmation/reminder/gift-card email or WhatsApp/SMS shows € / ֏ / ₽ / $ on the amount line. Currency symbol resolves from the booked service catalog ISO code (fallback to salon business default); the number reflects amount paid or quoted when the message was sent. Monetary gift-card preset emails use the business default. NOT explain_tenant_currency (consumer app prices), NOT explain_checkout_currency (public booking page), NOT explain_package_currency (package/gift-card checkout totals on the booking page), and NOT order_status_notifications (gift-card shipping status without currency).
- Examples:
  - "Why does my booking confirmation email show euros (€)?" → explain_notification_currency
  - "Why is the amount in dram (֏) on my appointment reminder?" → explain_notification_currency
  - "What currency is shown in the WhatsApp confirmation message?" → explain_notification_currency
  - "Why does the gift card purchase email show dollars?" → explain_notification_currency
  - "Почему в письме подтверждения цена в евро?" → explain_notification_currency
  - "Ինչու է հաստատման նամակում գինը ցուցադրվում դրամով" → explain_notification_currency`;

export const EXPLAIN_NOTIFICATION_CURRENCY_PROMPTS = [
  {
    id: 'why-euro-confirmation-email',
    prompt: 'Why does my booking confirmation email show euros (€)?',
  },
  {
    id: 'why-dram-reminder',
    prompt: 'Why is the amount in dram (֏) on my appointment reminder?',
  },
  {
    id: 'what-currency-whatsapp',
    prompt: 'What currency is shown in the WhatsApp confirmation message?',
  },
  {
    id: 'why-ruble-reminder-text',
    prompt: 'Why does the reminder text show rubles (₽)?',
  },
  {
    id: 'why-different-symbol-email',
    prompt:
      'Why did my confirmation email show a different currency symbol than the website?',
  },
  {
    id: 'why-dollar-gift-card-email',
    prompt: 'Why does the gift card purchase email show dollars?',
  },
  {
    id: 'ru-why-euro-confirmation-email',
    prompt: 'Почему в письме подтверждения цена в евро?',
  },
  {
    id: 'ru-what-currency-whatsapp-reminder',
    prompt: 'В какой валюте пришло напоминание в WhatsApp?',
  },
  {
    id: 'hy-why-dram-confirmation-email',
    prompt: 'Ինչու է հաստատման նամակում գինը ցուցադրվում դրամով',
  },
  {
    id: 'hy-what-currency-sms',
    prompt: 'Որ արժույթով է գումարը SMS հաստատման հաղորդագրության մեջ',
  },
] as const;
