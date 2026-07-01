import { CUSTOMER_INTENT_PROMOTION_INTENT_LIST } from './ai-customer-intent-promotion.intents.js';
import { CUSTOMER_INTENTS } from './ai-command-registry.build.js';
import {
  CUSTOMER_INTENT_COVERAGE_DEFERRED,
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  auditCustomerIntentCoverage,
} from './ai-customer-intent-coverage.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export type CustomerIntentPromotionTier = 'P0' | 'P1' | 'P2' | 'P3';

export type CustomerIntentPromotionSurface =
  | 'customer'
  | 'customer+public'
  | 'public';

export interface CustomerIntentPromotionGroup {
  tier: CustomerIntentPromotionTier;
  /** Shipped per ai-cmd-customer-4.0 promotion table in TODO.md */
  shipped: true;
  surfaces: CustomerIntentPromotionSurface;
  intents: readonly string[];
  todoRef: string;
}

/** Ordered promotion queue — ai-cmd-customer-4.0.1 audit source of truth. */
export const CUSTOMER_INTENT_PROMOTION_QUEUE: readonly CustomerIntentPromotionGroup[] =
  [
    {
      tier: 'P0',
      shipped: true,
      surfaces: 'customer',
      intents: ['cancel_my_booking', 'reschedule_my_booking'],
      todoRef: 'ai-cmd-customer-4.4.2 / 4.4.3',
    },
    {
      tier: 'P0',
      shipped: true,
      surfaces: 'customer+public',
      intents: ['pay_online', 'explain_why_stripe_required'],
      todoRef: 'ai-cmd-customer-4.2.4 / ai-cmd-ext-7.1',
    },
    {
      tier: 'P1',
      shipped: true,
      surfaces: 'customer+public',
      intents: [
        'book_multi_service',
        'check_multi_service_availability',
        'promo_code_help',
      ],
      todoRef: 'ai-cmd-customer-4.0 P1',
    },
    {
      tier: 'P1',
      shipped: true,
      surfaces: 'customer',
      intents: [
        'use_subscription_credit',
        'my_subscriptions',
        'loyalty_points_balance',
      ],
      todoRef: 'ai-cmd-customer-4.0 P1',
    },
    {
      tier: 'P2',
      shipped: true,
      surfaces: 'customer',
      intents: ['privacy_export', 'privacy_delete', 'request_gift_card_cancel'],
      todoRef: 'ai-cmd-customer-4.0 P2',
    },
    {
      tier: 'P2',
      shipped: true,
      surfaces: 'customer',
      intents: [
        'cancel_package_visit_self',
        'reschedule_package_visit_self',
        'list_my_package_visits',
      ],
      todoRef: 'ai-cmd-customer-4.0 P2',
    },
    {
      tier: 'P3',
      shipped: true,
      surfaces: 'customer+public',
      intents: [
        'explain_tour_booking',
        'explain_tour_day_slots',
        'diagnose_tour_capacity',
        'explain_tour_booking_record',
        'explain_tour_meeting_point',
        'explain_checkout_recommendations',
      ],
      todoRef: 'ai-cmd-customer-4.0 P3',
    },
    {
      tier: 'P3',
      shipped: true,
      surfaces: 'customer',
      intents: ['refer_a_friend', 'share_salon_link'],
      todoRef: 'ai-cmd-customer-4.0 P3',
    },
  ] as const;

const TIER_ORDER: Record<CustomerIntentPromotionTier, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

export type CustomerIntentPromotionCoverageBucket =
  | 'required'
  | 'deferred'
  | 'not_tracked';

export interface CustomerIntentPromotionAuditRow {
  intent: string;
  tier: CustomerIntentPromotionTier;
  promotionRank: number;
  surfaces: CustomerIntentPromotionSurface;
  coverageBucket: CustomerIntentPromotionCoverageBucket;
  hasEval: boolean;
  hasFixture: boolean;
  readyForRequiredPromotion: boolean;
  todoRef: string;
}

export function flattenCustomerIntentPromotionIntents(): string[] {
  return [...CUSTOMER_INTENT_PROMOTION_INTENT_LIST];
}

export function getCustomerIntentPromotionTier(
  intent: string,
): CustomerIntentPromotionTier | undefined {
  for (const group of CUSTOMER_INTENT_PROMOTION_QUEUE) {
    if (group.intents.includes(intent)) return group.tier;
  }
  return undefined;
}

export function getCustomerIntentPromotionCoverageBucket(
  intent: string,
): CustomerIntentPromotionCoverageBucket {
  if (CUSTOMER_INTENT_COVERAGE_REQUIRED.includes(intent)) return 'required';
  if (CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent)) return 'deferred';
  return 'not_tracked';
}

