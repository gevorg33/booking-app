import {
  CHECK_AND_BOOK_CORE_PROMPTS,
  SIMILAR_CHECK_AND_BOOK_PROMPTS,
} from './ai-check-and-book.fixtures.js';
import { GIFT_CARD_CHECKOUT_PROMPTS } from './ai-gift-card-payments.fixtures.js';
import {
  ALL_MULTI_SERVICE_CHECKOUT_PROMPTS,
  ALL_PACKAGE_CHECKOUT_PROMPTS,
} from './ai-package-multi-service.fixtures.js';
import { BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS } from './ai-budget-discover-and-book-compound.fixtures.js';
import { RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS } from './ai-rank-discover-and-book-compound.fixtures.js';
import { PROVIDER_ONBOARDING_COMPOUND_PROMPTS } from './ai-provider-onboarding-compound.fixtures.js';
import { SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS } from './ai-setup-salon-checkout-compound.fixtures.js';
import { CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS } from './ai-configure-services-payment-matrix-compound.fixtures.js';
import { CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS } from './ai-cash-online-payment-compound.fixtures.js';
import { DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS } from './ai-decline-online-payment-category-compound.fixtures.js';
import { ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS } from './ai-onboard-salon-notifications-compound.fixtures.js';
import { LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS } from './ai-launch-consumer-app-growth-compound.fixtures.js';
import { CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS } from './ai-clinic-lab-day-close-compound.fixtures.js';
import { CLINIC_LAB_REVIEW_COMPOUND_PROMPTS } from './ai-clinic-lab-review-compound.fixtures.js';
import { FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS } from './ai-flexible-availability.fixtures.js';

/** Post-LLM rescue scenarios for compound checkout families (ai-cmd-h4.2). */
export const COMPOUND_RESCUE_SCENARIOS = [
  {
    id: 'create_booking-to-package',
    prompt: 'Book spa day package for James Friday 2pm',
    action: 'create_booking',
    expectedAction: 'create_package_booking',
    rescueReason: 'create_booking_to_package',
  },
  {
    id: 'unknown-package-book',
    prompt: 'Book spa day package for James Friday 2pm',
    action: 'unknown',
    expectedAction: 'create_package_booking',
    rescueReason: 'package_booking',
  },
  {
    id: 'unknown-multi-service',
    prompt: 'Book haircut and beard trim Tuesday 10am with Anna for Maria',
    action: 'unknown',
    expectedAction: 'create_multi_service_booking',
    rescueReason: 'multi_service_booking',
  },
  {
    id: 'create_booking-check-and-book',
    prompt:
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
    action: 'create_booking',
    expectedAction: 'create_booking',
    rescueReason: 'check_and_book_compound',
  },
  {
    id: 'create_booking-first-available',
    prompt: 'Book first available slot for massage tomorrow',
    action: 'create_booking',
    expectedAction: 'create_booking',
    rescueReason: 'booking_first_available',
  },
  {
    id: 'gift-card-apply-checkout',
    prompt: 'Apply gift card GCM-TEST at checkout',
    action: 'validate_gift_card',
    expectedAction: 'apply_gift_card_code',
    rescueReason: 'apply_gift_card_checkout',
  },
  {
    id: 'buy-gift-card-physical',
    prompt: 'Buy physical gift card $75',
    action: 'buy_gift_card',
    expectedAction: 'buy_gift_card_physical',
    rescueReason: 'digital_to_physical_gift_card',
  },
] as const;

