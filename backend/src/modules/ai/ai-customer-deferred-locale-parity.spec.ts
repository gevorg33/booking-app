import {
  assertDeferredIntentsTracked,
  consumerAdoptionEvalCaseId,
  CONSUMER_ADOPTION_I18N_SCENARIOS,
  listConsumerAdoptionEvalLocaleParityGaps,
  listConsumerAdoptionLocaleParityGaps,
  listDeferredCustomerEvalLocaleParityGaps,
  listDeferredCustomerLocaleParityGaps,
  listMarketingGrowthDeferredLocaleParityGaps,
  listConsumerCheckoutSuccessDeferredLocaleParityGaps,
  listConsumerCheckoutTaxDeferredLocaleParityGaps,
  listConsumerClinicTestResultsDeferredLocaleParityGaps,
  listSelfServiceBookingDeferredLocaleParityGaps,
  registeredDeferredConsumerAdoptionIntents,
  registeredDeferredConsumerClinicTestResultsIntents,
  registeredDeferredMarketingGrowthIntents,
} from './ai-customer-deferred-locale-parity.util.js';
import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from './ai-switch-salon-tenant-multilingual.fixtures.js';
import { rescueFindMySavedSalonsIntent } from './ai-find-my-saved-salons.util.js';
import { rescueSwitchSalonTenantIntent } from './ai-switch-salon-tenant.util.js';
import { MARKETING_GROWTH_MULTILINGUAL_SCENARIOS } from './ai-marketing-growth-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES,
  marketingGrowthMultilingualEvalCaseId,
} from './ai-marketing-growth-multilingual.eval.util.js';
import { CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS } from './ai-consumer-checkout-success-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES,
  consumerCheckoutSuccessMultilingualEvalCaseId,
} from './ai-consumer-checkout-success-multilingual.eval.util.js';
import { CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS } from './ai-consumer-checkout-tax-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES,
  consumerCheckoutTaxMultilingualEvalCaseId,
} from './ai-consumer-checkout-tax-multilingual.eval.util.js';
import {
  AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES,
  consumerClinicTestResultsDeferredMultilingualEvalCaseId,
} from './ai-consumer-clinic-test-results-deferred-multilingual.eval.util.js';
import { CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS } from './ai-consumer-clinic-test-results-deferred-multilingual.fixtures.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from './ai-consumer-checkout-tax.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-self-service-booking-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES,
  selfServiceBookingMultilingualEvalCaseId,
} from './ai-self-service-booking-multilingual.eval.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  AI_COMMAND_EVAL_CONSUMER_ADOPTION_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES,
  AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES,
  AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES,
  AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES,
  AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES,
  AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES,
} from './eval/ai-command-eval.cases.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-explain-my-notifications-multilingual.fixtures.js';
import { rescueExplainMyNotificationsIntent } from './ai-explain-my-notifications.util.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import { rescueManageNotificationPreferencesIntent } from './ai-manage-notification-preferences.util.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-update-my-profile-multilingual.fixtures.js';
import { rescueUpdateMyProfileIntent } from './ai-update-my-profile.util.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from './ai-how-to-download-app-multilingual.fixtures.js';
import { rescueHowToDownloadAppCustomerPublicIntent } from './ai-how-to-download-app-customer-public.util.js';

