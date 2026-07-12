import {
  auditCustomerIntentCoverage,
  collectCustomerEvalIntents,
  collectCustomerFixtureIntents,
  CUSTOMER_INTENT_COVERAGE_DEFERRED,
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  hasCustomerApiBinding,
  listCustomerIntentCoverageGaps,
  listMutatingCustomerIntentsMissingApiBinding,
  prioritizeDeferredCustomerIntents,
} from './ai-customer-intent-coverage.util.js';
import { SELF_SERVICE_BOOKING_MUTATE_INTENTS } from './ai-self-service-booking.util.js';
import {
  assertPromotionQueuePrioritizesP0,
  auditCustomerIntentPromotionQueue,
  listCustomerIntentPromotionRegistryGaps,
  listP0CustomerIntentPromotionIntents,
} from './ai-customer-intent-promotion.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai customer intent coverage util (ai-cmd-customer-2.6)', () => {
  it('collects customer eval intents from compound and rescue eval rows', () => {
    const evalIntents = collectCustomerEvalIntents(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(evalIntents.has('book_package')).toBe(true);
    expect(evalIntents.has('book_nearest_slot')).toBe(true);
    expect(evalIntents.has('check_providers_for_service')).toBe(true);
  });

  it('collects customer fixture intents from decomposition and domain fixtures', () => {
    const fixtureIntents = collectCustomerFixtureIntents();
    expect(fixtureIntents.has('book_package')).toBe(true);
    expect(fixtureIntents.has('list_services')).toBe(true);
    expect(fixtureIntents.has('check_providers_for_service')).toBe(true);
  });

  it('cross-checks mutating intents against the customer/public API parity fixtures (ai-cmd-customer-6.13.3)', () => {
    expect(hasCustomerApiBinding('cancel_my_booking')).toBe(true);
    expect(hasCustomerApiBinding('reschedule_package_lines')).toBe(true);
    expect(hasCustomerApiBinding('not_a_real_intent')).toBe(false);

    // Known, documented exceptions — not a coverage gap:
    // - add/remove_service_from_cart: pure client-side cart session state, no REST call.
    // - join_waitlist / notify_running_late: backend routes exist
    //   (POST me/waitlist, POST me/bookings/:id/running-late) but neither public-api.ts
    //   client (web widget or consumer app) exports a wrapper for them yet — a real
    //   product gap to track, distinct from an AI-mapping gap.
    // - cancel_all_upcoming_bookings (ai-cmd-customer-6.12.7): backend route
    //   (POST me/bookings/bulk-cancel) and the AI intent both ship in this change, but
    //   there is no consumer-app/web-widget UI button for it yet — the AI orchestrator
    //   calls PublicCustomerBookingService directly, so no public-api.ts client wrapper
    //   exists to bind to. Same shape as join_waitlist/notify_running_late above.
    const knownExceptions = new Set([
      'add_services_to_cart',
      'remove_service_from_cart',
      'join_waitlist',
      'notify_running_late',
      'cancel_all_upcoming_bookings',
    ]);
    const missing = listMutatingCustomerIntentsMissingApiBinding(
      SELF_SERVICE_BOOKING_MUTATE_INTENTS,
    ).filter((intent) => !knownExceptions.has(intent));
    expect(missing).toEqual([]);
  });
});

describe('ai customer intent coverage gate (ai-cmd-customer-2.6)', () => {
  it('covers every shipped required customer intent with fixtures and eval', () => {
    const gaps = listCustomerIntentCoverageGaps(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(gaps).toEqual([]);
  });

  it('documents deferred registry intents separately from the required gate', () => {
    expect(CUSTOMER_INTENT_COVERAGE_DEFERRED.size).toBeGreaterThan(10);
    for (const intent of CUSTOMER_INTENT_COVERAGE_REQUIRED) {
      expect(CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent)).toBe(false);
    }
  });

  it('reports audit rows for every non-meta customer registry intent', () => {
    const rows = auditCustomerIntentCoverage(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(rows.length).toBeGreaterThan(40);
    expect(rows.every((row) => row.intent.length > 0)).toBe(true);
  });

  it('prioritizes deferred intents using the 4.0 promotion queue (ai-cmd-customer-4.0.1)', () => {
    expect(listCustomerIntentPromotionRegistryGaps()).toEqual([]);
    const ordered = prioritizeDeferredCustomerIntents();
    expect(assertPromotionQueuePrioritizesP0(ordered)).toEqual([]);
    expect(listP0CustomerIntentPromotionIntents().length).toBe(4);

    const promotionAudit = auditCustomerIntentPromotionQueue(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(promotionAudit[0]?.tier).toBe('P0');
    expect(promotionAudit[0]?.intent).toBe('cancel_my_booking');
  });
});
