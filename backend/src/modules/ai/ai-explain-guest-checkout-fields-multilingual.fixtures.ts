import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { GuestCheckoutFieldsIntent } from './ai-explain-guest-checkout-fields.util.js';

export type ExplainGuestCheckoutFieldsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: GuestCheckoutFieldsIntent;
  rescueReason: 'guest_checkout_fields';
  paramsPartial?: Record<string, unknown>;
};

export const EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian guest checkout contact fields (customer app + public booking page):
  - explain_guest_checkout_fields: hy «ինչու է հարկավոր էլ. փոստ», «պետք է՞ և՛ հեռախոս, և՛ էլ. փոստ»; ru «зачем нужен email», «нужны ли и телефон, и email». Guest contact merge — NOT explain_why_sign_in (account benefits) and NOT explain_data_rights and NOT booking_help funnel walkthrough.`;

export const EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_SCENARIOS: ExplainGuestCheckoutFieldsMultilingualScenario[] =
  [
    {
      id: 'why-email-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու է հարկավոր էլ. փոստ checkout-ում',
      surface: 'customer',
      expectedAction: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'email-or-phone-hy-public',
      locale: 'hy',
      prompt: 'Պետք է՞ և՛ հեռախոս, և՛ էլ. փոստ checkout-ում',
      surface: 'public',
      expectedAction: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
      paramsPartial: { aspect: 'all' },
    },
    {
      id: 'why-email-ru-customer',
      locale: 'ru',
      prompt: 'Зачем нужен email при записи?',
      surface: 'customer',
      expectedAction: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'email-or-phone-ru-public',
      locale: 'ru',
      prompt: 'Нужны ли и телефон, и email на checkout?',
      surface: 'public',
      expectedAction: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
      paramsPartial: { aspect: 'all' },
    },
    {
      id: 'why-email-hy-public',
      locale: 'hy',
      prompt: 'Ինչու է հարկավոր էլ. փոստ այս էջում',
      surface: 'public',
      expectedAction: 'explain_guest_checkout_fields',
      rescueReason: 'guest_checkout_fields',
      paramsPartial: { aspect: 'email' },
    },
  ];
