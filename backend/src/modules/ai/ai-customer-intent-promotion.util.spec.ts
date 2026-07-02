import {
  CUSTOMER_INTENT_PROMOTION_QUEUE,
  assertPromotionQueuePrioritizesP0,
  auditCustomerIntentPromotionQueue,
  flattenCustomerIntentPromotionIntents,
  getCustomerIntentPromotionTier,
  listCustomerIntentPromotionRegistryGaps,
  listDeferredCustomerIntentPromotionBacklog,
  listP0CustomerIntentPromotionIntents,
  prioritizeDeferredCustomerIntents,
  summarizeCustomerIntentPromotionAudit,
} from './ai-customer-intent-promotion.util.js';
import {
  CUSTOMER_INTENT_COVERAGE_DEFERRED,
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
} from './ai-customer-intent-coverage.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-customer-intent-promotion.util (ai-cmd-customer-4.0.1)', () => {
  it('defines shipped promotion queue with P0 before P1/P2/P3', () => {
    const tiers = CUSTOMER_INTENT_PROMOTION_QUEUE.map((group) => group.tier);
    expect(tiers.indexOf('P0')).toBeLessThan(tiers.indexOf('P1'));
    expect(tiers.indexOf('P1')).toBeLessThan(tiers.indexOf('P2'));
    expect(tiers.indexOf('P2')).toBeLessThan(tiers.indexOf('P3'));
  });

  it('lists every shipped 4.0 promotion intent exactly once', () => {
    const flattened = flattenCustomerIntentPromotionIntents();
    expect(flattened).toEqual([
      'cancel_my_booking',
      'reschedule_my_booking',
      'pay_online',
      'explain_why_stripe_required',
      'book_multi_service',
      'check_multi_service_availability',
      'promo_code_help',
      'use_subscription_credit',
      'my_subscriptions',
      'loyalty_points_balance',
      'privacy_export',
      'privacy_delete',
      'request_gift_card_cancel',
      'cancel_package_visit_self',
      'reschedule_package_visit_self',
      'list_my_package_visits',
      'explain_tour_booking',
      'explain_tour_day_slots',
      'diagnose_tour_capacity',
      'explain_tour_booking_record',
      'explain_tour_meeting_point',
      'explain_checkout_recommendations',
      'refer_a_friend',
      'share_salon_link',
    ]);
    expect(listCustomerIntentPromotionRegistryGaps()).toEqual([]);
  });

  it('maps P0 intents to tier P0', () => {
    for (const intent of listP0CustomerIntentPromotionIntents()) {
      expect(getCustomerIntentPromotionTier(intent)).toBe('P0');
    }
  });

  it('prioritizes deferred registry intents with P0 promotion rows first when still deferred', () => {
    const ordered = prioritizeDeferredCustomerIntents();
    expect(assertPromotionQueuePrioritizesP0(ordered)).toEqual([]);

    const backlog = listDeferredCustomerIntentPromotionBacklog();
    for (const intent of listP0CustomerIntentPromotionIntents()) {
      if (CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent)) {
        expect(backlog).toContain(intent);
      }
    }

    const firstPromotion = ordered.find((intent) =>
      getCustomerIntentPromotionTier(intent),
    );
    if (
      firstPromotion &&
      CUSTOMER_INTENT_COVERAGE_DEFERRED.has(firstPromotion)
    ) {
      expect(getCustomerIntentPromotionTier(firstPromotion)).toBe('P0');
    }
  });

  it('audits promotion queue against eval + fixture coverage without registry gaps', () => {
    const rows = auditCustomerIntentPromotionQueue(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(rows).toHaveLength(flattenCustomerIntentPromotionIntents().length);
    expect(listCustomerIntentPromotionRegistryGaps()).toEqual([]);

    const summary = summarizeCustomerIntentPromotionAudit(rows);
    expect(summary.total).toBe(24);
    expect(summary.required).toBe(24);
    expect(summary.deferred).toBe(0);
    expect(summary.readyForRequiredPromotion).toBe(0);
    expect(summary.p0Deferred).toBe(0);

    for (const row of rows) {
      expect(row.hasEval).toBe(true);
      expect(row.hasFixture).toBe(true);
      expect(row.coverageBucket).toBe('required');
    }
  });
});
