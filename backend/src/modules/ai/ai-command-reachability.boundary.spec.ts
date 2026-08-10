/**
 * AI-ROADMAP Phase 1 — command reachability meta-test.
 *
 * e2e-bug.342: two actions (`list_team_unpaid_today`, `explain_reviews_inbox`)
 * had handlers but no registry row. `getCommandEntry` returned undefined,
 * `isIntentAllowedOnSurface` did `undefined?.includes(...)` → false, and the
 * rescue pipeline silently dropped an otherwise-correct result. The actions
 * were permanently unreachable and nothing failed — no test, no log, no error.
 *
 * A command's definition is currently smeared across ~6 places (registry seed,
 * dispatch map, classifier schema, coverage list, promotion list, domain util),
 * so any one of them can be forgotten. Until Phase 1 collapses that into a
 * single registry entry, this test enforces the invariant that matters most:
 *
 *   registry row  <->  dispatchable handler
 *
 * Both directions are bugs:
 *   - handler without a registry row  = unreachable action (e2e-bug.342)
 *   - registry row without a handler  = the registry promises what nothing runs
 */
import { AGENT_OPS_LOGIC_DISPATCH_MAP } from './ai-agent-ops-dispatch.build.js';
import { BOOKING_CORE_DISPATCH_MAP } from './ai-booking-core-dispatch.build.js';
import { BOOKING_DEPTH_DISPATCH_MAP } from './ai-booking-depth-dispatch.build.js';
import { BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP } from './ai-business-compliance-dispatch.build.js';
import { BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP } from './ai-business-currency-dispatch.build.js';
import { BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP } from './ai-business-date-format-dispatch.build.js';
import { BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP } from './ai-business-languages-dispatch.build.js';
import { BUSINESS_PROFILE_LOGIC_DISPATCH_MAP } from './ai-business-profile-dispatch.build.js';
import { BUSINESS_TAX_LOGIC_DISPATCH_MAP } from './ai-business-tax-dispatch.build.js';
import { CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP } from './ai-clinic-lab-booking-dispatch.build.js';
import { CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP } from './ai-clinic-patient-chart-dispatch.build.js';
import { CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP } from './ai-clinic-pre-visit-intake-dispatch.build.js';
import { CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP } from './ai-clinic-questionnaire-dispatch.build.js';
import { CLINIC_SERVICE_DISPATCH_MAP } from './ai-clinic-service-dispatch.build.js';
import { CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP } from './ai-clinic-test-catalog-dispatch.build.js';
import { CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP } from './ai-clinic-test-order-dispatch.build.js';
import { CLINIC_TEST_RESULT_DISPATCH_MAP } from './ai-clinic-test-result-dispatch.build.js';
import { CUSTOMER_CRM_LOGIC_DISPATCH_MAP } from './ai-customer-crm-dispatch.build.js';
import { EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP } from './ai-external-doctors-dispatch.build.js';
import { GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP } from './ai-gift-fulfillment-dispatch.build.js';
import { INTEGRATIONS_LOGIC_DISPATCH_MAP } from './ai-integrations-dispatch.build.js';
import { LOCATIONS_LOGIC_DISPATCH_MAP } from './ai-locations-dispatch.build.js';
import { MARKETING_GROWTH_LOGIC_DISPATCH_MAP } from './ai-marketing-growth-dispatch.build.js';
import { META_OPS_DISPATCH_MAP } from './ai-meta-ops-dispatch.build.js';
import { ONBOARDING_LOGIC_DISPATCH_MAP } from './ai-onboarding-dispatch.build.js';
import { OPENAI_INTEGRATION_DISPATCH_MAP } from './ai-openai-integration-dispatch.build.js';
import { OPERATIONS_DISPATCH_MAP } from './ai-operations-dispatch.build.js';
import { PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP } from './ai-package-localized-names-dispatch.build.js';
import { PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP } from './ai-patient-clinical-mutations-dispatch.build.js';
import { PAYMENTS_LOGIC_DISPATCH_MAP } from './ai-payments-dispatch.build.js';
import { PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP } from './ai-provider-clinic-tasks-and-results-dispatch.build.js';
import { PROVIDER_TIME_OFF_DISPATCH_MAP } from './ai-provider-time-off-dispatch.build.js';
import { PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP } from './ai-push-notifications-dispatch.build.js';
import { RECOMMENDATION_PRODUCT_DISPATCH_MAP } from './ai-recommendation-product-dispatch.build.js';
import { REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP } from './ai-referral-staff-templates-dispatch.build.js';
import { RETAIL_FINANCE_LOGIC_DISPATCH_MAP } from './ai-retail-finance-dispatch.build.js';
import { SCHEDULE_HANDLERS_DISPATCH_MAP } from './ai-schedule-handlers-dispatch.build.js';
import { SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP } from './ai-schedule-resources-dispatch.build.js';
import { SCHEDULING_DISPATCH_MAP } from './ai-scheduling-dispatch.build.js';
import { SELF_SERVICE_BOOKING_DISPATCH_MAP } from './ai-self-service-booking-dispatch.build.js';
import { TOUR_SERVICE_DISPATCH_MAP } from './ai-tour-service-dispatch.build.js';
import { COMMAND_REGISTRY } from './ai-command-registry.js';

/**
 * Ratchet: registry rows not yet routed through a `*-dispatch.build` map.
 * Lower, never raise.
 *
 * 2026-08-10 (§149, e2e-bug.424): 282 -> 291, the one deliberate raise. Nine
 * provider explainers were added to the registry so the surface gate would stop
 * discarding their rescues; each is dispatched by a `case` in
 * `ai-provider-client-context.logic.ts` or `provider-ai-command.service.ts`,
 * which is the switch-statement handling the assertion below already accepts.
 * Verified per command rather than assumed — routing a command that cannot
 * execute would be worse than leaving it unroutable.
 *
 * They are nine more rows wanting a dispatch map, which is what this ratchet is
 * for; the number to drive down is unchanged in kind.
 */
