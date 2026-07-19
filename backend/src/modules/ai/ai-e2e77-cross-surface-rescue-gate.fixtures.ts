/**
 * e2e-bug.77 — customer/public prompts were rescued into provider/dashboard-only
 * intents and then security_blocked instead of the real customer action.
 */
export const E2E77_CROSS_SURFACE_SCENARIOS = [
  {
    id: 'e2e77-cancel-all-not-list-upcoming',
    prompt: 'cancel all my upcoming bookings',
    surface: 'customer' as const,
    expectedAction: 'cancel_all_upcoming_bookings' as const,
    blockedActions: ['list_upcoming_bookings'] as const,
  },
  {
    id: 'e2e77-cancel-all-public',
    prompt: 'cancel all my upcoming bookings',
    surface: 'public' as const,
    expectedAction: 'cancel_all_upcoming_bookings' as const,
    blockedActions: ['list_upcoming_bookings'] as const,
  },
  {
    id: 'e2e77-manage-link-not-push-lab',
    prompt: 'send me the manage link for my booking',
    surface: 'customer' as const,
    expectedAction: 'get_manage_link' as const,
    blockedActions: ['push_lab_booking_to_patient'] as const,
  },
  {
    id: 'e2e77-package-rules-not-create-package',
    prompt: 'what are the rules for using my package visits?',
    surface: 'customer' as const,
    expectedAction: 'explain_package_visit_rules' as const,
    blockedActions: ['create_package_booking'] as const,
  },
  {
    id: 'e2e77-gift-cancel-not-staff-cancel',
    prompt: 'please cancel gift card order QATEST-REDEEMED-001',
    surface: 'customer' as const,
    expectedAction: 'request_gift_card_cancel' as const,
    blockedActions: ['cancel_gift_card_order'] as const,
  },
] as const;

/** Provider schedule-read still works on the provider surface. */
export const E2E77_PROVIDER_STILL_MATCHES = [
  {
    id: 'e2e77-provider-upcoming-bookings',
    prompt: "what's coming up on my schedule?",
    expectedAction: 'list_upcoming_bookings' as const,
  },
] as const;
