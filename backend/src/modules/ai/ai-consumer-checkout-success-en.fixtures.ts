import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ConsumerCheckoutSuccessAspect } from './ai-consumer-checkout-success.util.js';

export type ConsumerCheckoutSuccessEvalAction =
  'explain_consumer_checkout_success';

export interface ConsumerCheckoutSuccessEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ConsumerCheckoutSuccessEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  aspect?: ConsumerCheckoutSuccessAspect;
}

/** Supplementary EN classifier rules for consumer success screen paraphrases and dismiss (ai-cmd-rec-7). */
export const CONSUMER_CHECKOUT_SUCCESS_EN_CLASSIFIER_RULES = `- Consumer app checkout success + dismiss (English paraphrases, customer only):
  - explain_consumer_checkout_success: READ — success screen overview, confirmed summary, View appointments / Book another service, when You might also like appears, and Dismiss recommendations (X icon hides the section for this visit without cancelling the booking). Triggers: after I confirm/book in the app/salon app; what is on the success/confirmation screen; what does View appointments or Book another service do; when do product cards or You might also like show; dismiss/hide/close recommendations; what does the X or Dismiss recommendations button do; why did recommendations disappear. NOT explain_checkout_recommendations (which products, why chosen, shop links), NOT list_my_appointments (navigate), and NOT bare imperative "Dismiss recommendations" without a question/explain cue.
  - Examples:
    - "What should I see right after confirming in the salon app?" → explain_consumer_checkout_success, aspect=summary
    - "How do I get from the success screen to my appointments in the app?" → explain_consumer_checkout_success, aspect=actions
    - "What does Dismiss recommendations do on the app success screen?" → explain_consumer_checkout_success, aspect=dismiss
    - "How do I hide You might also like after booking in the consumer app?" → explain_consumer_checkout_success, aspect=dismiss
    - "What happens when I dismiss the product cards on checkout success in the app?" → explain_consumer_checkout_success, aspect=dismiss
    - "Does dismissing recommendations cancel my booking in the app?" → explain_consumer_checkout_success, aspect=dismiss
    - "Why did the recommended products section disappear on the success screen?" → explain_consumer_checkout_success, aspect=dismiss`;

export const EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS: ConsumerCheckoutSuccessEvalScenario[] =
  [
    {
      id: 'en-after-confirm-what-see',
      locale: 'en',
      prompt:
        'What should I see right after confirming a booking in the salon app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'summary',
    },
    {
      id: 'en-confirmation-page-overview',
      locale: 'en',
      prompt: 'Tell me about the confirmation page in the consumer app',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'summary',
    },
    {
      id: 'en-success-to-appointments',
      locale: 'en',
      prompt:
        'How do I get from the success screen to my appointments in the app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'actions',
    },
    {
      id: 'en-start-another-booking',
      locale: 'en',
      prompt:
        'How do I start another booking from the success screen in the app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'actions',
    },
    {
      id: 'en-dismiss-button-meaning',
      locale: 'en',
      prompt: 'What does Dismiss recommendations do on the app success screen?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-hide-you-might-also-like',
      locale: 'en',
      prompt:
        'How do I hide You might also like after booking in the consumer app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-dismiss-product-cards',
      locale: 'en',
      prompt:
        'What happens when I dismiss the product cards on checkout success in the app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-close-recommendations-section',
      locale: 'en',
      prompt:
        'Can I close the recommendations section on the app success screen?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-x-button-recommendations',
      locale: 'en',
      prompt:
        'What is the X button on You might also like in the consumer app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-dismiss-come-back',
      locale: 'en',
      prompt:
        'If I dismiss recommendations on the success screen in the app, do they come back?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-dismiss-cancel-booking',
      locale: 'en',
      prompt:
        'Does dismissing recommendations cancel my booking in the consumer app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-section-disappeared',
      locale: 'en',
      prompt:
        'Why did the recommended products section disappear on the success screen in the app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-after-hide-what-stays',
      locale: 'en',
      prompt:
        'What stays on screen after I hide recommendations in the consumer app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-explain-close-button',
      locale: 'en',
      prompt:
        'Explain the close button on recommended products after I book in the app',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
    {
      id: 'en-you-might-also-like-hidden',
      locale: 'en',
      prompt:
        'When is You might also like hidden on checkout success in the salon app?',
      expectedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      aspect: 'dismiss',
    },
  ] as const;
