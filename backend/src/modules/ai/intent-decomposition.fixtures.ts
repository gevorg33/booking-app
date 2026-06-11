import type { CommandSurface } from './ai-command-registry.types.js';

export type CompoundScenarioExpectation = {
  id: string;
  surface: CommandSurface;
  prompt: string;
  /** Minimum expected sub-intents when decomposition succeeds. */
  minSteps?: number;
  /** Required action ids (subset) in any order. */
  actions?: string[];
  /** Exact ordered actions when stable. */
  orderedActions?: string[];
  /** Param assertions on a step index. */
  paramChecks?: Array<{ stepIndex: number; key: string; value?: unknown }>;
  /** When true, LLM must not be called (deterministic/golden path). */
  noLlm?: boolean;
  /** When true, decomposition should return empty. */
  expectEmpty?: boolean;
  /** Expected compound recipe id when stable. */
  compoundRecipeId?: string;
};

/** Documented compound scenarios for unit + integration coverage (ai-cmd-0.3). */
export const COMPOUND_DECOMPOSITION_SCENARIOS: CompoundScenarioExpectation[] = [
  {
    id: 'customer_golden_book_package_promo',
    surface: 'customer',
    prompt: 'Book spa day package for me and apply promo code SPRING25',
    orderedActions: ['book_package', 'promo_code_help'],
    paramChecks: [{ stepIndex: 1, key: 'promoCode', value: 'SPRING25' }],
    noLlm: true,
  },
  {
    id: 'customer_gift_card_checkout_compound',
    surface: 'customer',
    prompt:
      'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method',
    orderedActions: [
      'book_nearest_slot',
      'apply_gift_card_code',
      'choose_payment_method',
    ],
    noLlm: true,
  },
  {
    id: 'customer_physical_gift_card_handoff',
    surface: 'customer',
    prompt: 'Buy physical gift card $100 and track my order',
    orderedActions: [
      'buy_gift_card_physical',
      'track_physical_gift_card_order',
    ],
    noLlm: true,
  },
  {
    id: 'customer_availability_then_book_cash',
    surface: 'customer',
    prompt:
      'Check package availability and book spa day package with cash at visit',
    minSteps: 2,
    actions: ['check_package_availability', 'book_with_cash'],
    noLlm: true,
  },
  {
    id: 'customer_book_then_pay_cash',
    surface: 'customer',
    prompt: 'Book spa day package and pay cash at visit',
    minSteps: 2,
    actions: ['book_package', 'pay_cash_at_visit'],
    noLlm: true,
  },
  {
    id: 'customer_list_appointments_manage_link',
    surface: 'customer',
    prompt: 'List my appointments and get manage link',
    minSteps: 2,
    actions: ['list_my_appointments', 'get_manage_link'],
    noLlm: true,
  },
  {
    id: 'public_budget_book_nearest',
    surface: 'public',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
    orderedActions: ['list_services', 'book_appointment'],
    paramChecks: [
      { stepIndex: 0, key: 'maxPrice', value: 50 },
      { stepIndex: 1, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'public_budget_service_discovery_compound',
  },
  {
    id: 'public_budget_check_then_book',
    surface: 'public',
    prompt:
      "Who's free for a facial under $60 tomorrow evening, book the soonest",
    orderedActions: ['check_availability', 'book_appointment'],
    paramChecks: [
      { stepIndex: 0, key: 'maxPrice', value: 60 },
      { stepIndex: 1, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'public_budget_service_discovery_compound',
  },
  {
    id: 'customer_budget_book_nearest',
    surface: 'customer',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
    orderedActions: ['list_services', 'book_nearest_slot'],
    paramChecks: [{ stepIndex: 0, key: 'maxPrice', value: 50 }],
    noLlm: true,
    compoundRecipeId: 'customer_budget_service_discovery_compound',
  },
  {
    id: 'customer_budget_check_then_book',
    surface: 'customer',
    prompt:
      "Who's free for a facial under $60 tomorrow evening, book the soonest",
    orderedActions: ['check_providers_for_service', 'book_nearest_slot'],
    paramChecks: [{ stepIndex: 0, key: 'maxPrice', value: 60 }],
    noLlm: true,
    compoundRecipeId: 'customer_budget_service_discovery_compound',
  },
  {
    id: 'public_rank_book_nearest',
    surface: 'public',
    prompt: 'Book your most premium facial tomorrow, nearest slot',
    orderedActions: ['list_services', 'book_appointment'],
    paramChecks: [
      { stepIndex: 0, key: 'serviceRank', value: 'highest_price' },
      { stepIndex: 0, key: 'serviceCategory', value: 'facial' },
      { stepIndex: 1, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'public_service_rank_discovery_compound',
  },
  {
    id: 'customer_rank_book_nearest',
    surface: 'customer',
    prompt: 'Book your most premium facial tomorrow, nearest slot',
    orderedActions: ['list_services', 'book_nearest_slot'],
    paramChecks: [
      { stepIndex: 0, key: 'serviceRank', value: 'highest_price' },
      { stepIndex: 1, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'customer_service_rank_discovery_compound',
  },
  {
    id: 'dashboard_golden_cancel_notify_waitlist',
    surface: 'dashboard',
    prompt:
      'Cancel package visit for customer Anna and notify waitlist about the slot',
    orderedActions: ['cancel_package_visit', 'fill_slot_from_waitlist'],
    noLlm: true,
  },
  {
    id: 'dashboard_package_line_checkout',
    surface: 'dashboard',
    prompt:
      'Check package line availability for Spa Day tomorrow and book for James at 2pm',
    orderedActions: [
      'check_package_line_availability',
      'create_package_booking',
    ],
    noLlm: true,
  },
  {
    id: 'dashboard_multi_service_cart_checkout',
    surface: 'dashboard',
    prompt:
      'Add haircut and beard trim to cart, check block availability Tuesday, and book for Maria at 10am with Anna',
    minSteps: 2,
    actions: [
      'check_multi_service_block_availability',
      'create_multi_service_booking',
    ],
    noLlm: true,
  },
  {
    id: 'dashboard_golden_cancel_coordinate_waitlist',
    surface: 'dashboard',
    prompt: 'Cancel package visit and coordinate waitlist offer for Friday',
    orderedActions: ['cancel_package_visit', 'coordinate_waitlist_offer'],
    noLlm: true,
  },
  {
    id: 'dashboard_onboard_stylist_anna_e2e',
    surface: 'dashboard',
    prompt:
      'Onboard new stylist Anna end-to-end: create employee, assign haircut and color services, set up first week from weekday template, enable online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'employeeName', value: 'Anna' },
      { stepIndex: 1, key: 'serviceNames', value: ['haircut', 'color'] },
      { stepIndex: 2, key: 'templateName', value: 'weekday' },
      { stepIndex: 3, key: 'enabled', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'onboard_new_provider',
  },
  {
    id: 'dashboard_onboard_therapist_maria',
    surface: 'dashboard',
    prompt:
      'Set up new therapist Maria from scratch — add to team, assign massage services, schedule first week from weekday template, turn on public booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ],
    paramChecks: [{ stepIndex: 0, key: 'employeeName', value: 'Maria' }],
    noLlm: true,
    compoundRecipeId: 'onboard_new_provider',
  },
  {
    id: 'dashboard_onboard_barber_jake',
    surface: 'dashboard',
    prompt:
      'Full provider setup for barber Jake: hire employee; assign beard trim services; onboard first week with weekday template; enable online booking page',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ],
    noLlm: true,
    compoundRecipeId: 'onboard_new_provider',
  },
  {
    id: 'dashboard_budget_discover_book_haircut',
    surface: 'dashboard',
    prompt:
      "Budget discover and book end-to-end: show haircut options under $50, check who's free tomorrow evening, book the nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'maxPrice', value: 50 },
      { stepIndex: 2, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'budget_discover_and_book',
  },
  {
    id: 'dashboard_budget_discover_book_facial',
    surface: 'dashboard',
    prompt:
      "Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    paramChecks: [{ stepIndex: 0, key: 'maxPrice', value: 60 }],
    noLlm: true,
    compoundRecipeId: 'budget_discover_and_book',
  },
  {
    id: 'dashboard_budget_discover_book_massage',
    surface: 'dashboard',
    prompt:
      'List services under $40 for massage, check providers available Friday, book nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    noLlm: true,
    compoundRecipeId: 'budget_discover_and_book',
  },
  {
    id: 'dashboard_rank_discover_book_premium',
    surface: 'dashboard',
    prompt:
      "Rank discover and book end-to-end: show premium facial options, check who's free tomorrow evening, book the nearest slot",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'serviceRank', value: 'highest_price' },
      { stepIndex: 2, key: 'bookingFirstAvailable', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'rank_discover_and_book',
  },
  {
    id: 'dashboard_rank_discover_book_cheapest',
    surface: 'dashboard',
    prompt:
      "Filter catalog for cheapest massage, check who is free tomorrow, and book the soonest appointment",
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    paramChecks: [{ stepIndex: 0, key: 'serviceRank', value: 'lowest_price' }],
    noLlm: true,
    compoundRecipeId: 'rank_discover_and_book',
  },
  {
    id: 'dashboard_rank_discover_book_popular',
    surface: 'dashboard',
    prompt:
      'List most popular manicure services, check providers available Friday, book nearest slot',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'create_booking',
    ],
    noLlm: true,
    compoundRecipeId: 'rank_discover_and_book',
  },
  {
    id: 'dashboard_clinic_lab_day_close_maria',
    surface: 'dashboard',
    prompt:
      'Lab day close end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    paramChecks: [
      { stepIndex: 1, key: 'orderId', value: 'abc123' },
      { stepIndex: 1, key: 'measurementCode', value: 'WBC' },
      { stepIndex: 2, key: 'customerName', value: 'Maria' },
    ],
    noLlm: true,
    compoundRecipeId: 'clinic_lab_day_close',
  },
  {
    id: 'dashboard_clinic_lab_day_close_john',
    surface: 'dashboard',
    prompt:
      'Close lab day for today — show pending lab orders, record hemoglobin 13.1 for order ord-42, publish results to John, send result-ready notification',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    paramChecks: [{ stepIndex: 2, key: 'customerName', value: 'John' }],
    noLlm: true,
    compoundRecipeId: 'clinic_lab_day_close',
  },
  {
    id: 'dashboard_clinic_lab_day_close_anna',
    surface: 'dashboard',
    prompt:
      'Lab closeout for today; list pending lab orders; enter CBC 4.2 for order abc123; release results to Anna; notify her when results are ready',
    orderedActions: [
      'list_test_orders',
      'enter_test_result',
      'release_test_result',
      'notify_patient_result_ready',
    ],
    noLlm: true,
    compoundRecipeId: 'clinic_lab_day_close',
  },
  {
    id: 'dashboard_crm_subscriptions_tag_vip',
    surface: 'dashboard',
    prompt: 'List subscriptions for Anna and tag customer as VIP',
    minSteps: 2,
    actions: ['list_customer_subscriptions', 'tag_customer'],
    noLlm: true,
  },
  {
    id: 'dashboard_catalog_gift_multiservice',
    surface: 'dashboard',
    prompt: 'Enable gift card presets and configure multi-service settings',
    minSteps: 2,
    actions: [
      'configure_gift_card_products',
      'configure_multi_service_settings',
    ],
    noLlm: true,
  },
  {
    id: 'dashboard_schedule_list_explain_conflict',
    surface: 'dashboard',
    prompt:
      'List scheduling resources and explain resource conflict for room 2',
    minSteps: 2,
    noLlm: true,
  },
  {
    id: 'provider_visits_mark_paid',
    surface: 'provider',
    prompt: 'List my package visits this week and mark booking paid',
    minSteps: 2,
    actions: ['mark_paid'],
    noLlm: true,
  },
  {
    id: 'provider_today_appointments_mark_paid',
    surface: 'provider',
    prompt: 'Show my package appointments today and mark booking paid',
    minSteps: 2,
    actions: ['mark_paid'],
    noLlm: true,
  },
  {
    id: 'public_compound_no_deterministic',
    surface: 'public',
    prompt: 'List providers and check availability',
    expectEmpty: true,
    noLlm: true,
  },
  {
    id: 'non_compound_short_prompt',
    surface: 'dashboard',
    prompt: 'List bookings',
    expectEmpty: true,
    noLlm: true,
  },
  {
    id: 'customer_no_match_compound',
    surface: 'customer',
    prompt: 'Optimize schedule and rebalance capacity for next week',
    expectEmpty: true,
    noLlm: true,
  },
  {
    id: 'dashboard_payments_summarize_export',
    surface: 'dashboard',
    prompt: 'Summarize unpaid bookings and export accounting',
    minSteps: 2,
    actions: ['summarize_unpaid', 'export_accounting'],
    noLlm: true,
  },
  {
    id: 'dashboard_marketing_reengagement',
    surface: 'dashboard',
    prompt: 'Trigger reengagement and list inactive customers',
    minSteps: 2,
    noLlm: true,
  },
  {
    id: 'dashboard_integrations_zendesk',
    surface: 'dashboard',
    prompt: 'Configure Zendesk; sync customer Anna to Zendesk',
    minSteps: 2,
    actions: ['configure_zendesk', 'sync_customer_to_zendesk'],
    noLlm: true,
  },
  {
    id: 'dashboard_fulfillment_gift_orders',
    surface: 'dashboard',
    prompt: 'List gift card orders; print packing slip for order 42',
    minSteps: 2,
    actions: ['list_gift_card_orders', 'print_packing_slip'],
    noLlm: true,
  },
  {
    id: 'provider_push_explain_open',
    surface: 'provider',
    prompt: 'Explain last push; open booking from push',
    minSteps: 2,
    actions: ['explain_last_push', 'open_booking_from_push'],
    noLlm: true,
  },
  {
    id: 'customer_cart_duration_compound',
    surface: 'customer',
    prompt: 'Add massage to cart and show cart total duration',
    minSteps: 2,
    actions: ['add_services_to_cart', 'show_cart_total_duration'],
    noLlm: true,
  },
  {
    id: 'dashboard_compound_semicolon_split',
    surface: 'dashboard',
    prompt: 'List subscriptions for Anna; tag customer as VIP',
    minSteps: 2,
    actions: ['list_customer_subscriptions', 'tag_customer'],
    noLlm: true,
  },
  {
    id: 'dashboard_compound_then_split',
    surface: 'dashboard',
    prompt: 'Summarize unpaid bookings then export accounting',
    minSteps: 2,
    actions: ['summarize_unpaid', 'export_accounting'],
    noLlm: true,
  },
  {
    id: 'dashboard_clinic_order_notify',
    surface: 'dashboard',
    prompt:
      "Order lipid panel for Maria's visit and notify her when results are ready",
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    compoundRecipeId: 'dashboard_clinic_compound',
    noLlm: true,
  },
  {
    id: 'customer_clinic_book_explain',
    surface: 'customer',
    prompt: 'Book lipid panel and notify me when results are ready',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    compoundRecipeId: 'customer_clinic_compound',
    noLlm: true,
  },
  {
    id: 'public_clinic_book_explain',
    surface: 'public',
    prompt: 'Book lipid panel and tell me when results are ready on this page',
    orderedActions: ['book_appointment', 'explain_result_status'],
    compoundRecipeId: 'public_clinic_compound',
    noLlm: true,
  },
];

export const COMPOUND_MARKER_PROMPTS: Array<{
  prompt: string;
  compound: boolean;
}> = [
  { prompt: '', compound: false },
  { prompt: 'short', compound: false },
  { prompt: 'List bookings today', compound: false },
  { prompt: 'Book spa day package and apply promo SAVE10', compound: true },
  { prompt: 'Cancel package visit and notify waitlist', compound: true },
  { prompt: 'Show appointments then cancel booking', compound: true },
  { prompt: 'Summarize today; then list all bookings', compound: true },
  { prompt: 'List packages and also create new package', compound: true },
  { prompt: 'Export data after that send reengagement', compound: true },
  { prompt: 'Book haircut, and cancel old appointment', compound: true },
  { prompt: 'Clear schedule. cancel remaining bookings', compound: true },
];
