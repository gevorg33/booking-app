export const CHECKOUT_QUOTE_AND_CONFIRM_INTENTS = [
  'get_booking_quote',
  'get_package_quote',
  'get_multi_service_quote',
  'confirm_stripe_payment',
] as const;

export type CheckoutQuoteAndConfirmIntent =
  (typeof CHECKOUT_QUOTE_AND_CONFIRM_INTENTS)[number];

export const CHECKOUT_QUOTE_AND_CONFIRM_CLASSIFIER_RULES = `- get_booking_quote: READ — calculate the live price for a single service booking, applying a promo code and/or redeemed loyalty points when provided. Triggers: "How much would this cost with my points?", "Apply code SAVE10 and tell me the total", "What's the price after my discount?". Requires serviceName or serviceId; set promoCode and/or loyaltyPointsToRedeem when named. NOT explain_service_price (static catalog price, no promo/loyalty), NOT explain_checkout_total (session checkout summary), NOT promo_code_help (only validates a code exists, no live total).
- get_package_quote: READ — calculate the live price for a package/bundle purchase, applying promo/loyalty. Triggers: "How much is the spa day package with code SAVE10?", "What do I owe for the wellness package after points?". Requires packageId or packageName. NOT explain_package_savings (à la carte comparison, not a live checkout total), NOT book_package (mutate purchase).
- get_multi_service_quote: READ — calculate the live combined price for two or more services booked together in one visit, applying promo/loyalty. Triggers: "What would massage and facial cost together with my discount?", "Total for these cart services after points". Requires serviceNames (≥2) or cartServiceIds. NOT preview_multi_service_cart (duration/base total, no promo/loyalty pipeline), NOT get_booking_quote (single service).
- confirm_stripe_payment: MUTATE — explicitly confirm/finalize a Stripe payment after returning from checkout with a completed session, creating the real booking from the paid draft. Triggers: "Confirm my payment", "I already paid, finish my booking", "My Stripe checkout says complete, confirm it". Requires sessionId (usually carried in session/return-url context, not typed by the user). NOT pay_online (starts checkout), NOT choose_payment_method (picks a method before paying).`;

export type CheckoutQuoteAndConfirmPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: CheckoutQuoteAndConfirmIntent;
  rescueReason: string;
  serviceName?: string;
  packageName?: string;
  serviceNames?: string[];
};

export const CHECKOUT_QUOTE_AND_CONFIRM_PROMPTS: readonly CheckoutQuoteAndConfirmPromptFixture[] =
  [
    {
      id: 'quote-service-with-promo-public',
      prompt: 'Apply code SAVE10 and tell me the total for a haircut',
      surface: 'public',
      expectedAction: 'get_booking_quote',
      rescueReason: 'booking_quote',
      serviceName: 'haircut',
    },
    {
      id: 'quote-service-with-points-customer',
      prompt: 'How much would massage cost with my loyalty points?',
      surface: 'customer',
      expectedAction: 'get_booking_quote',
      rescueReason: 'booking_quote',
      serviceName: 'massage',
    },
    {
      id: 'quote-package-with-code-public',
      prompt: 'How much is the spa day package with code SAVE10?',
      surface: 'public',
      expectedAction: 'get_package_quote',
      rescueReason: 'package_quote',
      packageName: 'Spa Day',
    },
    {
      id: 'quote-package-points-customer',
      prompt: 'What do I owe for the wellness package after my points?',
      surface: 'customer',
      expectedAction: 'get_package_quote',
      rescueReason: 'package_quote',
      packageName: 'wellness package',
    },
    {
      id: 'quote-multi-service-discount-public',
      prompt: 'What would massage and facial cost together with my discount?',
      surface: 'public',
      expectedAction: 'get_multi_service_quote',
      rescueReason: 'multi_service_quote',
      serviceNames: ['massage', 'facial'],
    },
    {
      id: 'quote-cart-total-after-points-customer',
      prompt: 'Total for these cart services after my points',
      surface: 'customer',
      expectedAction: 'get_multi_service_quote',
      rescueReason: 'multi_service_quote',
    },
    {
      id: 'confirm-payment-public',
      prompt: 'Confirm my payment, I already paid',
      surface: 'public',
      expectedAction: 'confirm_stripe_payment',
      rescueReason: 'confirm_payment',
    },
    {
      id: 'confirm-checkout-complete-customer',
      prompt: 'My Stripe checkout says complete, confirm it',
      surface: 'customer',
      expectedAction: 'confirm_stripe_payment',
      rescueReason: 'confirm_payment',
    },
  ];
