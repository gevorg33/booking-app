import { CANCEL_MY_BOOKING_PROMPTS } from './ai-cancel-my-booking.util.js';
import { MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS } from './ai-checkout-recommendations-multilingual.fixtures.js';
import { EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS } from './ai-checkout-recommendations.fixtures.js';
import {
  CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_SCENARIOS,
  type CustomerIntentPromotionMultilingualScenario,
} from './ai-customer-intent-promotion-multilingual.fixtures.js';
import { CUSTOMER_INTENT_PROMOTION_INTENT_LIST } from './ai-customer-intent-promotion.intents.js';
import { EXPLAIN_WHY_STRIPE_REQUIRED_PROMPTS } from './ai-explain-prepayment.util.js';
import { GIFT_CARD_CANCEL_CUSTOMER_PROMPTS } from './ai-gift-card-cancel-customer.util.js';
import { GROWTH_LOOPS_CUSTOMER_PROMPTS } from './ai-growth-loops-customer.fixtures.js';
import { MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS } from './ai-growth-loops-customer.fixtures.js';
import { LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS } from './ai-list-my-package-visits-customer.util.js';
import { LOYALTY_POINTS_BALANCE_PROMPTS } from './ai-loyalty-points-balance-customer.util.js';
import { MARKETING_GROWTH_MULTILINGUAL_SCENARIOS } from './ai-marketing-growth-multilingual.fixtures.js';
import { MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS } from './ai-multi-service-customer-public.util.js';
import { PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS } from './ai-package-visit-self-customer.util.js';
import { PAY_ONLINE_CHECKOUT_PROMPTS } from './ai-pay-online-checkout.util.js';
import { PRIVACY_GDPR_CUSTOMER_PROMPTS } from './ai-privacy-gdpr-customer.util.js';
import { PROMO_CODE_HELP_PROMPTS } from './ai-promo-code-help-customer-public.util.js';
import { RESCHEDULE_MY_BOOKING_PROMPTS } from './ai-reschedule-my-booking.util.js';
import { SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-self-service-booking-multilingual.fixtures.js';
import { SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS } from './ai-subscription-membership-customer.util.js';
import { DIAGNOSE_TOUR_CAPACITY_PROMPTS } from './ai-tour-capacity.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import { MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS } from './ai-tour-consumer-multilingual.fixtures.js';
import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from './ai-tour-day-slots.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS } from './ai-tour-booking-record.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_PROMPTS } from './ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS } from './ai-tour-meeting-point-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export const CUSTOMER_INTENT_PROMOTION_MIN_EN_FIXTURES = 10;
export const CUSTOMER_INTENT_PROMOTION_MIN_HY_FIXTURES = 2;
export const CUSTOMER_INTENT_PROMOTION_MIN_RU_FIXTURES = 2;

/** Eval id prefixes that count toward customer-surface promotion coverage (ai-cmd-customer-4.0.2). */
export const CUSTOMER_INTENT_PROMOTION_EVAL_ID_PREFIXES: Readonly<
  Record<string, readonly string[]>