function promotionMetaForIntent(intent: string): {
  tier: CustomerIntentPromotionTier;
  surfaces: CustomerIntentPromotionSurface;
  todoRef: string;
} | null {
  for (const group of CUSTOMER_INTENT_PROMOTION_QUEUE) {
    if (!group.intents.includes(intent)) continue;
    return {
      tier: group.tier,
      surfaces: group.surfaces,
      todoRef: group.todoRef,
    };
  }
  return null;
}

export function auditCustomerIntentPromotionQueue(
  evalCases: readonly AiCommandEvalCase[],
): CustomerIntentPromotionAuditRow[] {
  const coverageByIntent = new Map(
    auditCustomerIntentCoverage(evalCases).map((row) => [row.intent, row]),
  );

  return flattenCustomerIntentPromotionIntents().map((intent, index) => {
    const meta = promotionMetaForIntent(intent)!;
    const coverage = coverageByIntent.get(intent);
    const hasEval = coverage?.hasEval ?? false;
    const hasFixture = coverage?.hasFixture ?? false;
    const bucket = getCustomerIntentPromotionCoverageBucket(intent);

    return {
      intent,
      tier: meta.tier,
      promotionRank: index,
      surfaces: meta.surfaces,
      coverageBucket: bucket,
      hasEval,
      hasFixture,
      readyForRequiredPromotion: bucket === 'deferred' && hasEval && hasFixture,
      todoRef: meta.todoRef,
    };
  });
}

export function listCustomerIntentPromotionRegistryGaps(): string[] {
  const gaps: string[] = [];
  for (const intent of flattenCustomerIntentPromotionIntents()) {
    if (!CUSTOMER_INTENTS.includes(intent)) {
      gaps.push(`${intent}: missing from CUSTOMER_INTENTS registry`);
    }
  }
  return gaps;
}

/** Intents still in DEFERRED that appear in the shipped promotion table (4.0.2 backlog). */
export function listDeferredCustomerIntentPromotionBacklog(): string[] {
  return flattenCustomerIntentPromotionIntents().filter((intent) =>
    CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent),
  );
}

/** P0 intents that must lead the promotion backlog (ai-cmd-customer-4.0.1). */
export function listP0CustomerIntentPromotionIntents(): string[] {
  return CUSTOMER_INTENT_PROMOTION_QUEUE.filter(
    (group) => group.tier === 'P0',
  ).flatMap((group) => group.intents);
}

export function prioritizeDeferredCustomerIntents(
  deferred: ReadonlySet<string> = CUSTOMER_INTENT_COVERAGE_DEFERRED,
): string[] {
  const promotionRank = new Map(
    flattenCustomerIntentPromotionIntents().map((intent, index) => [
      intent,
      index,
    ]),
  );

  return [...deferred].sort((left, right) => {
    const leftRank = promotionRank.get(left);
    const rightRank = promotionRank.get(right);
    if (leftRank != null && rightRank != null) return leftRank - rightRank;
    if (leftRank != null) return -1;
    if (rightRank != null) return 1;
    return left.localeCompare(right);
  });
}

export function assertPromotionQueuePrioritizesP0(
  orderedDeferred: readonly string[],
): string[] {
  const errors: string[] = [];
  const p0 = new Set(listP0CustomerIntentPromotionIntents());
  const firstPromotionIndex = orderedDeferred.findIndex((intent) =>
    getCustomerIntentPromotionTier(intent),
  );
  const firstNonP0PromotionIndex = orderedDeferred.findIndex((intent) => {
    const tier = getCustomerIntentPromotionTier(intent);
    return tier != null && tier !== 'P0';
  });

  for (const intent of listP0CustomerIntentPromotionIntents()) {
    if (!CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent)) continue;
    const index = orderedDeferred.indexOf(intent);
    if (index === -1) {
      errors.push(`${intent}: expected in deferred promotion backlog`);
    }
  }

  if (
    firstPromotionIndex >= 0 &&
    firstNonP0PromotionIndex >= 0 &&
    firstNonP0PromotionIndex < firstPromotionIndex &&
    p0.size > 0
  ) {
    errors.push(
      'promotion backlog must list P0 intents before P1/P2/P3 deferred rows',
    );
  }

  return errors;
}

export function summarizeCustomerIntentPromotionAudit(
  rows: readonly CustomerIntentPromotionAuditRow[],
): {
  total: number;
  deferred: number;
  required: number;
  readyForRequiredPromotion: number;
  p0Deferred: number;
} {
  const p0 = new Set(listP0CustomerIntentPromotionIntents());
  return {
    total: rows.length,
    deferred: rows.filter((row) => row.coverageBucket === 'deferred').length,
    required: rows.filter((row) => row.coverageBucket === 'required').length,
    readyForRequiredPromotion: rows.filter(
      (row) => row.readyForRequiredPromotion,
    ).length,
    p0Deferred: rows.filter(
      (row) => row.coverageBucket === 'deferred' && p0.has(row.intent),
    ).length,
  };
}
