import { AI_CMD_RESCUE_SCENARIOS } from './ai-cmd-eval.fixtures.js';
import {
  BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS } from './ai-discover-book-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_CUSTOMER_PROMPTS } from './ai-rebook-and-pay-compound.fixtures.js';
import { CANCEL_AND_REBOOK_CUSTOMER_PROMPTS } from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS } from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS } from './ai-gift-card-checkout-compound.fixtures.js';
import { MULTI_SERVICE_DAY_CUSTOMER_PROMPTS } from './ai-multi-service-day-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS } from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS } from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { getCustomerNativeIntents } from './ai-capability.matrix.js';
import { CUSTOMER_INTENTS } from './ai-command-registry.build.js';
import {
  BOOK_LAB_COLLECTION_PROMPTS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
} from './ai-clinic-lab-booking.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_PROMPTS } from './ai-book-lab-collection-nearest.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS } from './ai-explain-clinic-booking-fields.fixtures.js';
import { SIMILAR_CUSTOMER_PACKAGE_PROMPTS } from './ai-consumer-package-booking.fixtures.js';
import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';
import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from './ai-switch-salon-tenant-multilingual.fixtures.js';

const SAVED_SALONS_PROMPT_SCENARIOS = [
  ...FIND_MY_SAVED_SALONS_PROMPTS,
  ...SWITCH_SALON_TENANT_PROMPTS,
] as const;
import { MANAGE_NOTIFICATION_PREFERENCES_PROMPTS } from './ai-manage-notification-preferences.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_PROMPTS } from './ai-explain-my-notifications.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-explain-my-notifications-multilingual.fixtures.js';
import { UPDATE_MY_PROFILE_PROMPTS } from './ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-update-my-profile-multilingual.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_PROMPTS } from './ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from './ai-how-to-download-app-multilingual.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_PROMPTS } from './ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-cart-multilingual.fixtures.js';
import { BOOK_WITH_GIFT_CARD_PROMPTS } from './ai-book-with-gift-card.fixtures.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS } from './ai-book-with-gift-card-multilingual.fixtures.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS } from './ai-track-physical-gift-card-order.fixtures.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS } from './ai-track-physical-gift-card-order-multilingual.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_PROMPTS } from './ai-explain-package-savings.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS } from './ai-explain-package-savings-multilingual.fixtures.js';
import { EXPLAIN_LAB_PREP_PROMPTS } from './ai-explain-lab-prep.fixtures.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS } from './ai-explain-lab-prep-multilingual.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_PROMPTS } from './ai-track-lab-order-status.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS } from './ai-track-lab-order-status-multilingual.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import {
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
  type FlexibleAvailabilityPromptFixture,
} from './ai-flexible-availability.fixtures.js';
import { mapFlexibleAvailabilityActionForSurface } from './ai-flexible-availability.eval.util.js';
import {
  ALL_GIFT_CARD_CHECKOUT_PROMPTS,
  GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS,
} from './ai-gift-card-payments.fixtures.js';
import { MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS } from './ai-service-discovery-multilingual.fixtures.js';
import { SIMILAR_SERVICE_RANK_PROMPTS } from './ai-service-rank-discovery.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import {
  collectCustomerPromotionFixtureIntents,
  promotionEvalIdTargetsCustomerSurface,
} from './ai-customer-intent-promotion-coverage.util.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from './intent-decomposition.fixtures.js';

const CUSTOMER_INTENT_META = new Set([
  'unknown',
  'error',
  'security_blocked',
  'clarify',
  'compound_intent',
]);

