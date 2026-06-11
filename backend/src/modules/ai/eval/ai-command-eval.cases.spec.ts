import { CLINIC_COMPOUND_RESCUE_SCENARIOS } from '../ai-clinic-compound.fixtures.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from '../intent-decomposition.fixtures.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';
import { ALL_DASHBOARD_OPS_SCENARIOS } from '../ai-dashboard-ops.fixtures.js';
import {
  CHECK_AND_BOOK_EVAL_SCENARIOS,
  FLEXIBLE_BOOKING_EVAL_SCENARIOS,
} from '../ai-check-and-book.fixtures.js';
import {
  AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES,
  AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES,
  AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES,
  AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES,
  AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES,
  AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES,
  AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES,
  AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_CHECKOUT_CURRENCY_CASES,
  AI_COMMAND_EVAL_PACKAGE_CURRENCY_CASES,
  AI_COMMAND_EVAL_NOTIFICATION_CURRENCY_CASES,
  AI_COMMAND_EVAL_STRIPE_CHECKOUT_CURRENCY_CASES,
  AI_COMMAND_EVAL_STRIPE_CHECKOUT_FAILURE_CASES,
  AI_COMMAND_EVAL_REPORTS_CURRENCY_CASES,
  AI_COMMAND_EVAL_REVENUE_KPIS_CASES,
  AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES,
  AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CASES,
  AI_COMMAND_EVAL_EXPLAIN_BUSINESS_LANGUAGES_CASES,
  AI_COMMAND_EVAL_BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_CASES,
  AI_COMMAND_EVAL_BOOKING_LANGUAGES_CASES,
  AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CASES,
  AI_COMMAND_EVAL_PACKAGE_DISPLAY_NAME_CASES,
  AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES,
  AI_COMMAND_EVAL_TOUR_SERVICE_CASES,
  AI_COMMAND_EVAL_EXPLAIN_TOUR_SERVICES_CASES,
  AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES,
  AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CONFIGURE_RECOMMENDATION_PRODUCT_CASES,
  AI_COMMAND_EVAL_LINK_RECOMMENDED_PRODUCTS_CASES,
  AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_SETUP_CASES,
  AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES,
  AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES,
  AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES,
  AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES,
  AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES,
  AI_COMMAND_EVAL_APPLY_TOUR_PLAYBOOK_CASES,
  AI_COMMAND_EVAL_STRIPE_CURRENCY_WARNING_CASES,
  AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES,
  AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES,
  AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES,
  AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES,
  AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES,
  AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES,
  AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES,
  AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES,
  AI_COMMAND_EVAL_QUOTE_STAFF_BOOKING_TAX_CASES,
  AI_COMMAND_EVAL_SUMMARIZE_CUSTOMER_TAX_PAID_CASES,
  AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES,
  AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES,
  AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES,
  AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES,
  AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES,
  AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES,
  AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES,
  AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_V2_SURFACE_CASES,
  AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES,
  AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES,
  AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES,
  AI_COMMAND_EVAL_PROVIDER_PAYMENT_CURRENCY_CASES,
  AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES,
  AI_COMMAND_EVAL_TENANT_CURRENCY_CASES,
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_CHECK_AND_BOOK_CASES,
  AI_COMMAND_EVAL_CHECK_AND_BOOK_LLM_CASES,
  AI_COMMAND_EVAL_COMPOUND_CASES,
  AI_COMMAND_EVAL_DISAMBIGUATION_CASES,
  AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES,
  AI_COMMAND_EVAL_DASHBOARD_OPS_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_BOOKING_CASES,
  AI_COMMAND_EVAL_MULTILINGUAL_CHECK_AND_BOOK_CASES,
  AI_COMMAND_EVAL_MULTILINGUAL_FLEXIBLE_BOOKING_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
  AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
  buildRegistryCompoundEvalCases,
  businessCurrencyScenarioToEvalCase,
  businessLanguagesScenarioToEvalCase,
  checkAndBookScenarioToEvalCase,
  compoundScenarioToEvalCase,
  dashboardOpsScenarioToEvalCase,
  flexibleBookingScenarioToEvalCase,
  multilingualCheckAndBookScenarioToEvalCase,
} from './ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.cases (ai-cmd-0.4)', () => {
  it('maps golden customer scenario with promo param checks', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'customer_golden_book_package_promo',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.id).toBe('compound-customer_golden_book_package_promo');
    expect(evalCase.expect.compoundSource).toBe('golden');
    expect(evalCase.expect.compoundRecipeId).toBe(
      'customer_self_service_compound',
    );
    expect(evalCase.expect.compoundSteps).toEqual([
      'book_package',
      'promo_code_help',
    ]);
    expect(evalCase.expect.compoundStepParams).toEqual([
      { stepIndex: 1, paramsPartial: { promoCode: 'SPRING25' } },
    ]);
  });

  it('maps golden dashboard scenario with operational recipe id', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'dashboard_golden_cancel_notify_waitlist',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundRecipeId).toBe(
      'dashboard_operational_compound',
    );
    expect(evalCase.expect.compoundSource).toBe('golden');
    expect(evalCase.expect.routeTier).toBe('compound');
  });

  it('sets route tier only when compound markers are present', () => {
    const withoutMarkers = compoundScenarioToEvalCase({
      id: 'test_and_only_decompose',
      surface: 'dashboard',
      prompt: 'List gift card orders and print packing slip',
      minSteps: 2,
    });
    expect(
      isCompoundPrompt('List gift card orders and print packing slip'),
    ).toBe(false);
    expect(withoutMarkers.expect.routeTier).toBeUndefined();
    expect(withoutMarkers.expect.compoundMinSteps).toBe(2);

    const withCompound = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'dashboard_compound_then_split',
    )!;
    expect(compoundScenarioToEvalCase(withCompound).expect.routeTier).toBe(
      'compound',
    );
  });

  it('maps empty compound scenarios without route tier', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'non_compound_short_prompt',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundExpectEmpty).toBe(true);
    expect(evalCase.expect.routeTier).toBeUndefined();
  });

  it('maps param checks without explicit values', () => {
    const evalCase = compoundScenarioToEvalCase({
      id: 'test_param_key_only',
      surface: 'customer',
      prompt: 'Book spa day package and apply promo code WELCOME',
      orderedActions: ['book_package', 'promo_code_help'],
      paramChecks: [{ stepIndex: 0, key: 'packageId' }],
    });
    expect(evalCase.expect.compoundStepParams).toEqual([
      { stepIndex: 0, paramsPartial: undefined },
    ]);
  });

  it('keeps deterministic suite ids unique', () => {
    const ids = AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes compound, registry, and routing cases in deterministic suite', () => {
    expect(AI_COMMAND_EVAL_DETERMINISTIC_CASES.length).toBeGreaterThanOrEqual(
      AI_COMMAND_EVAL_CASES.length +
        AI_COMMAND_EVAL_COMPOUND_CASES.length +
        AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES.length +
        AI_COMMAND_EVAL_DASHBOARD_OPS_CASES.length,
    );
  });

  it('maps dashboard ops scenarios to eval golden cases', () => {
    expect(AI_COMMAND_EVAL_DASHBOARD_OPS_CASES).toHaveLength(
      ALL_DASHBOARD_OPS_SCENARIOS.length,
    );
    for (const scenario of ALL_DASHBOARD_OPS_SCENARIOS) {
      const evalCase = dashboardOpsScenarioToEvalCase(scenario);
      expect(evalCase.id).toMatch(/^dashboard-ops-/);
      expect(evalCase.expect.rescuedAction).toBe(scenario.expectedAction);
    }
  });

  it('builds registry compound cases via exported builder', () => {
    expect(buildRegistryCompoundEvalCases()).toEqual(
      AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
    );
  });

  it('builds registry compound cases only from decomposable compound prompts', () => {
    for (const evalCase of AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES) {
      const surface = evalCase.expect.compoundSurface!;
      const result = decomposeDeterministicForSurface(surface, evalCase.prompt);
      expect(result?.steps.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(evalCase.id).toMatch(/^registry-compound-/);
    }
  });

  it('passes every compound scenario through eval runner', () => {
    for (const evalCase of AI_COMMAND_EVAL_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('documents LLM-only eval cases separately', () => {
    expect(AI_COMMAND_EVAL_LLM_CASES.every((entry) => entry.requiresLlm)).toBe(
      true,
    );
    expect(
      AI_COMMAND_EVAL_LLM_CASES.every((entry) => entry.expect.action),
    ).toBe(true);
  });

  it('maps customer check+book scenarios to customer_self_service_compound recipe', () => {
    const scenario = CHECK_AND_BOOK_EVAL_SCENARIOS.find(
      (entry) => entry.id === 'customer-stylist-soonest',
    )!;
    const evalCase = checkAndBookScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundRecipeId).toBe(
      'customer_self_service_compound',
    );
    expect(evalCase.expect.compoundSurface).toBe('customer');
  });

  it('maps check+book scenarios without time-of-day hints', () => {
    const scenario = CHECK_AND_BOOK_EVAL_SCENARIOS.find(
      (entry) => entry.id === 'dashboard-quoted-service-and-book',
    )!;
    const evalCase = checkAndBookScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundStepParams?.[0]?.paramsPartial).toEqual({
      serviceName: 'Permanent lashes',
      allProviders: true,
    });
    expect(evalCase.expect.compoundStepParams?.[1]?.paramsPartial).toEqual({
      serviceName: 'Permanent lashes',
      bookingFirstAvailable: true,
      allProviders: true,
    });
  });

  it('maps check+book scenarios to golden compound eval cases (ai-cmd-h1.3)', () => {
    const scenario = CHECK_AND_BOOK_EVAL_SCENARIOS.find(
      (entry) => entry.id === 'dashboard-available-and-nearest-slot',
    )!;
    const evalCase = checkAndBookScenarioToEvalCase(scenario);
    expect(evalCase.id).toBe('check-book-dashboard-available-and-nearest-slot');
    expect(evalCase.expect.compoundSource).toBe('golden');
    expect(evalCase.expect.compoundSteps).toEqual([
      'check_providers_for_service',
      'book_nearest_slot',
    ]);
    expect(evalCase.expect.compoundStepParams?.[1]?.paramsPartial).toEqual({
      serviceName: 'massage',
      timeOfDay: 'evening',
      bookingFirstAvailable: true,
      notBeforeTime: '17:00',
      allProviders: true,
    });
  });

  it('maps flexible booking rescue scenarios to eval cases (ai-cmd-h1.3)', () => {
    const scenario = FLEXIBLE_BOOKING_EVAL_SCENARIOS.find(
      (entry) => entry.id === 'misclassified-check-book-compound',
    )!;
    const evalCase = flexibleBookingScenarioToEvalCase(scenario);
    expect(evalCase.id).toBe(
      'flexible-booking-misclassified-check-book-compound',
    );
    expect(evalCase.expect.rescueFromAction).toBe('create_booking');
    expect(evalCase.expect.rescueReason).toBe('check_and_book_compound');
  });

  it('maps business currency scenarios without optional expectation fields', () => {
    const evalCase = businessCurrencyScenarioToEvalCase({
      id: 'minimal-explain',
      locale: 'en',
      prompt: 'Currency status',
      expectedAction: 'explain_business_currency',
    });
    expect(evalCase.expect.rescuedAction).toBe('explain_business_currency');
    expect(evalCase.expect.rescueReason).toBeUndefined();
    expect(evalCase.expect.paramsPartial).toBeUndefined();
    expect(evalCase.expect.needsMultilingual).toBeUndefined();
  });

  it('maps business language scenarios without optional expectation fields', () => {
    const evalCase = businessLanguagesScenarioToEvalCase({
      id: 'minimal-explain',
      locale: 'en',
      prompt: 'Language status',
      expectedAction: 'explain_business_languages',
    });
    expect(evalCase.expect.rescuedAction).toBe('explain_business_languages');
    expect(evalCase.expect.rescueReason).toBeUndefined();
    expect(evalCase.expect.paramsPartial).toBeUndefined();
    expect(evalCase.expect.needsMultilingual).toBeUndefined();
  });

  it('maps business currency scenarios for EN/HY/RU (ai-cmd-curr-4)', () => {
    expect(
      AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES.length,
    ).toBeGreaterThanOrEqual(40);
    const hyCases = AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBeGreaterThanOrEqual(8);
    expect(ruCases.length).toBeGreaterThanOrEqual(8);
  });

  it('passes every business currency eval case (ai-cmd-curr-4)', () => {
    for (const evalCase of AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps business date format scenarios for EN/HY/RU (ai-cmd-fmt-1..3)', () => {
    expect(AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES.length).toBe(28);
    const configureCases = AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES.filter(
      (entry) =>
        entry.expect.rescuedAction === 'configure_business_date_format',
    );
    const explainCases = AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES.filter(
      (entry) => entry.expect.rescuedAction === 'explain_business_date_format',
    );
    const hyCases = AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(configureCases.length).toBe(14);
    expect(explainCases.length).toBe(14);
    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
  });

  it('passes every business date format eval case (ai-cmd-fmt-1..3)', () => {
    for (const evalCase of AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every booking date format eval case (ai-cmd-fmt-4)', () => {
    expect(AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES.length).toBe(12);
    for (const evalCase of AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every preview business date format eval case (ai-cmd-fmt-5)', () => {
    expect(AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every audit dashboard date surfaces eval case (ai-cmd-fmt-6)', () => {
    expect(AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps preview/audit business date format multilingual prompts for EN/HY/RU (ai-cmd-fmt-8)', () => {
    expect(
      AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES.length,
    ).toBe(28);
    const previewCases =
      AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'preview_business_date_format',
      );
    const auditCases =
      AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'audit_dashboard_date_surfaces',
      );
    const hyCases =
      AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(previewCases.length).toBe(14);
    expect(auditCases.length).toBe(14);
    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
  });

  it('passes every preview/audit business date format multilingual eval case (ai-cmd-fmt-8)', () => {
    for (const evalCase of AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every migrate dashboard date display eval case (ai-cmd-fmt-7)', () => {
    expect(AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain date input format eval case (ai-cmd-fmt-13)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every preview date input parse eval case (ai-cmd-fmt-14)', () => {
    expect(AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain notification date format eval case (ai-cmd-fmt-9)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES.length).toBe(
      6,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every preview notification datetime eval case (ai-cmd-fmt-10)', () => {
    expect(AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every notify patient result ready eval case (ai-cmd-fmt-11)', () => {
    expect(AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps notification date format multilingual prompts for EN/HY/RU (ai-cmd-fmt-12)', () => {
    expect(
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.length,
    ).toBe(34);
    const explainCases =
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'explain_notification_date_format',
      );
    const previewCases =
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'preview_notification_datetime',
      );
    const notifyCases =
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.expect.rescuedAction === 'notify_patient_result_ready',
      );
    const hyCases =
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(explainCases.length).toBe(10);
    expect(previewCases.length).toBe(10);
    expect(notifyCases.length).toBe(14);
    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
  });

  it('passes every notification date format multilingual eval case (ai-cmd-fmt-12)', () => {
    for (const evalCase of AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every checkout currency eval case (ai-cmd-curr-5)', () => {
    expect(AI_COMMAND_EVAL_CHECKOUT_CURRENCY_CASES.length).toBe(11);
    for (const evalCase of AI_COMMAND_EVAL_CHECKOUT_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every tenant currency eval case (ai-cmd-curr-6)', () => {
    expect(AI_COMMAND_EVAL_TENANT_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_TENANT_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every package currency eval case (ai-cmd-curr-7)', () => {
    expect(AI_COMMAND_EVAL_PACKAGE_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_PACKAGE_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain provider date display eval case (ai-cmd-fmt-15)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every configure provider push date format eval case (ai-cmd-fmt-16)', () => {
    expect(
      AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES.length,
    ).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps date input + provider format multilingual prompts for EN/HY/RU (ai-cmd-fmt-17)', () => {
    expect(
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.length,
    ).toBe(40);
    const explainInputCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.expect.rescuedAction === 'explain_date_input_format',
      );
    const previewInputCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.expect.rescuedAction === 'preview_date_input_parse',
      );
    const explainProviderCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'explain_provider_date_display',
      );
    const configurePushCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) =>
          entry.expect.rescuedAction === 'configure_provider_push_date_format',
      );
    const hyCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(explainInputCases.length).toBe(10);
    expect(previewInputCases.length).toBe(10);
    expect(explainProviderCases.length).toBe(10);
    expect(configurePushCases.length).toBe(10);
    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
  });

  it('passes every date input + provider format multilingual eval case (ai-cmd-fmt-17)', () => {
    for (const evalCase of AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every configure business tax eval case (ai-cmd-tax-1)', () => {
    expect(AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every set service tax rate eval case (ai-cmd-tax-2)', () => {
    expect(AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain business tax eval case (ai-cmd-tax-3)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps business tax multilingual prompts for EN/HY/RU (ai-cmd-tax-4)', () => {
    expect(AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.length).toBe(32);
    const configureCases =
      AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.filter(
        (entry) => entry.expect.rescuedAction === 'configure_business_tax',
      );
    const setServiceCases =
      AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.filter(
        (entry) => entry.expect.rescuedAction === 'set_service_tax_rate',
      );
    const explainCases = AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.filter(
      (entry) => entry.expect.rescuedAction === 'explain_business_tax',
    );
    const hyCases = AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(configureCases.length).toBe(12);
    expect(setServiceCases.length).toBe(10);
    expect(explainCases.length).toBe(10);
    expect(hyCases.length).toBe(7);
    expect(ruCases.length).toBe(7);
  });

  it('passes every business tax multilingual eval case (ai-cmd-tax-4)', () => {
    for (const evalCase of AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain checkout tax eval case (ai-cmd-tax-5)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every configure stacked tax rules eval case (ai-cmd-tax-6)', () => {
    expect(AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES.length).toBe(7);
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain stacked tax eval case (ai-cmd-tax-7)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every stacked tax multilingual eval case (ai-cmd-tax-8)', () => {
    expect(AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES.length).toBe(17);
    const hyCases = AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBe(4);
    expect(ruCases.length).toBe(5);
    for (const evalCase of AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain stripe tax charge eval case (ai-cmd-tax-9)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every lookup booking tax metadata eval case (ai-cmd-tax-10)', () => {
    expect(AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain appointment tax eval case (ai-cmd-tax-11)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every quote staff booking tax eval case (ai-cmd-tax-12)', () => {
    expect(AI_COMMAND_EVAL_QUOTE_STAFF_BOOKING_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_QUOTE_STAFF_BOOKING_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every summarize customer tax paid eval case (ai-cmd-tax-13)', () => {
    expect(AI_COMMAND_EVAL_SUMMARIZE_CUSTOMER_TAX_PAID_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_SUMMARIZE_CUSTOMER_TAX_PAID_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every consumer checkout tax eval case (ai-cmd-tax-14)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every tax display EN eval case (ai-cmd-tax-15)', () => {
    expect(AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every configure privacy retention eval case (ai-cmd-compliance-1)', () => {
    expect(AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every configure granular consent eval case (ai-cmd-compliance-2)', () => {
    expect(AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES.length).toBe(6);
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every enable HIPAA mode eval case (ai-cmd-compliance-3)', () => {
    expect(AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES.length).toBe(5);
    for (const evalCase of AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain compliance status eval case (ai-cmd-compliance-4)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES.length).toBe(4);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every admin delete customer data eval case (ai-cmd-compliance-5)', () => {
    expect(AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES.length).toBe(5);
    for (const evalCase of AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every business compliance multilingual eval case (ai-cmd-compliance-6)', () => {
    expect(AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES.length).toBe(
      40,
    );
    const hyCases =
      AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(7);
    expect(ruCases.length).toBeGreaterThanOrEqual(7);
    for (const evalCase of AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic test order multilingual eval case (i18n-clinic-v2-ai-1)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES.length).toBe(
      24,
    );
    const hyCases = AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBeGreaterThanOrEqual(10);
    expect(ruCases.length).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic test result multilingual eval case (i18n-clinic-v2-ai-2)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES.length).toBe(
      24,
    );
    const hyCases =
      AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(10);
    expect(ruCases.length).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic patient chart multilingual eval case (i18n-clinic-v2-ai-3)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES.length).toBe(
      24,
    );
    const hyCases =
      AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(10);
    expect(ruCases.length).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every provider clinic collection multilingual eval case (i18n-clinic-v2-ai-4)', () => {
    expect(
      AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES.length,
    ).toBe(24);
    const hyCases =
      AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(10);
    expect(ruCases.length).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic v2 multilingual eval case (i18n-clinic-v2-ai-6)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.length).toBe(
      AI_COMMAND_EVAL_CLINIC_V2_SURFACE_CASES.length * 2,
    );
    const hyCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    const dashboardCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.surface === 'dashboard',
    );
    const providerCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.surface === 'provider',
    );
    const customerCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.surface === 'customer',
    );
    const publicCases = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.filter(
      (entry) => entry.surface === 'public',
    );
    expect(hyCases.length).toBeGreaterThanOrEqual(40);
    expect(ruCases.length).toBeGreaterThanOrEqual(40);
    expect(dashboardCases.length).toBeGreaterThanOrEqual(20);
    expect(providerCases.length).toBeGreaterThanOrEqual(20);
    expect(customerCases.length).toBeGreaterThanOrEqual(40);
    expect(publicCases.length).toBeGreaterThanOrEqual(40);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic compound multilingual eval case (i18n-clinic-v2-ai-7)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.length).toBe(72);
    expect(
      AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES.length,
    ).toBe(CLINIC_COMPOUND_RESCUE_SCENARIOS.length * 2);
    const hyCases = AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    const dashboardCases =
      AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'dashboard',
      );
    const customerCases =
      AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'customer',
      );
    const publicCases =
      AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'public',
      );
    expect(hyCases.length).toBe(36);
    expect(ruCases.length).toBe(36);
    expect(dashboardCases.length).toBe(24);
    expect(customerCases.length).toBe(24);
    expect(publicCases.length).toBe(24);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every clinic lab booking multilingual eval case (i18n-clinic-v2-ai-8)', () => {
    expect(AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.length).toBe(
      136,
    );
    const hyCases =
      AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    const dashboardCases =
      AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'dashboard',
      );
    const customerCases =
      AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'customer',
      );
    const providerCases =
      AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'provider',
      );
    expect(hyCases.length).toBe(68);
    expect(ruCases.length).toBe(68);
    expect(dashboardCases.length).toBe(58);
    expect(customerCases.length).toBe(54);
    expect(providerCases.length).toBe(24);
    for (const evalCase of AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every consumer clinic test results multilingual eval case (i18n-clinic-v2-ai-5)', () => {
    expect(
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES.length,
    ).toBe(24);
    const hyCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    const customerCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'customer',
      );
    const publicCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES.filter(
        (entry) => entry.surface === 'public',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(10);
    expect(ruCases.length).toBeGreaterThanOrEqual(10);
    expect(customerCases.length).toBeGreaterThanOrEqual(10);
    expect(publicCases.length).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every provider payment currency eval case (ai-cmd-curr-8)', () => {
    expect(AI_COMMAND_EVAL_PROVIDER_PAYMENT_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_PROVIDER_PAYMENT_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every provider client context eval case (prov-exp-1.6)', () => {
    expect(AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES.length).toBeGreaterThanOrEqual(
      30,
    );
    for (const evalCase of AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES) {
      expect(evalCase.surface).toBe('provider');
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every notification currency eval case (ai-cmd-curr-9)', () => {
    expect(AI_COMMAND_EVAL_NOTIFICATION_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_NOTIFICATION_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every stripe currency warning eval case (ai-cmd-curr-10)', () => {
    expect(AI_COMMAND_EVAL_STRIPE_CURRENCY_WARNING_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_STRIPE_CURRENCY_WARNING_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every stripe checkout currency eval case (ai-cmd-curr-11)', () => {
    expect(AI_COMMAND_EVAL_STRIPE_CHECKOUT_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_STRIPE_CHECKOUT_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every stripe checkout failure eval case (ai-cmd-curr-12)', () => {
    expect(AI_COMMAND_EVAL_STRIPE_CHECKOUT_FAILURE_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_STRIPE_CHECKOUT_FAILURE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every reports currency eval case (ai-cmd-curr-13)', () => {
    expect(AI_COMMAND_EVAL_REPORTS_CURRENCY_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_REPORTS_CURRENCY_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every revenue KPI summary eval case (ai-cmd-curr-14)', () => {
    expect(AI_COMMAND_EVAL_REVENUE_KPIS_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_REVENUE_KPIS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps business language configure/explain scenarios for EN/HY/RU (ai-cmd-lang-4)', () => {
    expect(
      AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES.length,
    ).toBeGreaterThanOrEqual(37);
    const hyCases =
      AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(8);
    expect(ruCases.length).toBeGreaterThanOrEqual(8);
    expect(
      AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CASES.length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      AI_COMMAND_EVAL_EXPLAIN_BUSINESS_LANGUAGES_CASES.length,
    ).toBeGreaterThanOrEqual(10);
  });

  it('passes every business language configure/explain eval case (ai-cmd-lang-4)', () => {
    for (const evalCase of AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every package localized names eval case (ai-cmd-lang-6)', () => {
    expect(AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CASES.length).toBe(13);
    for (const evalCase of AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every tour service configure eval case (ai-cmd-tour-1)', () => {
    expect(AI_COMMAND_EVAL_TOUR_SERVICE_CASES.length).toBe(12);
    for (const evalCase of AI_COMMAND_EVAL_TOUR_SERVICE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every explain tour services eval case (ai-cmd-tour-2)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_TOUR_SERVICES_CASES.length).toBe(12);
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_TOUR_SERVICES_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps tour configure/explain scenarios for EN/HY/RU (ai-cmd-tour-4)', () => {
    expect(AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES.length).toBe(
      48,
    );
    const hyCases = AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
  });

  it('passes every tour configure/explain eval case (ai-cmd-tour-4)', () => {
    for (const evalCase of AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps tour consumer multilingual scenarios for EN/HY/RU (ai-cmd-tour-10)', () => {
    expect(AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES.length).toBe(36);
    const hyCases = AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
  });

  it('passes every tour consumer multilingual eval case (ai-cmd-tour-10)', () => {
    for (const evalCase of AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps tour calendar multilingual scenarios for EN/HY/RU (ai-cmd-tour-13)', () => {
    expect(AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES.length).toBe(36);
    const hyCases = AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES.filter(
      (entry) => entry.locale === 'ru',
    );
    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
  });

  it('passes every tour calendar multilingual eval case (ai-cmd-tour-13)', () => {
    for (const evalCase of AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps configure recommendation product prompts (ai-cmd-rec-1)', () => {
    expect(AI_COMMAND_EVAL_CONFIGURE_RECOMMENDATION_PRODUCT_CASES.length).toBe(
      8,
    );
  });

  it('passes every configure recommendation product eval case (ai-cmd-rec-1)', () => {
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_RECOMMENDATION_PRODUCT_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps link recommended products prompts (ai-cmd-rec-2)', () => {
    expect(AI_COMMAND_EVAL_LINK_RECOMMENDED_PRODUCTS_CASES.length).toBe(8);
  });

  it('passes every link recommended products eval case (ai-cmd-rec-2)', () => {
    for (const evalCase of AI_COMMAND_EVAL_LINK_RECOMMENDED_PRODUCTS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps explain recommendation setup prompts (ai-cmd-rec-3)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_SETUP_CASES.length).toBe(10);
  });

  it('passes every explain recommendation setup eval case (ai-cmd-rec-3)', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_SETUP_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps recommendation analytics explain prompts (ai-cmd-rec-8)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES.length).toBe(
      12,
    );
  });

  it('passes every recommendation analytics explain eval case (ai-cmd-rec-8)', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps recommendation performance summary prompts (ai-cmd-rec-9)', () => {
    expect(
      AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES.length,
    ).toBe(12);
  });

  it('passes every recommendation performance summary eval case (ai-cmd-rec-9)', () => {
    for (const evalCase of AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps recommendation analytics multilingual prompts for EN/HY/RU (ai-cmd-rec-10)', () => {
    expect(
      AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES.length,
    ).toBe(40);
    const hyCases =
      AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES.filter(
        (evalCase) => evalCase.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES.filter(
        (evalCase) => evalCase.locale === 'ru',
      );
    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
  });

  it('passes every recommendation analytics multilingual eval case (ai-cmd-rec-10)', () => {
    for (const evalCase of AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps recommendation product configure/link/explain scenarios for EN/HY/RU (ai-cmd-rec-4)', () => {
    expect(
      AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES.length,
    ).toBe(50);
    const hyCases =
      AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES.filter(
        (evalCase) => evalCase.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES.filter(
        (evalCase) => evalCase.locale === 'ru',
      );
    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
  });

  it('passes every recommendation product multilingual eval case (ai-cmd-rec-4)', () => {
    for (const evalCase of AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps checkout success recommendation explain prompts (ai-cmd-rec-5)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES.length).toBe(
      20,
    );
  });

  it('passes every checkout recommendations explain eval case (ai-cmd-rec-5)', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps consumer checkout success explain prompts (ai-cmd-rec-6)', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES.length).toBe(
      15,
    );
  });

  it('passes every consumer checkout success explain eval case (ai-cmd-rec-6)', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps consumer checkout success EN dismiss/synonym prompts (ai-cmd-rec-7)', () => {
    expect(AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES.length).toBe(15);
  });

  it('passes every consumer checkout success EN eval case (ai-cmd-rec-7)', () => {
    for (const evalCase of AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every apply tour playbook eval case (ai-cmd-tour-3)', () => {
    expect(AI_COMMAND_EVAL_APPLY_TOUR_PLAYBOOK_CASES.length).toBe(12);
    for (const evalCase of AI_COMMAND_EVAL_APPLY_TOUR_PLAYBOOK_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps package localized-name configure/explain scenarios for EN/HY/RU (ai-cmd-lang-8)', () => {
    expect(
      AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES.length,
    ).toBeGreaterThanOrEqual(35);
    const hyCases =
      AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES.filter(
        (entry) => entry.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES.filter(
        (entry) => entry.locale === 'ru',
      );
    expect(hyCases.length).toBeGreaterThanOrEqual(8);
    expect(ruCases.length).toBeGreaterThanOrEqual(8);
  });

  it('passes every package localized-name configure/explain eval case (ai-cmd-lang-8)', () => {
    for (const evalCase of AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every package display name eval case (ai-cmd-lang-7)', () => {
    expect(AI_COMMAND_EVAL_PACKAGE_DISPLAY_NAME_CASES.length).toBe(12);
    for (const evalCase of AI_COMMAND_EVAL_PACKAGE_DISPLAY_NAME_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every booking languages eval case (ai-cmd-lang-5)', () => {
    expect(AI_COMMAND_EVAL_BOOKING_LANGUAGES_CASES.length).toBe(11);
    for (const evalCase of AI_COMMAND_EVAL_BOOKING_LANGUAGES_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every bulk strip disabled locale translations eval case (ai-cmd-lang-3)', () => {
    expect(
      AI_COMMAND_EVAL_BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_CASES.length,
    ).toBe(16);
    for (const evalCase of AI_COMMAND_EVAL_BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('passes every check+book and flexible-booking eval case', () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_CHECK_AND_BOOK_CASES,
      ...AI_COMMAND_EVAL_FLEXIBLE_BOOKING_CASES,
      ...AI_COMMAND_EVAL_MULTILINGUAL_CHECK_AND_BOOK_CASES,
      ...AI_COMMAND_EVAL_MULTILINGUAL_FLEXIBLE_BOOKING_CASES,
    ]) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('maps hy/ru check+book scenarios with needsMultilingual (ai-cmd-h1.5)', () => {
    const scenario = {
      id: 'dashboard-hy-free-book-nearest',
      surface: 'dashboard' as const,
      prompt:
        'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար, ամրագրիր մոտակա slot-ը',
      serviceName: 'permanent lashes',
      notBeforeTime: '17:00',
      timeOfDay: 'evening',
    };
    const evalCase = multilingualCheckAndBookScenarioToEvalCase(scenario, 'hy');
    expect(evalCase.id).toBe(
      'multilingual-check-book-dashboard-hy-free-book-nearest',
    );
    expect(evalCase.expect.needsMultilingual).toBe(true);
    expect(evalCase.locale).toBe('hy');
  });

  it('passes every availability disambiguation eval case', () => {
    for (const evalCase of AI_COMMAND_EVAL_DISAMBIGUATION_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('documents public disambiguation in LLM catalog', () => {
    expect(
      AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES.length,
    ).toBeGreaterThanOrEqual(3);
    expect(AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES[0]?.requiresLlm).toBe(true);
    expect(
      AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES[0]?.expect.action,
    ).toBeDefined();
  });

  it('includes check+book LLM regression cases in the LLM catalog', () => {
    expect(
      AI_COMMAND_EVAL_CHECK_AND_BOOK_LLM_CASES.length,
    ).toBeGreaterThanOrEqual(9);
    expect(
      AI_COMMAND_EVAL_LLM_CASES.some(
        (entry) => entry.id === 'llm-en-public-check-book',
      ),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_LLM_CASES.some(
        (entry) => entry.id === 'llm-hy-check-book-compound',
      ),
    ).toBe(true);
  });
});