const UNDISPATCHED_BASELINE = 291;

/**
 * Dispatch keys that are deliberate ALIASES of a canonical registry action —
 * the same handler reachable under a second classifier-facing name. They are
 * intentionally absent from the registry, so they are not orphans.
 *
 * This map exists because `CommandRegistryEntry` has no `aliases` field today;
 * an alias can currently only be expressed as an extra dispatch-map key plus a
 * code comment, which is invisible to every other consumer (classifier schema,
 * coverage tests, docs). AI-ROADMAP §3.1 adds `aliases` to the registry entry —
 * once it lands, this allowlist should be deleted and derived from the registry.
 */
const KNOWN_ALIASES: Record<string, string> = {
  // ai-clinic-test-order-dispatch.build.ts — documented alias, identical handler.
  create_catalog_test_order: 'create_test_order',
};

const DISPATCH_MAPS: Record<string, ReadonlyMap<string, unknown>> = {
  AGENT_OPS_LOGIC_DISPATCH_MAP,
  BOOKING_CORE_DISPATCH_MAP,
  BOOKING_DEPTH_DISPATCH_MAP,
  BUSINESS_COMPLIANCE_LOGIC_DISPATCH_MAP,
  BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP,
  BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP,
  BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP,
  BUSINESS_PROFILE_LOGIC_DISPATCH_MAP,
  BUSINESS_TAX_LOGIC_DISPATCH_MAP,
  CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP,
  CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP,
  CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP,
  CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP,
  CLINIC_SERVICE_DISPATCH_MAP,
  CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP,
  CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP,
  CLINIC_TEST_RESULT_DISPATCH_MAP,
  CUSTOMER_CRM_LOGIC_DISPATCH_MAP,
  EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP,
  GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP,
  INTEGRATIONS_LOGIC_DISPATCH_MAP,
  LOCATIONS_LOGIC_DISPATCH_MAP,
  MARKETING_GROWTH_LOGIC_DISPATCH_MAP,
  META_OPS_DISPATCH_MAP,
  ONBOARDING_LOGIC_DISPATCH_MAP,
  OPENAI_INTEGRATION_DISPATCH_MAP,
  OPERATIONS_DISPATCH_MAP,
  PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP,
  PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP,
  PAYMENTS_LOGIC_DISPATCH_MAP,
  PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP,
  PROVIDER_TIME_OFF_DISPATCH_MAP,
  PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP,
  RECOMMENDATION_PRODUCT_DISPATCH_MAP,
  REFERRAL_STAFF_TEMPLATES_LOGIC_DISPATCH_MAP,
  RETAIL_FINANCE_LOGIC_DISPATCH_MAP,
  SCHEDULE_HANDLERS_DISPATCH_MAP,
  SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP,
  SCHEDULING_DISPATCH_MAP,
  SELF_SERVICE_BOOKING_DISPATCH_MAP,
  TOUR_SERVICE_DISPATCH_MAP,
};

/** Every intent id that some dispatch map can actually execute. */
function collectDispatchableIntents(): Map<string, string[]> {
  const byIntent = new Map<string, string[]>();
  for (const [mapName, map] of Object.entries(DISPATCH_MAPS)) {
    for (const intentId of map.keys()) {
      const owners = byIntent.get(intentId) ?? [];
      owners.push(mapName);
      byIntent.set(intentId, owners);
    }
  }
  return byIntent;
}

describe('AI-ROADMAP Phase 1 — command reachability', () => {
  const dispatchable = collectDispatchableIntents();
  const registryIds = new Set(COMMAND_REGISTRY.map((e) => e.id));

  it('every dispatchable action has a registry row (e2e-bug.342 guard)', () => {
    const orphaned = [...dispatchable.keys()]
      .filter((id) => !registryIds.has(id) && !(id in KNOWN_ALIASES))
      .sort();
    expect({ count: orphaned.length, orphaned }).toEqual({
      count: 0,
      orphaned: [],
    });
  });

  it('every declared alias points at a real registry action', () => {
    const dangling = Object.entries(KNOWN_ALIASES)
      .filter(([, canonical]) => !registryIds.has(canonical))
      .map(([alias, canonical]) => `${alias} -> ${canonical}`);
    expect(dangling).toEqual([]);
  });

  it('reports registry rows with no dispatchable handler', () => {
    const undispatchable = [...registryIds]
      .filter((id) => !dispatchable.has(id))
      .sort();
    // Not all registry rows route through a *-dispatch.build map yet — some are
    // still handled by switch statements in the surface services. This assertion
    // is a ratchet on that number, not a claim that zero is expected today.
    expect(undispatchable.length).toBeLessThanOrEqual(UNDISPATCHED_BASELINE);
  });

  it('no intent is claimed by two different dispatch maps', () => {
    const duplicated = [...dispatchable.entries()]
      .filter(([, owners]) => owners.length > 1)
      .map(([id, owners]) => `${id}: ${owners.join(' + ')}`)
      .sort();
    expect(duplicated).toEqual([]);
  });

  it('prints the reachability burn-down', () => {
    const undispatchable = [...registryIds].filter(
      (id) => !dispatchable.has(id),
    );
    // eslint-disable-next-line no-console
    console.log(
      `[AI-ROADMAP reachability] registry ${registryIds.size} · dispatchable ${dispatchable.size} · ` +
        `registry rows without a dispatch map ${undispatchable.length}/${UNDISPATCHED_BASELINE}`,
    );
    expect(registryIds.size).toBeGreaterThan(0);
  });
});