/** Shipped native customer intents gated for fixture + customer-surface eval (ai-cmd-customer-2.6). */
export const CUSTOMER_INTENT_COVERAGE_REQUIRED: readonly string[] = [
  'book_package',
  'discover_packages',
  'check_package_availability',
  'book_with_cash',
  'add_services_to_cart',
  'list_my_appointments',
  'list_my_upcoming_appointments',
  'confirm_my_booking_details',
  'add_booking_to_calendar',
  'get_directions_to_salon',
  'book_another_service',
  'explain_preparation_notes',
  'get_manage_link',
  'recover_lost_manage_link',
  'find_my_saved_salons',
  'switch_salon_tenant',
  'check_providers_for_service',
  'book_nearest_slot',
  'check_gift_card_balance',
  'apply_gift_card_code',
  'choose_payment_method',
  'buy_gift_card_physical',
  'buy_gift_card_for_someone',
  'track_physical_gift_card_order',
  'pay_cash_at_visit',
  'list_my_test_results',
  'book_lab_collection',
  'book_lab_from_order',
  'list_my_lab_booking_requests',
  'contact_support',
  // ai-cmd-customer-4.0.2 — promoted P0→P3 intents
  'cancel_my_booking',
  'reschedule_my_booking',
  'pay_online',
  'explain_why_stripe_required',
  'diagnose_stripe_checkout_failure',
  'pay_at_venue_fallback',
  'resume_booking_draft',
  'explain_slot_no_longer_available',
  'explain_multi_service_payment_return',
  'retry_failed_network_action',
  'explain_voice_input',
  'speak_assistant_reply',
  'give_ai_feedback',
  'explain_rtl_layout',
  'book_multi_service',
  'check_multi_service_availability',
  'promo_code_help',
  'apply_promo_code_checkout',
  'how_to_download_app',
  'explain_multi_service_cart',
  'explain_package_savings',
  'explain_subscription_vs_one_time',
  'explain_lab_prep',
  'explain_public_intake_form',
  'complete_intake_and_book',
  'track_lab_order_status',
  'book_with_gift_card',
  'apply_loyalty_at_checkout',
  'use_subscription_credit',
  'my_subscriptions',
  'explain_my_subscription',
  'update_my_profile',
  'loyalty_points_balance',
  'privacy_export',
  'claim_gift_card_balance',
  'privacy_delete',
  'request_gift_card_cancel',
  'cancel_package_visit_self',
  'reschedule_package_visit_self',
  'list_my_package_visits',
  'explain_package_visit_rules',
  'explain_tour_booking',
  'explain_tour_day_slots',
  'diagnose_tour_capacity',
  'explain_tour_booking_record',
  'explain_tour_meeting_point',
  'explain_checkout_recommendations',
  'dismiss_recommendations',
  'refer_a_friend',
  'share_salon_link',
];

/** Registry intents tracked in parity-2.3 but not yet gated (ai-cmd-customer-2.6). */
export const CUSTOMER_INTENT_COVERAGE_DEFERRED = new Set<string>(
  getCustomerNativeIntents('client').filter(
    (intent) =>
      !CUSTOMER_INTENT_META.has(intent) &&
      !CUSTOMER_INTENT_COVERAGE_REQUIRED.includes(intent),
  ),
);

export type CustomerIntentCoverageRow = {
  intent: string;
  hasEval: boolean;
  hasFixture: boolean;
};

export function acceptableCustomerEvalActions(
  intent: string,
): readonly string[] {
  switch (intent) {
    case 'check_availability':
      return ['check_availability', 'check_providers_for_service'];
    case 'book_appointment':
      return ['book_appointment', 'book_nearest_slot'];
    default:
      return [intent];
  }
}

function resolveMultilingualScenarioForEvalCase(
  evalCaseId: string,
): (typeof MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS)[number] | undefined {
  const direct = MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.find(
    (row) => row.id === evalCaseId,
  );
  if (direct) return direct;

  for (const suffix of ['-public', '-customer'] as const) {
    if (!evalCaseId.endsWith(suffix)) continue;
    const baseId = evalCaseId.slice(0, -suffix.length);
    return MULTILINGUAL_SERVICE_DISCOVERY_SCENARIOS.find(
      (row) => row.id === baseId,
    );
  }

  return undefined;
}

function inferDiscoverIntentFromParams(
  params?: Record<string, unknown>,
): string[] {
  if (!params) return [];
  const intents: string[] = [];
  if (params.maxPrice != null || params.serviceRank != null) {
    intents.push('list_services');
  }
  if (params.availabilityWindows != null) {
    intents.push('check_availability', 'check_providers_for_service');
  }
  if (params.serviceCategory != null && intents.length === 0) {
    intents.push('list_services');
  }
  return intents;
}

