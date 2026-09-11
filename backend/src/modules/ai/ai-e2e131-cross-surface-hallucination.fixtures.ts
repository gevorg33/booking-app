/**
 * e2e-bug.131 — customer/public prompts must not stay on dashboard/provider/tour
 * action names that then security_blocked ("cannot perform …").
 */
export const E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS = [
  {
    id: 'remove-manicure-from-cart',
    prompt: 'Remove the manicure from my cart',
    expectedAction: 'remove_service_from_cart' as const,
    misclassifiedAction: 'unassign_employee_services' as const,
    surface: 'public' as const,
  },
  {
    id: 'remove-manicure-from-cart-customer',
    prompt: 'Remove the manicure from my cart',
    expectedAction: 'remove_service_from_cart' as const,
    misclassifiedAction: 'unassign_employee_services' as const,
    surface: 'customer' as const,
  },
  {
    id: 'remove-facial-cart-retail-steal',
    prompt: 'Remove facial from cart',
    expectedAction: 'remove_service_from_cart' as const,
    // Provider retail undo used to steal this before surface gating.
    misclassifiedAction: 'remove_retail_from_booking' as const,
    surface: 'customer' as const,
  },
  {
    id: 'leave-visit-review-not-reviews-inbox',
    prompt: 'I want to leave a 5-star review for my last visit, it was great',
    expectedAction: 'leave_visit_review' as const,
    misclassifiedAction: 'explain_reviews_inbox' as const,
    surface: 'customer' as const,
  },
  {
    id: 'guest-checkout-not-tour-services',
    prompt: 'Why do you need my email and phone number to book as a guest?',
    expectedAction: 'explain_guest_checkout_fields' as const,
    misclassifiedAction: 'explain_tour_services' as const,
    surface: 'public' as const,
  },
] as const;

export const E2E131_PROVIDER_RETAIL_CART_STILL_MATCH = [
  {
    id: 'serum-from-cart',
    prompt: 'Remove the serum from cart',
  },
  {
    id: 'shampoo-from-booking',
    prompt: 'Remove shampoo from this booking',
  },
] as const;