> = {
  cancel_my_booking: [
    'cancel-my-booking-',
    'self-service-i18n-cancel-my-booking-',
  ],
  reschedule_my_booking: [
    'reschedule-my-booking-',
    'self-service-i18n-reschedule-my-booking-',
  ],
  pay_online: ['pay-online-checkout-', 'promotion-i18n-pay-online-'],
  explain_why_stripe_required: [
    'explain-why-stripe-',
    'promotion-i18n-explain-why-stripe-',
  ],
  book_multi_service: [
    'multi-service-',
    'self-service-i18n-book-multi-service-',
  ],
  check_multi_service_availability: [
    'multi-service-',
    'self-service-i18n-check-multi-service-availability-',
  ],
  promo_code_help: [
    'promo-code-help-',
    'marketing-growth-i18n-promo-code-help-',
  ],
  use_subscription_credit: [
    'subscription-membership-',
    'self-service-i18n-use-subscription-credit-',
  ],
  my_subscriptions: [
    'subscription-membership-',
    'promotion-i18n-my-subscriptions-',
  ],
  loyalty_points_balance: [
    'loyalty-points-balance-',
    'marketing-growth-i18n-loyalty-points-balance-',
  ],
  privacy_export: ['privacy-gdpr-', 'promotion-i18n-privacy-export-'],
  privacy_delete: ['privacy-gdpr-', 'promotion-i18n-privacy-delete-'],
  request_gift_card_cancel: [
    'gift-card-cancel-',
    'promotion-i18n-gift-card-cancel-',
  ],
  cancel_package_visit_self: [
    'package-visit-self-',
    'self-service-i18n-cancel-package-visit-',
  ],
  reschedule_package_visit_self: [
    'package-visit-self-',
    'self-service-i18n-reschedule-package-visit-',
  ],
  list_my_package_visits: [
    'list-my-package-visits-',
    'promotion-i18n-list-package-visits-',
  ],
  explain_tour_booking: ['tour-booking-', 'tour-consumer-'],
  explain_tour_day_slots: ['tour-day-slots-', 'tour-consumer-'],
  diagnose_tour_capacity: ['tour-capacity-', 'tour-consumer-'],
  explain_tour_booking_record: [
    'tour-booking-record-customer-',
    'tour-consumer-',
  ],
  explain_tour_meeting_point: ['tour-meeting-point-', 'tour-consumer-'],
  explain_checkout_recommendations: ['checkout-recommendations-'],
  refer_a_friend: ['growth-loops-'],
  share_salon_link: ['growth-loops-'],
};

type FixtureLocaleRow = {
  id?: string;
  prompt: string;
  locale?: AiEvalLocale;
  expectedAction?: string;
};

export type CustomerIntentPromotionFixtureAuditRow = {
  intent: string;
  enCount: number;
  hyCount: number;
  ruCount: number;
  evalIdPrefixes: readonly string[];
};

export type CustomerIntentPromotionIntegrationRow = {
  id: string;
  intent: string;
  prompt: string;
};

function detectFixtureLocale(row: FixtureLocaleRow): AiEvalLocale {
  if (row.locale) return row.locale;
  const id = row.id ?? '';
  if (id.includes('-hy-') || id.endsWith('-hy')) return 'hy';
  if (id.includes('-ru-') || id.endsWith('-ru')) return 'ru';
  if (/[\u0530-\u058F]/.test(row.prompt)) return 'hy';
  if (/[\u0400-\u04FF]/.test(row.prompt)) return 'ru';
  return 'en';
}

function countLocales(rows: readonly FixtureLocaleRow[]): {
  en: number;
  hy: number;
  ru: number;
} {
  const counts = { en: 0, hy: 0, ru: 0 };
  for (const row of rows) {
    counts[detectFixtureLocale(row)] += 1;
  }
  return counts;
}

function filterByAction<T extends { expectedAction: string }>(
  rows: readonly T[],
  action: string,
): T[] {
  return rows.filter((row) => row.expectedAction === action);
}

function promotionMultilingualForIntent(
  intent: string,
): readonly CustomerIntentPromotionMultilingualScenario[] {
  return CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_SCENARIOS.filter(
    (row) => row.expectedAction === intent,
  );
}

function selfServiceMultilingualForIntent(intent: string): FixtureLocaleRow[] {
  return SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS.filter(
    (row) => row.expectedAction === intent,
  );
}

function marketingGrowthMultilingualForIntent(
  intent: string,
): FixtureLocaleRow[] {
  return MARKETING_GROWTH_MULTILINGUAL_SCENARIOS.filter(
    (row) => row.expectedAction === intent,
  );
}

function tourConsumerMultilingualForIntent(intent: string): FixtureLocaleRow[] {
  return MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS.filter(
    (row) => row.expectedAction === intent,
  );
}

