/**
 * Anonymous public-booking assistant intents routed via
 * PublicBookingAssistantService. Documented in `ai-capability.matrix.ts` as
 * `CUSTOMER_PUBLIC_DELEGATED_INTENTS`.
 *
 * Kept in a leaf module (no registry / access-control imports) so the public
 * orchestration gate can fall back here when a circular-init race leaves
 * `PUBLIC_ASSISTANT_INTENTS` undefined (e2e-bug.90 / e2e-bug.1).
 */
export const PUBLIC_ONLY_ASSISTANT_ACTIONS = [
  'list_providers',
  'list_services',
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'check_availability',
  'explain_provider_availability',
  'recommend_specialists',
  'business_info',
  'book_appointment',
  'booking_help',
  'preview_multi_service_cart',
  'list_public_promotions',
  'list_provider_reviews',
  'suggest_package_block',
] as const;

export type PublicOnlyAssistantAction =
  (typeof PUBLIC_ONLY_ASSISTANT_ACTIONS)[number];

export function isPublicOnlyAssistantAction(
  action: string,
): action is PublicOnlyAssistantAction {
  return (PUBLIC_ONLY_ASSISTANT_ACTIONS as readonly string[]).includes(action);
}