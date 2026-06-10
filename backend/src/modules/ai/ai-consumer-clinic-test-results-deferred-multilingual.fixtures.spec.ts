import {
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_EN_SCENARIO_IDS,
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS,
} from './ai-consumer-clinic-test-results-deferred-multilingual.fixtures.js';
import { listConsumerClinicTestResultsDeferredLocaleParityGaps } from './ai-customer-deferred-locale-parity.util.js';

describe('ai-consumer-clinic-test-results-deferred-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN list/explain prompt id', () => {
    expect(listConsumerClinicTestResultsDeferredLocaleParityGaps()).toEqual([]);
    expect(CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS).toHaveLength(
      CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_EN_SCENARIO_IDS.length * 2,
    );
  });
});