function extractDiscoverEvalIntents(evalCase: AiCommandEvalCase): string[] {
  const expect = evalCase.expect as Record<string, unknown>;
  const kind = expect.discoverCrossSprintKind;
  if (typeof kind !== 'string') return [];

  if (kind === 'multilingual') {
    const scenario = resolveMultilingualScenarioForEvalCase(evalCase.id);
    if (!scenario) return [];
    if (scenario.expectedAction) return [scenario.expectedAction];
    return inferDiscoverIntentFromParams(scenario.expectedParams);
  }

  if (kind === 'consumer-chip') {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === evalCase.id,
    );
    if (!chip) return [];
    if (chip.domain === 'budget' || chip.domain === 'rank') {
      return chip.domain === 'budget'
        ? ['find_services_under_budget']
        : ['list_services'];
    }
    if (chip.domain === 'availability') {
      return ['find_evening_weekend_slots'];
    }
    return ['check_availability', 'check_providers_for_service'];
  }

  const intents: string[] = [];
  const expectRecord = evalCase.expect as Record<string, unknown>;
  if (typeof expectRecord.rescuedAction === 'string') {
    intents.push(expectRecord.rescuedAction);
  }
  for (const step of Array.isArray(expectRecord.discoverCompoundSteps)
    ? expectRecord.discoverCompoundSteps
    : []) {
    if (typeof step === 'string') intents.push(step);
  }
  return intents;
}

function aiCmdRescueScenarioForEvalCase(
  evalCase: AiCommandEvalCase,
): (typeof AI_CMD_RESCUE_SCENARIOS)[number] | undefined {
  if (!evalCase.id.startsWith('ai-cmd-')) return undefined;
  const scenarioId = evalCase.id.slice('ai-cmd-'.length);
  return AI_CMD_RESCUE_SCENARIOS.find((row) => row.id === scenarioId);
}

function consumerAdoptionScenarioForEvalCase(
  evalCase: AiCommandEvalCase,
): (typeof SAVED_SALONS_PROMPT_SCENARIOS)[number] | undefined {
  if (!evalCase.id.startsWith('consumer-adoption-')) {
    if (evalCase.id.startsWith('find-saved-salons-')) {
      const scenarioId = evalCase.id.slice('find-saved-salons-'.length);
      return FIND_MY_SAVED_SALONS_PROMPTS.find((row) => row.id === scenarioId);
    }
    if (evalCase.id.startsWith('switch-salon-')) {
      const scenarioId = evalCase.id.slice('switch-salon-'.length);
      return SWITCH_SALON_TENANT_PROMPTS.find((row) => row.id === scenarioId);
    }
    return undefined;
  }
  const scenarioId = evalCase.id.slice('consumer-adoption-'.length);
  return SAVED_SALONS_PROMPT_SCENARIOS.find((row) => row.id === scenarioId);
}

export function evalCaseTargetsCustomerSurface(
  evalCase: AiCommandEvalCase,
): boolean {
  if (evalCase.surface === 'customer') return true;
  if (evalCase.expect.compoundSurface === 'customer') return true;

  const aiCmdScenario = aiCmdRescueScenarioForEvalCase(evalCase);
  if (aiCmdScenario?.surface === 'customer') return true;

  const adoptionScenario = consumerAdoptionScenarioForEvalCase(evalCase);
  if (
    adoptionScenario?.surface === 'customer' ||
    adoptionScenario?.surface === 'both'
  ) {
    return true;
  }

  if (evalCase.id.startsWith('list-my-test-results-')) return true;
  if (evalCase.id.startsWith('book-lab-collection-')) return true;
  if (evalCase.id.startsWith('list-my-lab-booking-requests-')) return true;
  if (evalCase.id.startsWith('compound-customer-')) return true;
  if (promotionEvalIdTargetsCustomerSurface(evalCase.id)) return true;

  return false;
}

