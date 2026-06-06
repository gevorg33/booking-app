import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ConsumerCheckoutTaxAspect } from './ai-consumer-checkout-tax.util.js';

export type TaxDisplayEvalAction =
  | 'explain_appointment_tax'
  | 'quote_staff_booking_tax'
  | 'summarize_customer_tax_paid'
  | 'explain_consumer_checkout_tax';

export interface TaxDisplayEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: TaxDisplayEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  aspect?: ConsumerCheckoutTaxAspect;
}

/** EN classifier rules disambiguating provider/dashboard/consumer tax display READ intents (ai-cmd-tax-15). */
export const TAX_DISPLAY_EN_CLASSIFIER_RULES = `- Tax display READ intents (English surface disambiguation):
  - explain_appointment_tax (provider app): tax lines on the appointment payment breakdown — collected amount, marked paid, appointment detail, provider/staff view. NOT quote_staff_booking_tax (preview before staff creates booking), NOT summarize_customer_tax_paid (customer history total), NOT explain_consumer_checkout_tax (logged-in consumer app).
  - quote_staff_booking_tax (dashboard): preview/quote tax on a catalog service before staff creates a booking — "before creating", "preview", "estimate", "staff booking", service override vs stacked rules. NOT explain_appointment_tax (provider collected payment), NOT summarize_customer_tax_paid (customer history), NOT explain_business_tax (settings only).
  - summarize_customer_tax_paid (dashboard): total tax paid across a customer's paid appointment history from profile metadata — customer name + across appointments/history/profile. NOT quote_staff_booking_tax (single service preview), NOT lookup_booking_tax_metadata (one booking snapshot), NOT explain_appointment_tax (provider view).
  - explain_consumer_checkout_tax (consumer app): incl. VAT/GST badge on service list, tax lines on checkout payment summary, confirmation tax breakdown — consumer app, salon app, in the app. NOT explain_checkout_tax (public booking page), NOT explain_consumer_checkout_success (success overview without tax focus), NOT explain_appointment_tax (provider).
  - Examples:
    - "Walk me through the tax lines on this appointment after we marked it paid" → explain_appointment_tax
    - "Before I create the booking, what tax would apply to a $90 facial?" → quote_staff_booking_tax
    - "Across Jane's paid visits, how much VAT did she pay in total?" → summarize_customer_tax_paid
    - "In the salon app, why does checkout show a separate GST line?" → explain_consumer_checkout_tax, aspect=checkout
    - "What does the incl. badge on service cards mean in the consumer app?" → explain_consumer_checkout_tax, aspect=service_list`;

export const EN_TAX_DISPLAY_EVAL_SCENARIOS: TaxDisplayEvalScenario[] = [
  {
    id: 'en-provider-appointment-tax-lines',
    locale: 'en',
    prompt:
      'Walk me through the tax lines on this appointment after we marked it paid',
    expectedAction: 'explain_appointment_tax',
    rescueReason: 'explain_appointment_tax',
  },
  {
    id: 'en-provider-vat-collected-breakdown',
    locale: 'en',
    prompt:
      'On this appointment payment breakdown, is VAT included in what we collected?',
    expectedAction: 'explain_appointment_tax',
    rescueReason: 'explain_appointment_tax',
  },
  {
    id: 'en-dashboard-preview-before-booking',
    locale: 'en',
    prompt:
      'Before I create the booking, what tax would apply to a $90 facial?',
    expectedAction: 'quote_staff_booking_tax',
    rescueReason: 'quote_staff_booking_tax',
  },
  {
    id: 'en-dashboard-staff-quote-stacked',
    locale: 'en',
    prompt:
      'For staff booking a haircut, quote GST and PST before we save the appointment',
    expectedAction: 'quote_staff_booking_tax',
    rescueReason: 'quote_staff_booking_tax',
  },
  {
    id: 'en-dashboard-customer-tax-history',
    locale: 'en',
    prompt: "Across Jane's paid visits, how much VAT did she pay in total?",
    expectedAction: 'summarize_customer_tax_paid',
    rescueReason: 'summarize_customer_tax_paid',
  },
  {
    id: 'en-dashboard-profile-tax-total',
    locale: 'en',
    prompt:
      'From customer profile metadata, what is the total tax Maria paid on appointments?',
    expectedAction: 'summarize_customer_tax_paid',
    rescueReason: 'summarize_customer_tax_paid',
  },
  {
    id: 'en-consumer-checkout-gst-line',
    locale: 'en',
    prompt:
      'In the salon app, why does checkout show a separate GST line on the payment summary?',
    expectedAction: 'explain_consumer_checkout_tax',
    rescueReason: 'explain_consumer_checkout_tax',
    aspect: 'checkout',
  },
  {
    id: 'en-consumer-incl-badge-services',
    locale: 'en',
    prompt:
      'What does the incl. badge on service cards mean in the consumer app?',
    expectedAction: 'explain_consumer_checkout_tax',
    rescueReason: 'explain_consumer_checkout_tax',
    aspect: 'service_list',
  },
  {
    id: 'en-consumer-confirmation-breakdown',
    locale: 'en',
    prompt:
      'After paying in the consumer app, explain the tax breakdown on the confirmation screen',
    expectedAction: 'explain_consumer_checkout_tax',
    rescueReason: 'explain_consumer_checkout_tax',
    aspect: 'confirmation',
  },
  {
    id: 'en-consumer-vs-public-disambiguation',
    locale: 'en',
    prompt:
      'Why is there tax on checkout in the consumer app but not on the public website?',
    expectedAction: 'explain_consumer_checkout_tax',
    rescueReason: 'explain_consumer_checkout_tax',
    aspect: 'checkout',
  },
];
