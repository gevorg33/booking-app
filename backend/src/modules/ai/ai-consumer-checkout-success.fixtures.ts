/** Consumer app classifier rules for post-booking success screen (ai-cmd-rec-6). */
export const CONSUMER_CHECKOUT_SUCCESS_CLASSIFIER_RULES = `- explain_consumer_checkout_success: READ — explain the consumer app booking confirmation / success screen after checkout (rec-1.6): green checkmark and "Booking confirmed!", booked date/time range, manage-from-account hint, optional payment summary, "View appointments" and "Book another service" actions, and when the "You might also like" product section appears (loaded products, not dismissed, up to max count). Customer/consumer app only. Uses session bookingId/serviceId when available. NOT explain_checkout_recommendations (which products, why chosen, shop links), NOT list_my_appointments or my_appointments (navigate to appointments), NOT book_appointment (book another now), and NOT explain_recommendation_setup (dashboard admin).
- Examples:
  - "Explain the booking success screen in the consumer app after I confirm" → explain_consumer_checkout_success, aspect=all
  - "What is shown on the booking confirmed screen in the salon app?" → explain_consumer_checkout_success, aspect=summary
  - "What does View appointments do on the success screen in the app?" → explain_consumer_checkout_success, aspect=actions
  - "What does Book another service do after confirming in the consumer app?" → explain_consumer_checkout_success, aspect=actions
  - "When do product cards appear on checkout success in the consumer app?" → explain_consumer_checkout_success, aspect=recommendations
  - "When is the You might also like section shown after booking in the app?" → explain_consumer_checkout_success, aspect=recommendations
  - "Walk me through the consumer app screen after I finish booking" → explain_consumer_checkout_success, aspect=all
  - "What does Dismiss recommendations do on the app success screen?" → explain_consumer_checkout_success, aspect=dismiss`;

export const EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS = [
  {
    id: 'explain-success-screen-all',
    prompt:
      'Explain the booking success screen in the consumer app after I confirm',
    aspect: 'all' as const,
  },
  {
    id: 'what-shown-confirmed',
    prompt:
      'What is shown on the booking confirmed screen in the salon app?',
    aspect: 'summary' as const,
  },
  {
    id: 'confirmation-summary',
    prompt:
      "What's on the confirmation summary after I book in the app?",
    aspect: 'summary' as const,
  },
  {
    id: 'green-checkmark',
    prompt:
      'What does the green checkmark mean after booking in the consumer app?',
    aspect: 'summary' as const,
  },
  {
    id: 'time-range-display',
    prompt:
      'How is my appointment time shown on the success screen in the app?',
    aspect: 'summary' as const,
  },
  {
    id: 'manage-from-account-hint',
    prompt:
      'What does you can manage this appointment from your account mean on the app success screen?',
    aspect: 'summary' as const,
  },
  {
    id: 'view-appointments-button',
    prompt:
      'What does View appointments do on the booking success screen in the app?',
    aspect: 'actions' as const,
  },
  {
    id: 'book-another-button',
    prompt:
      'What does Book another service do after confirming in the consumer app?',
    aspect: 'actions' as const,
  },
  {
    id: 'next-steps-success',
    prompt:
      'What can I do next on the checkout success screen in the salon app?',
    aspect: 'actions' as const,
  },
  {
    id: 'when-product-cards-appear',
    prompt:
      'When do product cards appear on checkout success in the consumer app?',
    aspect: 'recommendations' as const,
  },
  {
    id: 'when-section-shown',
    prompt:
      'When is the You might also like section shown after booking in the app?',
    aspect: 'recommendations' as const,
  },
  {
    id: 'no-recommendations-section',
    prompt:
      'Why is there no recommendations section on my success screen in the app?',
    aspect: 'recommendations' as const,
  },
  {
    id: 'payment-summary-on-success',
    prompt:
      'Is there a payment summary on the booking confirmed screen in the consumer app?',
    aspect: 'summary' as const,
  },
  {
    id: 'success-screen-walkthrough',
    prompt:
      'Walk me through the consumer app screen after I finish booking',
    aspect: 'all' as const,
  },
  {
    id: 'cards-before-buttons',
    prompt:
      'Do product cards appear before the action buttons on success in the app?',
    aspect: 'recommendations' as const,
  },
] as const;
