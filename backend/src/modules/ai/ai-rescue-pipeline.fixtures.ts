import {
  CHECK_AND_BOOK_CORE_PROMPTS,
  SIMILAR_CHECK_AND_BOOK_PROMPTS,
} from './ai-check-and-book.fixtures.js';
import { GIFT_CARD_CHECKOUT_PROMPTS } from './ai-gift-card-payments.fixtures.js';
import {
  ALL_MULTI_SERVICE_CHECKOUT_PROMPTS,
  ALL_PACKAGE_CHECKOUT_PROMPTS,
} from './ai-package-multi-service.fixtures.js';

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
  public_budget_book_nearest:
    'Book a haircut under $50 tomorrow, nearest slot',
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
  customer_physical_gift_card_handoff:
    'Buy physical gift card $100 and track my order',
  dashboard_clinic_order_notify:
    "Order lipid panel for Maria's visit and notify her when results are ready",
  customer_clinic_book_explain_results:
    'Book lipid panel and notify me when results are ready',
  public_clinic_book_explain_results:
    'Book lipid panel and tell me when results are ready on this page',
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