/** Golden decomposition prompts keyed by pattern id (ai-cmd-h4.2). */
export const GOLDEN_COMPOUND_PROMPT_BY_ID: Record<string, string> = {
  customer_book_package_apply_promo:
    'Book spa day package and apply promo code SPRING25',
  dashboard_cancel_visit_notify_waitlist:
    'Cancel package visit and notify waitlist for Anna',
  dashboard_cancel_visit_coordinate_waitlist:
    'Cancel package visit and coordinate waitlist offer for Friday',
  dashboard_check_and_book_nearest:
    'check who is free tomorrow evening for permanent lashes, book the nearest slot',
  customer_check_and_book_nearest:
    'Who is available tomorrow evening for massage and book the nearest slot',
  public_budget_check_then_book:
    "Who's free for a facial under $60 tomorrow evening, book the soonest",
  public_budget_book_nearest: 'Book a haircut under $50 tomorrow, nearest slot',
  customer_budget_check_then_book:
    "Who's free for a facial under $60 tomorrow evening, book the soonest",
  customer_budget_book_nearest:
    'Book a haircut under $50 tomorrow, nearest slot',
  public_rank_book_nearest:
    'Book your most premium facial tomorrow, nearest slot',
  customer_rank_book_nearest:
    'Book your most premium facial tomorrow, nearest slot',
  public_flexible_avail_budget_check_then_book:
    "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
  customer_flexible_avail_budget_check_then_book:
    'I want a haircut tomorrow evening or Friday afternoon, I have $50, book the soonest',
  dashboard_package_line_checkout: ALL_PACKAGE_CHECKOUT_PROMPTS[0].prompt,
  dashboard_multi_service_cart_checkout:
    ALL_MULTI_SERVICE_CHECKOUT_PROMPTS[0].prompt,
  customer_gift_card_checkout_compound: GIFT_CARD_CHECKOUT_PROMPTS[0].prompt,
  customer_gift_card_checkout:
    'Use gift card GCM-ABCD1234 and book nearest haircut',
  customer_multi_service_day: 'Massage and facial same afternoon — find a time',
  customer_guest_pay_cash_manage:
    'Book as guest, pay at visit, email manage link',
  customer_guest_book_and_manage: 'Book as guest and email me the manage link',
  customer_physical_gift_card_handoff:
    'Buy physical gift card $100 and track my order',
  dashboard_clinic_order_notify:
    "Order lipid panel for Maria's visit and notify her when results are ready",
  customer_clinic_book_explain_results:
    'Book lipid panel and notify me when results are ready',
  public_clinic_book_explain_results:
    'Book lipid panel and tell me when results are ready on this page',
  public_flexible_avail_list_budget_then_or:
    FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.find(
      (row) => row.id === 'avail-list-budget-then-or-en',
    )!.prompt,
  customer_flexible_avail_list_budget_then_or:
    FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.find(
      (row) => row.id === 'avail-list-budget-then-or-en',
    )!.prompt,
  customer_discover_book_and_pay:
    'Book cheapest massage under $60 tomorrow and pay online',
  customer_rebook_and_pay: 'Rebook my last visit and pay with card',
  customer_cancel_package_rebook_single:
    'Skip package visit 2 and book a trim instead',
  customer_cancel_and_rebook: 'Cancel Friday and book the next available slot',
  public_discover_book_and_pay:
    'Book cheapest massage under $60 tomorrow and pay online',
  dashboard_budget_discover_and_book:
    BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS[0].prompt,
  dashboard_rank_discover_and_book:
    RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS[0].prompt,
  dashboard_onboard_new_provider:
    PROVIDER_ONBOARDING_COMPOUND_PROMPTS[0].prompt,
  dashboard_setup_salon_checkout:
    SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS[0].prompt,
  dashboard_configure_services_payment_matrix:
    CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS[0].prompt,
  dashboard_decline_online_payment_category:
    DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS[0].prompt,
  dashboard_cash_and_online_payment:
    CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS[0].prompt,
  dashboard_onboard_salon_notifications:
    ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS[0].prompt,
  dashboard_launch_consumer_app_growth:
    LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS[0].prompt,
  dashboard_clinic_lab_day_close:
    CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS[0].prompt,
  dashboard_clinic_lab_review: CLINIC_LAB_REVIEW_COMPOUND_PROMPTS[0].prompt,
};

/** Enrichment scenarios: compound prompts that must set bookingFirstAvailable hints. */
const ALL_CHECK_AND_BOOK_PROMPTS = [
  ...CHECK_AND_BOOK_CORE_PROMPTS,
  ...SIMILAR_CHECK_AND_BOOK_PROMPTS,
];

export const COMPOUND_ENRICHMENT_SCENARIOS = [
  ...ALL_CHECK_AND_BOOK_PROMPTS.map((fixture) => ({
    id: `check-and-book-${fixture.id}`,
    prompt: fixture.prompt,
    action: 'create_booking' as const,
  })),
  {
    id: 'first-available-wording',
    prompt: 'Book first available haircut tomorrow',
    action: 'create_booking' as const,
  },
] as const;
