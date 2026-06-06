import type { SharedEntityParamId } from './ai-command-entity-params.types.js';

/** Intents that accept each shared entity param (subset of command registry). */
const PARAM_INTENT_BINDINGS: ReadonlyArray<{
  param: SharedEntityParamId;
  intents: readonly string[];
}> = [
  {
    param: 'packageId',
    intents: [
      'create_package_booking',
      'cancel_package_visit',
      'reschedule_package_visit',
      'list_package_bookings',
      'list_package_appointments_today',
      'list_my_package_visits',
      'check_package_availability',
      'check_package_line_availability',
      'book_package',
      'cancel_package_visit_self',
      'reschedule_package_visit_self',
      'create_package',
      'update_package',
      'deactivate_package',
      'duplicate_package',
      'list_packages',
      'discover_packages',
      'describe_package_includes',
      'configure_package_localized_names',
    ],
  },
  {
    param: 'packagePurchaseId',
    intents: [
      'cancel_package_visit',
      'reschedule_package_visit',
      'cancel_package_visit_self',
      'reschedule_package_visit_self',
      'list_my_package_visits',
    ],
  },
  {
    param: 'multiServiceGroupId',
    intents: [
      'cancel_multi_service_group',
      'reschedule_multi_service_group',
      'list_multi_service_bookings',
      'list_my_multi_service_groups',
      'book_multi_service',
      'create_multi_service_booking',
    ],
  },
  {
    param: 'subscriptionPlanId',
    intents: [
      'create_subscription_plan',
      'update_subscription_plan',
      'deactivate_subscription_plan',
      'select_subscription_plan',
      'purchase_subscription_checkout',
      'discover_subscription_plans',
      'list_subscription_plans',
      'list_subscription_plans_for_service',
      'assign_subscription_to_customer',
    ],
  },
  {
    param: 'customerSubscriptionId',
    intents: [
      'extend_subscription',
      'cancel_subscription_admin',
      'subscription_usage_history',
      'use_subscription_credit',
      'create_booking_subscription_credit',
      'my_subscriptions',
      'subscription_usage',
    ],
  },
  {
    param: 'giftCardCode',
    intents: [
      'validate_gift_card',
      'adjust_gift_card_balance',
      'apply_gift_card_code',
      'check_gift_card_balance',
      'book_with_gift_card',
      'buy_gift_card',
      'gift_card_balance',
    ],
  },
  {
    param: 'giftCardOrderId',
    intents: [
      'refund_gift_card_order',
      'track_physical_gift_card_order',
      'open_ticket_for_order',
      'contact_support',
      'filter_awaiting_creation',
      'gift_card_creation_queue',
      'mark_shipped',
      'mark_delivered',
    ],
  },
  {
    param: 'resourceId',
    intents: [
      'assign_booking_resource',
      'create_resource',
      'update_resource',
      'deactivate_resource',
      'assign_resource_hours',
      'list_resource_conflicts',
      'explain_resource_conflict',
      'my_resource_assignments',
      'block_resource_unavailable',
    ],
  },
  {
    param: 'locationId',
    intents: [
      'list_bookings',
      'show_appointments',
      'summarize_bookings',
      'summarize_day',
      'list_cash_pending_bookings',
      'summarize_unpaid',
      'export_accounting',
      'export_commissions',
      'list_subscription_revenue',
    ],
  },
  {
    param: 'paymentMethod',
    intents: [
      'book_with_cash',
      'pay_cash_at_visit',
      'pay_online',
      'choose_payment_method',
      'mark_paid',
      'create_booking_cash',
      'book_with_gift_card',
      'collect_cash_confirm',
      'explain_checkout_total',
      'purchase_subscription_checkout',
    ],
  },
  {
    param: 'serviceIds',
    intents: [
      'check_multi_service_block_availability',
      'check_multi_service_availability',
      'book_multi_service',
      'create_multi_service_booking',
      'add_services_to_cart',
      'remove_service_from_cart',
      'earliest_slot_all_services',
      'show_cart_total_duration',
    ],
  },
  {
    param: 'categoryDraft',
    intents: ['bulk_create_catalog'],
  },
];

const INTENT_SHARED_PARAMS = new Map<
  string,
  ReadonlySet<SharedEntityParamId>
>();

for (const binding of PARAM_INTENT_BINDINGS) {
  for (const intentId of binding.intents) {
    const existing = new Set(INTENT_SHARED_PARAMS.get(intentId) ?? []);
    existing.add(binding.param);
    INTENT_SHARED_PARAMS.set(intentId, existing);
  }
}

/** Params that flow across compound steps when a later step omits them. */
export const SHARED_ENTITY_CROSS_STEP_KEYS: readonly SharedEntityParamId[] = [
  'packageId',
  'packagePurchaseId',
  'multiServiceGroupId',
  'subscriptionPlanId',
  'customerSubscriptionId',
  'giftCardCode',
  'giftCardOrderId',
  'resourceId',
  'locationId',
  'paymentMethod',
  'serviceIds',
];

/** Params persisted in session context for multi-turn / compound inheritance. */
export const SHARED_ENTITY_SESSION_INHERIT_KEYS: readonly SharedEntityParamId[] =
  [...SHARED_ENTITY_CROSS_STEP_KEYS];

export function getSharedParamsForIntent(
  intentId: string,
): ReadonlySet<SharedEntityParamId> {
  return INTENT_SHARED_PARAMS.get(intentId) ?? new Set();
}

export function intentAcceptsSharedParam(
  intentId: string,
  param: SharedEntityParamId,
): boolean {
  return getSharedParamsForIntent(intentId).has(param);
}

export function listIntentsForSharedParam(
  param: SharedEntityParamId,
): string[] {
  const binding = PARAM_INTENT_BINDINGS.find((entry) => entry.param === param);
  return binding ? [...binding.intents] : [];
}
