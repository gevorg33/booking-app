import {
  SHARED_ENTITY_CROSS_STEP_KEYS,
  SHARED_ENTITY_SESSION_INHERIT_KEYS,
  CLINIC_TEST_RESULT_EXT_INTENT_PARAM_SPECS,
  CLINIC_TEST_RESULT_EXT_INTENT_IDS,
  CLINIC_TEST_RESULT_EXT_PARAM_IDS,
  getClinicTestResultExtIntentParamSpec,
  getOptionalClinicTestResultExtParams,
  getRequiredClinicTestResultExtParams,
  getSharedParamsForIntent,
  intentAcceptsSharedParam,
  isClinicTestResultExtValidatedIntent,
  listClinicTestResultExtIntentsForParam,
  listIntentsForSharedParam,
  validateClinicTestResultExtIntentParamSpecs,
} from './ai-command-entity-params.registry.js';
import { CLINIC_TEST_RESULT_EXT_INTENTS } from './ai-clinic-test-result-ext.util.js';
import { SHARED_ENTITY_PARAM_IDS } from './ai-command-entity-params.types.js';

describe('ai-command-entity-params.registry', () => {
  it('exports session and cross-step key lists', () => {
    expect(SHARED_ENTITY_PARAM_IDS).toHaveLength(12);
    expect(SHARED_ENTITY_CROSS_STEP_KEYS).toContain('packageId');
    expect(SHARED_ENTITY_SESSION_INHERIT_KEYS).toEqual(
      SHARED_ENTITY_CROSS_STEP_KEYS,
    );
  });

  it('maps shared params to booking and catalog intents', () => {
    expect(
      getSharedParamsForIntent('cancel_package_visit').has('packagePurchaseId'),
    ).toBe(true);
    expect(
      getSharedParamsForIntent('cancel_package_visit').has('packageId'),
    ).toBe(true);
    expect(intentAcceptsSharedParam('book_package', 'packageId')).toBe(true);
    expect(intentAcceptsSharedParam('mark_paid', 'paymentMethod')).toBe(true);
    expect(
      intentAcceptsSharedParam('bulk_create_catalog', 'categoryDraft'),
    ).toBe(true);
    expect(intentAcceptsSharedParam('list_bookings', 'locationId')).toBe(true);
    expect(intentAcceptsSharedParam('create_booking', 'packageId')).toBe(false);
    expect(getSharedParamsForIntent('book_with_gift_card')).toEqual(
      new Set(['giftCardCode', 'paymentMethod']),
    );
    expect(getSharedParamsForIntent('not_real')).toEqual(new Set());
  });

  it('lists intents per shared param', () => {
    expect(listIntentsForSharedParam('multiServiceGroupId')).toContain(
      'book_multi_service',
    );
    expect(listIntentsForSharedParam('packageId')).toContain('book_package');
    expect(listIntentsForSharedParam('categoryDraft')).toEqual([
      'bulk_create_catalog',
    ]);
    expect(listIntentsForSharedParam('not_a_param' as any)).toEqual([]);
  });

  describe('clinic test-result ext param specs (ai-cmd-clinic-6-gap-4.2)', () => {
    it('documents required params per ext intent with zero drift', () => {
      expect(validateClinicTestResultExtIntentParamSpecs()).toEqual([]);
      expect(CLINIC_TEST_RESULT_EXT_INTENT_PARAM_SPECS).toHaveLength(4);
      expect(CLINIC_TEST_RESULT_EXT_INTENT_IDS).toEqual([
        ...CLINIC_TEST_RESULT_EXT_INTENTS,
      ]);
      expect(CLINIC_TEST_RESULT_EXT_PARAM_IDS).toEqual([
        'orderId',
        'customerName',
        'measurementCode',
        'normalLow',
        'normalHigh',
        'limit',
      ]);
    });

    it.each(CLINIC_TEST_RESULT_EXT_INTENTS)(
      'exposes param spec for %s',
      (intent) => {
        expect(getClinicTestResultExtIntentParamSpec(intent)?.intent).toBe(
          intent,
        );
        expect(isClinicTestResultExtValidatedIntent(intent)).toBe(true);
      },
    );

    it('maps upload and explain to orderId; configure to measurement + range', () => {
      expect(
        getRequiredClinicTestResultExtParams('upload_patient_result'),
      ).toEqual(['orderId']);
      expect(
        getRequiredClinicTestResultExtParams('explain_patient_results'),
      ).toEqual([]);
      expect(
        getClinicTestResultExtIntentParamSpec('explain_patient_results')
          ?.requireAnyOf,
      ).toEqual(['customerName', 'orderId']);
      expect(
        getRequiredClinicTestResultExtParams('configure_test_reference_range'),
      ).toEqual(['measurementCode', 'normalLow', 'normalHigh']);
      expect(
        getOptionalClinicTestResultExtParams('list_abnormal_results'),
      ).toEqual(['customerName', 'limit']);
      expect(listClinicTestResultExtIntentsForParam('orderId')).toEqual([
        'upload_patient_result',
        'explain_patient_results',
      ]);
      expect(getRequiredClinicTestResultExtParams('not_real')).toEqual([]);
      expect(getOptionalClinicTestResultExtParams('not_real')).toEqual([]);
      expect(getClinicTestResultExtIntentParamSpec('not_real')).toBeUndefined();
    });
    it('reports param spec drift', () => {
      const broken = [
        {
          intent: 'upload_patient_result' as const,
          required: ['not_a_param' as 'orderId'],
          optional: [],
        },
        {
          intent: 'explain_patient_results' as const,
          required: [],
          optional: ['customerName'],
          requireAnyOf: ['orderId'],
        },
        {
          intent: 'list_abnormal_results' as const,
          required: [],
          optional: ['bad_param' as 'limit'],
        },
      ];
      expect(validateClinicTestResultExtIntentParamSpecs(broken)).toEqual(
        expect.arrayContaining([
          'param specs: expected 4 rows, got 3',
          'param specs: missing row for configure_test_reference_range',
          'param specs: unknown required param not_a_param on upload_patient_result',
          'param specs: unknown optional param bad_param on list_abnormal_results',
          'param specs: explain_patient_results requireAnyOf param orderId must be listed optional',
        ]),
      );
    });
  });
});