export function extractEvalIntentsFromCase(
  evalCase: AiCommandEvalCase,
): Set<string> {
  const intents = new Set<string>();
  if (!evalCaseTargetsCustomerSurface(evalCase)) return intents;

  const expect = evalCase.expect;
  for (const key of ['action', 'rescuedAction', 'enrichedAction'] as const) {
    const value = expect[key];
    if (typeof value === 'string') intents.add(value);
  }
  for (const step of expect.compoundSteps ?? []) intents.add(step);
  for (const step of expect.compoundActionsContains ?? []) intents.add(step);
  for (const intent of extractDiscoverEvalIntents(evalCase))
    intents.add(intent);

  return intents;
}

export function collectCustomerEvalIntents(
  evalCases: readonly AiCommandEvalCase[],
): Set<string> {
  const covered = new Set<string>();
  for (const evalCase of evalCases) {
    for (const intent of extractEvalIntentsFromCase(evalCase)) {
      covered.add(intent);
    }
  }
  return covered;
}

function addCompoundScenarioFixtureIntents(
  covered: Set<string>,
  scenario: (typeof COMPOUND_DECOMPOSITION_SCENARIOS)[number],
): void {
  for (const action of scenario.orderedActions ?? []) covered.add(action);
  for (const action of scenario.actions ?? []) covered.add(action);
}

function addScenarioFixtureIntents(
  covered: Set<string>,
  rows: ReadonlyArray<{
    surface?: string;
    expectedAction?: string;
    customerExpectedAction?: string;
    customerCompoundSteps?: readonly string[];
  }>,
): void {
  for (const row of rows) {
    if (row.surface === 'dashboard') continue;
    if (row.customerExpectedAction) covered.add(row.customerExpectedAction);
    if (row.expectedAction && row.surface !== 'public') {
      covered.add(row.expectedAction);
    }
    if (row.expectedAction && row.surface === 'both') {
      covered.add(row.expectedAction);
    }
    for (const step of row.customerCompoundSteps ?? []) covered.add(step);
  }
}

function addFlexibleAvailabilityFixtureIntents(
  covered: Set<string>,
  rows: readonly FlexibleAvailabilityPromptFixture[],
): void {
  for (const row of rows) {
    if (row.surface === 'dashboard' || row.surface === 'public') continue;
    if (row.customerExpectedAction) {
      covered.add(row.customerExpectedAction);
      continue;
    }
    if (row.expectedAction) {
      covered.add(mapFlexibleAvailabilityActionForSurface(row, 'customer'));
    }
    for (const step of row.customerCompoundSteps ?? []) covered.add(step);
  }
}

function addGiftCardCheckoutFixtureIntents(covered: Set<string>): void {
  for (const row of ALL_GIFT_CARD_CHECKOUT_PROMPTS) {
    for (const action of row.orderedActions) covered.add(action);
  }
  for (const row of GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS) {
    for (const action of row.orderedActions) covered.add(action);
  }
}