function checkoutRecommendationsForIntent(intent: string): FixtureLocaleRow[] {
  if (intent !== 'explain_checkout_recommendations') return [];
  return [
    ...EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS.map((row) => ({
      ...row,
      expectedAction: 'explain_checkout_recommendations',
    })),
    ...MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS,
  ];
}

function growthLoopsForIntent(intent: string): FixtureLocaleRow[] {
  return [
    ...GROWTH_LOOPS_CUSTOMER_PROMPTS.filter(
      (row) => row.expectedAction === intent,
    ),
    ...MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS.filter(
      (row) => row.expectedAction === intent,
    ),
  ];
}

function fixtureRowsForPromotionIntent(intent: string): FixtureLocaleRow[] {
  switch (intent) {
    case 'cancel_my_booking':
      return [
        ...CANCEL_MY_BOOKING_PROMPTS,
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'reschedule_my_booking':
      return [
        ...RESCHEDULE_MY_BOOKING_PROMPTS,
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'pay_online':
      return [
        ...PAY_ONLINE_CHECKOUT_PROMPTS,
        ...promotionMultilingualForIntent(intent),
      ];
    case 'explain_why_stripe_required':
      return [
        ...EXPLAIN_WHY_STRIPE_REQUIRED_PROMPTS,
        ...promotionMultilingualForIntent(intent),
      ];
    case 'book_multi_service':
      return [
        ...filterByAction(MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS, intent),
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'check_multi_service_availability':
      return [
        ...filterByAction(MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS, intent),
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'promo_code_help':
      return [
        ...PROMO_CODE_HELP_PROMPTS,
        ...marketingGrowthMultilingualForIntent(intent),
      ];
    case 'use_subscription_credit':
      return [
        ...filterByAction(SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS, intent),
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'my_subscriptions':
      return [
        ...filterByAction(SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS, intent),
        ...promotionMultilingualForIntent(intent),
      ];
    case 'loyalty_points_balance':
      return [
        ...LOYALTY_POINTS_BALANCE_PROMPTS,
        ...marketingGrowthMultilingualForIntent(intent),
      ];
    case 'privacy_export':
      return [
        ...filterByAction(PRIVACY_GDPR_CUSTOMER_PROMPTS, intent),
        ...promotionMultilingualForIntent(intent),
      ];
    case 'privacy_delete':
      return [
        ...filterByAction(PRIVACY_GDPR_CUSTOMER_PROMPTS, intent),
        ...promotionMultilingualForIntent(intent),
      ];
    case 'request_gift_card_cancel':
      return [
        ...GIFT_CARD_CANCEL_CUSTOMER_PROMPTS,
        ...promotionMultilingualForIntent(intent),
      ];
    case 'cancel_package_visit_self':
      return [
        ...filterByAction(PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS, intent),
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'reschedule_package_visit_self':
      return [
        ...filterByAction(PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS, intent),
        ...selfServiceMultilingualForIntent(intent),
      ];
    case 'list_my_package_visits':
      return [
        ...LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS,
        ...promotionMultilingualForIntent(intent),
      ];
    case 'explain_tour_booking':
      return [
        ...EXPLAIN_TOUR_BOOKING_PROMPTS,
        ...tourConsumerMultilingualForIntent(intent),
      ];
    case 'explain_tour_day_slots':
      return [
        ...EXPLAIN_TOUR_DAY_SLOTS_PROMPTS,
        ...tourConsumerMultilingualForIntent(intent),
      ];
    case 'diagnose_tour_capacity':
      return [
        ...DIAGNOSE_TOUR_CAPACITY_PROMPTS,
        ...tourConsumerMultilingualForIntent(intent),
      ];
    case 'explain_tour_booking_record':
      return [
        ...EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS,
        ...tourConsumerMultilingualForIntent(intent),
      ];
    case 'explain_tour_meeting_point':
      return [
        ...EXPLAIN_TOUR_MEETING_POINT_PROMPTS,
        ...EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS,
      ];
    case 'explain_checkout_recommendations':
      return checkoutRecommendationsForIntent(intent);
    case 'refer_a_friend':
    case 'share_salon_link':
      return growthLoopsForIntent(intent);
    default:
      return [];
  }
}

export function auditCustomerIntentPromotionFixtures(): CustomerIntentPromotionFixtureAuditRow[] {
  return CUSTOMER_INTENT_PROMOTION_INTENT_LIST.map((intent) => {
    const rows = fixtureRowsForPromotionIntent(intent);
    const counts = countLocales(rows);
    return {
      intent,
      enCount: counts.en,
      hyCount: counts.hy,
      ruCount: counts.ru,
      evalIdPrefixes: CUSTOMER_INTENT_PROMOTION_EVAL_ID_PREFIXES[intent] ?? [],
    };
  });
}

export function listCustomerIntentPromotionFixtureGaps(): string[] {
  const gaps: string[] = [];
  for (const row of auditCustomerIntentPromotionFixtures()) {
    if (row.enCount < CUSTOMER_INTENT_PROMOTION_MIN_EN_FIXTURES) {
      gaps.push(
        `${row.intent}: EN fixtures ${row.enCount} < ${CUSTOMER_INTENT_PROMOTION_MIN_EN_FIXTURES}`,
      );
    }
    if (row.hyCount < CUSTOMER_INTENT_PROMOTION_MIN_HY_FIXTURES) {
      gaps.push(
        `${row.intent}: HY fixtures ${row.hyCount} < ${CUSTOMER_INTENT_PROMOTION_MIN_HY_FIXTURES}`,
      );
    }
    if (row.ruCount < CUSTOMER_INTENT_PROMOTION_MIN_RU_FIXTURES) {
      gaps.push(
        `${row.intent}: RU fixtures ${row.ruCount} < ${CUSTOMER_INTENT_PROMOTION_MIN_RU_FIXTURES}`,
      );
    }
    if (row.evalIdPrefixes.length === 0) {
      gaps.push(`${row.intent}: missing eval id prefixes`);
    }
  }
  return gaps;
}

export function collectCustomerPromotionFixtureIntents(): Set<string> {
  const covered = new Set<string>();
  for (const intent of CUSTOMER_INTENT_PROMOTION_INTENT_LIST) {
    const rows = fixtureRowsForPromotionIntent(intent);
    if (rows.length > 0) covered.add(intent);
  }
  return covered;
}

export function promotionEvalIdTargetsCustomerSurface(
  evalCaseId: string,
): boolean {
  for (const prefixes of Object.values(
    CUSTOMER_INTENT_PROMOTION_EVAL_ID_PREFIXES,
  )) {
    if (prefixes.some((prefix) => evalCaseId.startsWith(prefix))) {
      return true;
    }
  }
  if (evalCaseId.startsWith('promotion-i18n-')) return true;
  if (evalCaseId.startsWith('self-service-i18n-')) return true;
  if (evalCaseId.startsWith('marketing-growth-i18n-')) return true;
  return false;
}

function firstEnPromptForIntent(intent: string): string {
  const rows = fixtureRowsForPromotionIntent(intent);
  const enRow = rows.find((row) => detectFixtureLocale(row) === 'en');
  return enRow?.prompt ?? rows[0]?.prompt ?? intent;
}

export const CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS: readonly CustomerIntentPromotionIntegrationRow[] =
  CUSTOMER_INTENT_PROMOTION_INTENT_LIST.map((intent) => ({
    id: intent,
    intent,
    prompt: firstEnPromptForIntent(intent),
  }));

export function flattenPromotionEvalIdPrefixes(): string[] {
  return [
    ...new Set(
      Object.values(CUSTOMER_INTENT_PROMOTION_EVAL_ID_PREFIXES).flat(),
    ),
  ];
}