describe('ai customer deferred locale parity (acc-2.4 / gap-5)', () => {
  it('tracks registered consumer-adoption intents as deferred customer rows', () => {
    const registered = registeredDeferredConsumerAdoptionIntents();
    expect(registered.length).toBeGreaterThanOrEqual(5);
    const untracked = assertDeferredIntentsTracked(registered);
    expect(untracked).toEqual([]);
  });

  it('tracks registered marketing-growth intents still deferred after 4.0 promotion', () => {
    const registered = registeredDeferredMarketingGrowthIntents();
    expect(registered).toEqual([
      'switch_to_consumer_app',
      'explain_loyalty_points',
    ]);
  });

  it('tracks registered consumer-clinic-test-results intents as deferred customer rows', () => {
    expect(registeredDeferredConsumerClinicTestResultsIntents()).toEqual([
      'explain_result_status',
    ]);
  });

  it('ships HY and RU fixture siblings for every EN consumer-adoption scenario', () => {
    expect(listConsumerAdoptionLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for every EN self-service scenario', () => {
    expect(listSelfServiceBookingDeferredLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for every EN marketing-growth scenario', () => {
    expect(listMarketingGrowthDeferredLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for every EN checkout-success scenario', () => {
    expect(listConsumerCheckoutSuccessDeferredLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for every EN checkout-tax scenario', () => {
    expect(listConsumerCheckoutTaxDeferredLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for every EN consumer-clinic-test-results scenario', () => {
    expect(listConsumerClinicTestResultsDeferredLocaleParityGaps()).toEqual([]);
  });

  it('ships HY and RU fixture siblings for all deferred customer domains', () => {
    expect(listDeferredCustomerLocaleParityGaps()).toEqual([]);
  });

  it('maps every deferred locale fixture row to an eval golden case', () => {
    expect(
      listDeferredCustomerEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it('maps every consumer-adoption fixture row to an eval golden case', () => {
    expect(
      listConsumerAdoptionEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    CONSUMER_ADOPTION_I18N_SCENARIOS.map((scenario) => [scenario.id, scenario]),
  )('passes consumer-adoption eval case %s', (_id, scenario) => {
    const evalCase = [
      ...AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES,
      ...AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES,
    ].find(
      (row) =>
        row.id ===
        consumerAdoptionEvalCaseId(scenario.id, scenario.expectedAction),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues find-my-saved-salons i18n prompt %s', (_id, scenario) => {
    expect(rescueFindMySavedSalonsIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues switch-salon-tenant i18n prompt %s', (_id, scenario) => {
    expect(rescueSwitchSalonTenantIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes self-service i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES.find(
        (row) =>
          row.id === selfServiceBookingMultilingualEvalCaseId(scenario.id),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues self-service i18n prompt %s', (_id, scenario) => {
    expect(rescueSelfServiceBookingIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    MARKETING_GROWTH_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes marketing-growth i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES.find(
      (row) => row.id === marketingGrowthMultilingualEvalCaseId(scenario.id),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    MARKETING_GROWTH_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues marketing-growth i18n prompt %s', (_id, scenario) => {
    expect(rescueMarketingGrowthIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes checkout-success i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES.find(
        (row) =>
          row.id === consumerCheckoutSuccessMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues checkout-success i18n prompt %s', (_id, scenario) => {
    expect(
      rescueExplainConsumerCheckoutSuccessIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
    });
    expect(
      parseExplainConsumerCheckoutSuccessFromPrompt(scenario.prompt),
    ).toEqual(expect.objectContaining({ aspect: scenario.aspect }));
  });

  it.each(
    CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes checkout-tax i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES.find(
        (row) => row.id === consumerCheckoutTaxMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues checkout-tax i18n prompt %s', (_id, scenario) => {
    expect(
      rescueExplainConsumerCheckoutTaxIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: 'explain_consumer_checkout_tax',
      rescueReason: 'explain_consumer_checkout_tax',
    });
    expect(parseExplainConsumerCheckoutTaxFromPrompt(scenario.prompt)).toEqual({
      aspect: scenario.aspect,
    });
  });

  it.each(
    CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS.map(
      (scenario) => [scenario.id, scenario],
    ),
  )('passes consumer-clinic deferred i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES.find(
        (row) =>
          row.id ===
          consumerClinicTestResultsDeferredMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS.map(
      (scenario) => [scenario.id, scenario],
    ),
  )('rescues consumer-clinic deferred i18n prompt %s', (_id, scenario) => {
    expect(
      rescueConsumerClinicTestResultsIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
    const parsed =
      scenario.expectedAction === 'list_my_test_results'
        ? parseListMyTestResultsFromPrompt(scenario.prompt)
        : parseExplainResultStatusFromPrompt(scenario.prompt);
    expect(parsed).not.toBeNull();
    if (scenario.paramsPartial?.status) {
      expect(
        'status' in (parsed ?? {})
          ? (parsed as { status?: string }).status
          : undefined,
      ).toBe(scenario.paramsPartial.status);
    }
    if (scenario.paramsPartial?.testName) {
      expect(
        'testName' in (parsed ?? {})
          ? (parsed as { testName?: string }).testName
          : undefined,
      ).toBe(scenario.paramsPartial.testName);
    }
  });

  it('tags HY/RU manage-notification-preferences eval rows with customer surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(4);
    expect(ruCases.length).toBe(4);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )(
    'passes manage-notification-preferences i18n eval case %s',
    (_id, scenario) => {
      const evalCase =
        AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES.find(
          (row) => row.id === `manage-notification-preferences-${scenario.id}`,
        );
      expect(evalCase).toBeDefined();
      const result = evaluateDeterministicEvalCase(evalCase!);
      expect(result.passed).toBe(true);
    },
  );

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )(
    'rescues manage-notification-preferences i18n prompt %s',
    (_id, scenario) => {
      expect(
        rescueManageNotificationPreferencesIntent(scenario.prompt, 'unknown'),
      ).toEqual({
        action: 'manage_notification_preferences',
        rescueReason: 'manage_notification_preferences',
      });
    },
  );

  it('tags HY/RU explain-my-notifications eval rows with customer surface and locale', () => {
    const hyCases = AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES.filter(
      (row) => row.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES.filter(
      (row) => row.locale === 'ru',
    );

    expect(hyCases.length).toBe(4);
    expect(ruCases.length).toBe(4);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes explain-my-notifications i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES.find(
      (row) => row.id === `explain-my-notifications-${scenario.id}`,
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues explain-my-notifications i18n prompt %s', (_id, scenario) => {
    expect(
      rescueExplainMyNotificationsIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: 'explain_my_notifications',
      rescueReason: 'explain_my_notifications',
    });
  });

  it('tags HY/RU update-my-profile eval rows with customer surface and locale', () => {
    const hyCases = AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES.filter(
      (row) => row.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES.filter(
      (row) => row.locale === 'ru',
    );

    expect(hyCases.length).toBe(3);
    expect(ruCases.length).toBe(3);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it.each(
    UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes update-my-profile i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES.find(
      (row) => row.id === `update-my-profile-${scenario.id}`,
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues update-my-profile i18n prompt %s', (_id, scenario) => {
    expect(rescueUpdateMyProfileIntent(scenario.prompt, 'unknown')).toEqual({
      action: 'update_my_profile',
      rescueReason: 'update_my_profile',
    });
  });

  it('tags HY/RU how-to-download-app eval rows with customer/public surface and locale', () => {
    const hyCustomer = AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.filter(
      (row) => row.locale === 'hy' && row.surface === 'customer',
    );
    const ruCustomer = AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.filter(
      (row) => row.locale === 'ru' && row.surface === 'customer',
    );
    const hyPublic = AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.filter(
      (row) => row.locale === 'hy' && row.surface === 'public',
    );
    const ruPublic = AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.filter(
      (row) => row.locale === 'ru' && row.surface === 'public',
    );

    expect(hyCustomer.length).toBe(2);
    expect(ruCustomer.length).toBe(2);
    expect(hyPublic.length).toBe(2);
    expect(ruPublic.length).toBe(2);
    expect(
      [...hyCustomer, ...ruCustomer, ...hyPublic, ...ruPublic].every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes how-to-download-app i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.find(
      (row) => row.id === `how-to-download-app-${scenario.id}`,
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues how-to-download-app i18n prompt %s', (_id, scenario) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: 'how_to_download_app',
      rescueReason: 'download_app',
    });
  });

  it('tags HY/RU consumer-adoption eval rows with customer surface and locale', () => {
    const savedSalonCases = [
      ...AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES,
      ...AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES,
    ];
    const hyCases = savedSalonCases.filter((row) => row.locale === 'hy');
    const ruCases = savedSalonCases.filter((row) => row.locale === 'ru');

    expect(hyCases.length).toBe(6);
    expect(ruCases.length).toBe(6);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
  });

  it('tags HY/RU self-service eval rows with customer surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(26);
    expect(ruCases.length).toBe(26);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it('tags HY/RU marketing-growth eval rows with customer surface and locale', () => {
    const hyCases = AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'ru',
    );

    expect(hyCases.length).toBe(5);
    expect(ruCases.length).toBe(5);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it('tags HY/RU checkout-success eval rows with customer surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(30);
    expect(ruCases.length).toBe(30);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it('tags HY/RU checkout-tax eval rows with customer surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(6);
    expect(ruCases.length).toBe(6);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });

  it('tags HY/RU consumer-clinic deferred eval rows with customer surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(24);
    expect(ruCases.length).toBe(24);
    expect(hyCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'customer')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });
});