export function collectCustomerFixtureIntents(): Set<string> {
  const covered = new Set<string>();

  for (const scenario of COMPOUND_DECOMPOSITION_SCENARIOS) {
    if (scenario.surface !== 'customer') continue;
    addCompoundScenarioFixtureIntents(covered, scenario);
  }

  for (const scenario of AI_CMD_RESCUE_SCENARIOS) {
    if (scenario.surface !== 'customer') continue;
    covered.add(scenario.expectedAction);
  }

  addScenarioFixtureIntents(covered, SIMILAR_BUDGET_SERVICE_PROMPTS);
  addScenarioFixtureIntents(covered, SIMILAR_SERVICE_RANK_PROMPTS);
  addFlexibleAvailabilityFixtureIntents(
    covered,
    SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
  );
  addScenarioFixtureIntents(covered, BUDGET_SERVICE_DISCOVERY_CUSTOMER_PROMPTS);
  for (const row of DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of REBOOK_AND_PAY_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of CANCEL_AND_REBOOK_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of MULTI_SERVICE_DAY_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  for (const row of GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS) {
    for (const action of row.orderedActions) {
      covered.add(action);
    }
  }
  addScenarioFixtureIntents(covered, SIMILAR_CUSTOMER_PACKAGE_PROMPTS);
  addGiftCardCheckoutFixtureIntents(covered);

  for (const row of SAVED_SALONS_PROMPT_SCENARIOS) {
    if (row.surface === 'customer' || row.surface === 'both') {
      covered.add(row.expectedAction);
    }
  }
  for (const row of FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  for (const row of SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, MANAGE_NOTIFICATION_PREFERENCES_PROMPTS);
  for (const row of MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, EXPLAIN_MY_NOTIFICATIONS_PROMPTS);
  for (const row of EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, UPDATE_MY_PROFILE_PROMPTS);
  for (const row of UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, HOW_TO_DOWNLOAD_APP_PROMPTS);
  for (const row of HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, EXPLAIN_MULTI_SERVICE_CART_PROMPTS);
  for (const row of EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, BOOK_WITH_GIFT_CARD_PROMPTS);
  for (const row of BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS);
  for (const row of TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, EXPLAIN_PACKAGE_SAVINGS_PROMPTS);
  for (const row of EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, EXPLAIN_LAB_PREP_PROMPTS);
  for (const row of EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  addScenarioFixtureIntents(covered, TRACK_LAB_ORDER_STATUS_PROMPTS);
  for (const row of TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS) {
    covered.add(row.expectedAction);
  }
  covered.add('list_my_test_results');
  covered.add('explain_result_status');
  for (const row of BOOK_LAB_COLLECTION_PROMPTS) {
    covered.add('book_lab_collection');
  }
  for (const row of LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS) {
    covered.add('list_my_lab_booking_requests');
  }
  for (const row of BOOK_LAB_COLLECTION_NEAREST_PROMPTS) {
    covered.add('list_my_lab_booking_requests');
    covered.add('book_lab_collection');
  }
  addScenarioFixtureIntents(covered, EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS);

  for (const intent of collectCustomerPromotionFixtureIntents()) {
    covered.add(intent);
  }

  return covered;
}

export function hasCustomerEvalCoverage(
  intent: string,
  evalIntents: ReadonlySet<string>,
): boolean {
  return acceptableCustomerEvalActions(intent).some((action) =>
    evalIntents.has(action),
  );
}

export function hasCustomerFixtureCoverage(
  intent: string,
  fixtureIntents: ReadonlySet<string>,
): boolean {
  return acceptableCustomerEvalActions(intent).some((action) =>
    fixtureIntents.has(action),
  );
}

export function auditCustomerIntentCoverage(
  evalCases: readonly AiCommandEvalCase[],
): CustomerIntentCoverageRow[] {
  const evalIntents = collectCustomerEvalIntents(evalCases);
  const fixtureIntents = collectCustomerFixtureIntents();

  return CUSTOMER_INTENTS.filter((intent) => !CUSTOMER_INTENT_META.has(intent))
    .sort()
    .map((intent) => ({
      intent,
      hasEval: hasCustomerEvalCoverage(intent, evalIntents),
      hasFixture: hasCustomerFixtureCoverage(intent, fixtureIntents),
    }));
}

export function listCustomerIntentCoverageGaps(
  evalCases: readonly AiCommandEvalCase[],
  requiredIntents: readonly string[] = CUSTOMER_INTENT_COVERAGE_REQUIRED,
): string[] {
  const rows = new Map(
    auditCustomerIntentCoverage(evalCases).map((row) => [row.intent, row]),
  );
  const gaps: string[] = [];

  for (const intent of requiredIntents) {
    const row = rows.get(intent);
    if (!row) {
      gaps.push(`${intent}: missing registry row`);
      continue;
    }
    if (!row.hasEval) gaps.push(`${intent}: missing customer eval`);
    if (!row.hasFixture) gaps.push(`${intent}: missing customer fixture`);
  }

  return gaps;
}

export function listDeferredCustomerIntentCoverageGaps(
  evalCases: readonly AiCommandEvalCase[],
): string[] {
  const gaps: string[] = [];
  for (const row of auditCustomerIntentCoverage(evalCases)) {
    if (CUSTOMER_INTENT_COVERAGE_DEFERRED.has(row.intent)) continue;
    if (!row.hasEval) gaps.push(`${row.intent}: missing customer eval`);
    if (!row.hasFixture) gaps.push(`${row.intent}: missing customer fixture`);
  }
  return gaps;
}

export { prioritizeDeferredCustomerIntents } from './ai-customer-intent-promotion.util.js';
