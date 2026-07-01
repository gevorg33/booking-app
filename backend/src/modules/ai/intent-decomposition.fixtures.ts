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
    orderedActions: ['book_package', 'apply_promo_code_checkout'],
    paramChecks: [{ stepIndex: 1, key: 'promoCode', value: 'SPRING25' }],
    noLlm: true,
  },
  {
    id: 'customer_provider_same_day_multi',
    surface: 'customer',
    prompt: 'Anna — massage and facial same afternoon',
    orderedActions: [
      'pick_provider_for_service',
      'check_multi_service_availability',
      'book_multi_service',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'providerName', value: 'Anna' },
      { stepIndex: 0, key: 'providerSameDayMulti', value: true },
      { stepIndex: 1, key: 'continueAfterProviderPick', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'provider_same_day_multi',
  },
  {
    id: 'customer_multi_service_day',
    surface: 'customer',
    prompt: 'Massage and facial same afternoon — find a time',
    orderedActions: [
      'add_services_to_cart',
      'check_multi_service_availability',
      'book_multi_service',
    ],
    paramChecks: [
      {
        stepIndex: 0,
        key: 'serviceNames',
        value: ['massage', 'facial'],
      },
    ],
    noLlm: true,
    compoundRecipeId: 'multi_service_day',
  },
  {
    id: 'customer_guest_pay_cash_manage',
    surface: 'customer',
    prompt: 'Book as guest, pay at visit, email manage link',
    orderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'guestCheckout', value: true },
      { stepIndex: 0, key: 'paymentMethod', value: 'cash' },
      { stepIndex: 1, key: 'paymentMethod', value: 'cash' },
      { stepIndex: 1, key: 'continueAfterGuestBook', value: true },
      { stepIndex: 2, key: 'guestLookup', value: true },
      { stepIndex: 2, key: 'delivery', value: 'email' },
      { stepIndex: 2, key: 'continueAfterCashPayment', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'guest_pay_cash_manage',
  },
  {
    id: 'customer_guest_book_and_manage',
    surface: 'customer',
    prompt: 'Book as guest and email me the manage link',
    orderedActions: ['book_nearest_slot', 'get_manage_link'],
    paramChecks: [
      { stepIndex: 0, key: 'guestCheckout', value: true },
      { stepIndex: 1, key: 'guestLookup', value: true },
      { stepIndex: 1, key: 'delivery', value: 'email' },
    ],
    noLlm: true,
    compoundRecipeId: 'guest_book_and_manage',
  },
  {
    id: 'customer_gift_card_checkout',
    surface: 'customer',
    prompt: 'Use gift card GCM-ABCD1234 and book nearest haircut',
    orderedActions: [
      'check_gift_card_balance',
      'apply_gift_card_code',
      'book_nearest_slot',
    ],
    paramChecks: [{ stepIndex: 0, key: 'giftCardCode', value: 'GCM-ABCD1234' }],
    noLlm: true,
    compoundRecipeId: 'gift_card_checkout',
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
    id: 'customer_book_package_nearest',
    surface: 'customer',
    prompt: 'Book the spa package earliest available',
    orderedActions: ['discover_packages', 'book_package'],
    paramChecks: [
      { stepIndex: 1, key: 'bookingFirstAvailable', value: true },
      { stepIndex: 1, key: 'packageName', value: 'Spa Day' },
    ],
    noLlm: true,
    compoundRecipeId: 'book_package_with_nearest_slot',
  },
  {
    id: 'public_book_package_nearest',
    surface: 'public',
    prompt: 'Buy deluxe bundle soonest opening',
    orderedActions: ['discover_packages', 'book_package'],
    noLlm: true,
    compoundRecipeId: 'public_book_package_with_nearest_slot',
  },
  {
    id: 'customer_book_lab_collection_nearest',
    surface: 'customer',
    prompt: 'Book lab draw earliest slot',
    orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
    paramChecks: [{ stepIndex: 1, key: 'bookingFirstAvailable', value: true }],
    noLlm: true,
    compoundRecipeId: 'book_lab_collection_nearest',
  },
  {
    id: 'public_book_lab_collection_nearest',
    surface: 'public',
    prompt: 'Schedule my lab blood draw soonest opening',
    orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
    paramChecks: [{ stepIndex: 1, key: 'bookingFirstAvailable', value: true }],
    noLlm: true,
    compoundRecipeId: 'public_book_lab_collection_nearest',
  },
  {
    id: 'customer_complete_intake_and_book',
    surface: 'customer',
    prompt: 'Fill intake and book blood draw',
    orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
    paramChecks: [
      { stepIndex: 0, key: 'preVisitIntakeRequired', value: true },
      { stepIndex: 1, key: 'continueAfterIntake', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'complete_intake_and_book',
  },
  {
    id: 'customer_intake_lab_book_pay',
    surface: 'customer',
    prompt: 'Complete health form, book earliest blood draw, pay deposit',
    orderedActions: [
      'complete_intake_and_book',
      'book_nearest_slot',
      'pay_online',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'preVisitIntakeRequired', value: true },
      { stepIndex: 2, key: 'paymentMethod', value: 'online' },
    ],
    noLlm: true,
    compoundRecipeId: 'intake_lab_book_pay',
  },
  {
    id: 'public_intake_lab_book_pay',
    surface: 'public',
    prompt: 'Complete health questionnaire, schedule lab test, pay with card',
    orderedActions: [
      'complete_intake_and_book',
      'book_appointment',
      'pay_online',
    ],
    paramChecks: [{ stepIndex: 0, key: 'completeIntakeAndBook', value: true }],
    noLlm: true,
    compoundRecipeId: 'public_intake_lab_book_pay',
  },
  {
    id: 'public_complete_intake_and_book',
    surface: 'public',
    prompt: 'Complete the health questionnaire and book my lab test',
    orderedActions: ['complete_intake_and_book', 'book_appointment'],
    paramChecks: [{ stepIndex: 0, key: 'completeIntakeAndBook', value: true }],
    noLlm: true,
    compoundRecipeId: 'public_complete_intake_and_book',
  },
  {
    id: 'customer_tour_group_checkout',
    surface: 'customer',
    prompt: 'Wine tour for 6 next Saturday — book if enough seats',
    orderedActions: [
      'explain_tour_booking',
      'diagnose_tour_capacity',
      'book_nearest_slot',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'tourGroupCheckout', value: true },
      { stepIndex: 0, key: 'paxCount', value: 6 },
      { stepIndex: 1, key: 'requestedPax', value: 6 },
      { stepIndex: 2, key: 'continueAfterCapacityCheck', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'tour_group_checkout',
  },
  {
    id: 'public_tour_group_checkout',
    surface: 'public',
    prompt: 'Sunset hike for 5 guests — reserve when seats are available',
    orderedActions: [
      'explain_tour_booking',
      'diagnose_tour_capacity',
      'book_appointment',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'tourGroupCheckout', value: true },
      { stepIndex: 0, key: 'paxCount', value: 5 },
      { stepIndex: 2, key: 'bookIfCapacityOk', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'public_tour_group_checkout',
  },
  {
    id: 'customer_book_tour_nearest_departure',
    surface: 'customer',
    prompt: 'Book the wine tour earliest date for 2 people',
    orderedActions: [
      'explain_tour_booking',
      'explain_tour_day_slots',
      'book_nearest_slot',
    ],
    paramChecks: [
      { stepIndex: 2, key: 'bookingFirstAvailable', value: true },
      { stepIndex: 2, key: 'paxCount', value: 2 },
      { stepIndex: 2, key: 'serviceName', value: 'wine tour' },
    ],
    noLlm: true,
    compoundRecipeId: 'book_tour_nearest_departure',
  },
  {
    id: 'public_book_tour_nearest_departure',
    surface: 'public',
    prompt: 'Reserve mountain trek soonest departure for 4 people',
    orderedActions: [
      'explain_tour_booking',
      'explain_tour_day_slots',
      'book_appointment',
    ],
    paramChecks: [
      { stepIndex: 2, key: 'bookingFirstAvailable', value: true },
      { stepIndex: 2, key: 'paxCount', value: 4 },
    ],
    noLlm: true,
    compoundRecipeId: 'public_book_tour_nearest_departure',
  },
  {
    id: 'customer_book_package_gift_card',
    surface: 'customer',
    prompt: 'Book spa day package and pay with gift card GCM-SPA100',
    orderedActions: ['book_package', 'book_with_gift_card'],
    paramChecks: [{ stepIndex: 1, key: 'giftCardCode', value: 'GCM-SPA100' }],
    noLlm: true,
    compoundRecipeId: 'customer_book_with_gift_card_compound',
  },
  {
    id: 'customer_book_nearest_gift_card',
    surface: 'customer',
    prompt:
      'Book nearest slot for massage tomorrow and pay with gift card GCM-NEAR1',
    orderedActions: ['book_nearest_slot', 'book_with_gift_card'],
    paramChecks: [{ stepIndex: 1, key: 'giftCardCode', value: 'GCM-NEAR1' }],
    noLlm: true,
    compoundRecipeId: 'customer_book_with_gift_card_compound',
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
    id: 'customer_cancel_package_rebook_single',
    surface: 'customer',
    prompt: 'Skip package visit 2 and book a trim instead',
    orderedActions: ['cancel_package_visit_self', 'book_nearest_slot'],
    paramChecks: [
      { stepIndex: 0, key: 'visitIndex', value: 2 },
      { stepIndex: 0, key: 'cancelPackageRebookSingle', value: true },
      { stepIndex: 1, key: 'serviceName', value: 'trim' },
      { stepIndex: 1, key: 'continueAfterPackageCancel', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'cancel_package_rebook_single',
  },
  {
    id: 'customer_cancel_and_rebook',
    surface: 'customer',
    prompt: 'Cancel Friday and book the next available slot',
    orderedActions: ['cancel_my_booking', 'book_nearest_slot'],
    noLlm: true,
    compoundRecipeId: 'cancel_and_rebook',
  },
  {
    id: 'customer_rebook_and_pay',
    surface: 'customer',
    prompt: 'Rebook my last visit and pay with card',
    orderedActions: ['rebook_last_appointment', 'pay_online'],
    noLlm: true,
    compoundRecipeId: 'rebook_and_pay',
  },
  {
    id: 'customer_subscription_first_visit',
    surface: 'customer',
    prompt: "Use my membership for today's massage",
    orderedActions: ['explain_my_subscription', 'use_subscription_credit'],
    noLlm: true,
    compoundRecipeId: 'subscription_first_visit',
  },
  {
    id: 'customer_results_then_rebook',
    surface: 'customer',
    prompt: 'Results released — book follow-up like last time',
    orderedActions: ['explain_result_status', 'rebook_last_appointment'],
    noLlm: true,
    compoundRecipeId: 'results_then_rebook',
  },
  {
    id: 'customer_discover_book_and_pay',
    surface: 'customer',
    prompt: 'Book cheapest massage under $60 tomorrow and pay online',
    orderedActions: [
      'list_services',
      'check_providers_for_service',
      'book_nearest_slot',
      'pay_online',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'maxPrice', value: 60 },
      { stepIndex: 0, key: 'serviceCategory', value: 'massage' },
    ],
    noLlm: true,
    compoundRecipeId: 'discover_book_and_pay',
  },
  {
    id: 'public_discover_book_and_pay',
    surface: 'public',
    prompt: 'Book cheapest massage under $60 tomorrow and pay online',
    orderedActions: [
      'list_services',
      'check_availability',
      'book_appointment',
      'pay_online',
    ],
    paramChecks: [{ stepIndex: 0, key: 'maxPrice', value: 60 }],
    noLlm: true,
    compoundRecipeId: 'public_discover_book_and_pay',
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
    id: 'dashboard_setup_salon_checkout_e2e',
    surface: 'dashboard',
    prompt:
      'Set up salon checkout end-to-end: connect Stripe for client payments, enable cash at venue, accept online payment on all services with 50% prepayment, enable online booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'startOnboarding', value: false },
      { stepIndex: 1, key: 'acceptCashPayments', value: true },
      { stepIndex: 2, key: 'allServices', value: true },
      { stepIndex: 2, key: 'depositPercent', value: 50 },
      { stepIndex: 3, key: 'enabled', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'setup_salon_checkout',
  },
  {
    id: 'dashboard_setup_salon_checkout_spa',
    surface: 'dashboard',
    prompt:
      'Full checkout setup for our spa — link Stripe Connect, turn on cash payments, require 50% online prepayment on every service, and enable the public booking page',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ],
    noLlm: true,
    compoundRecipeId: 'setup_salon_checkout',
  },
  {
    id: 'dashboard_configure_services_payment_matrix_massage_hair',
    surface: 'dashboard',
    prompt:
      'Configure services payment matrix — full prepayment for massage services and 50% deposit for hair services; enable cash at venue',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
      'configure_cash_payments',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'categoryName', value: 'massage' },
      { stepIndex: 0, key: 'prepaymentMode', value: 'full' },
      { stepIndex: 1, key: 'categoryName', value: 'hair' },
      { stepIndex: 1, key: 'prepaymentMode', value: 'deposit' },
      { stepIndex: 1, key: 'depositPercent', value: 50 },
      { stepIndex: 2, key: 'acceptCashPayments', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'configure_services_payment_matrix',
  },
  {
    id: 'dashboard_configure_services_payment_matrix_price',
    surface: 'dashboard',
    prompt:
      'Raise massage prices 10% — services payment matrix: require full prepayment for massage services; accept 50% deposit for hair services; turn on cash payments',
    orderedActions: [
      'update_service_prices',
      'configure_service_online_payment',
      'configure_service_online_payment',
      'configure_cash_payments',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'percentChange', value: 10 },
      { stepIndex: 3, key: 'acceptCashPayments', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'configure_services_payment_matrix',
  },
  {
    id: 'dashboard_decline_online_payment_category_dental_massage',
    surface: 'dashboard',
    prompt:
      'Decline online payment on public booking for dental services but accept 50% prepayment for massage services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'categoryName', value: 'dental' },
      { stepIndex: 0, key: 'prepaymentMode', value: 'none' },
      { stepIndex: 1, key: 'categoryName', value: 'massage' },
      { stepIndex: 1, key: 'prepaymentMode', value: 'deposit' },
      { stepIndex: 1, key: 'depositPercent', value: 50 },
    ],
    noLlm: true,
    compoundRecipeId: 'decline_online_payment_category',
  },
  {
    id: 'dashboard_cash_and_online_payment_all_services',
    surface: 'dashboard',
    prompt: 'Enable cash and decline online payment for all services',
    orderedActions: [
      'configure_cash_payments',
      'configure_service_online_payment',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'acceptCashPayments', value: true },
      { stepIndex: 1, key: 'allServices', value: true },
      { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
    ],
    noLlm: true,
    compoundRecipeId: 'cash_and_online_payment',
  },
  {
    id: 'dashboard_onboard_salon_notifications_e2e',
    surface: 'dashboard',
    prompt:
      'Onboard salon notifications end-to-end: configure notification settings with email and WhatsApp reminders, connect WhatsApp integration with platform default, and test push notifications',
    orderedActions: [
      'configure_notification_settings',
      'configure_whatsapp_integration',
      'test_push',
    ],
    paramChecks: [
      { stepIndex: 0, key: 'emailEnabled', value: true },
      { stepIndex: 0, key: 'whatsappEnabled', value: true },
      { stepIndex: 1, key: 'usePlatformDefault', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'onboard_salon_notifications',
  },
  {
    id: 'dashboard_launch_consumer_app_growth_e2e',
    surface: 'dashboard',
    prompt:
      'Launch consumer app growth end-to-end: explain our tenant app install QR, regenerate the growth QR code, and configure marketing registration email notifications',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ],
    paramChecks: [
      { stepIndex: 2, key: 'emailOnNewCustomerRegistration', value: true },
    ],
    noLlm: true,
    compoundRecipeId: 'launch_consumer_app_growth',
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
      'Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment',
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
      'Filter catalog for cheapest massage, check who is free tomorrow, and book the soonest appointment',
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
    id: 'dashboard_clinic_lab_review_maria',
    surface: 'dashboard',
    prompt:
      'Lab review for Maria: list abnormal flagged measurements and explain her lab results in plain language',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'],
    paramChecks: [{ stepIndex: 0, key: 'customerName', value: 'Maria' }],
    noLlm: true,
    compoundRecipeId: 'clinic_lab_review',
  },
  {
    id: 'dashboard_clinic_lab_review_john',
    surface: 'dashboard',
    prompt: 'List abnormal results for John and then explain his lab results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'],
    paramChecks: [{ stepIndex: 1, key: 'customerName', value: 'John' }],
    noLlm: true,
    compoundRecipeId: 'clinic_lab_review',
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
    orderedActions: ['book_nearest_slot', 'notify_when_results_ready'],
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
