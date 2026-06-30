import {
  listServiceOnlinePaymentEvalLocaleParityGaps,
  listServiceOnlinePaymentLocaleParityGaps,
  serviceOnlinePaymentEnEvalCaseId,
  serviceOnlinePaymentMultilingualEvalCaseId,
} from './ai-service-online-payment-locale-parity.util.js';
import { SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS } from './ai-service-online-payment.util.js';
import { SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS } from './ai-service-online-payment-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CASES } from './ai-service-online-payment-multilingual.eval.util.js';

describe('ai-service-online-payment locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN service-online-payment scenario', () => {
    expect(listServiceOnlinePaymentLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS).toHaveLength(
      SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });

  it('builds stable eval case ids and reports no eval locale gaps', () => {
    expect(serviceOnlinePaymentEnEvalCaseId('all-services-50-deposit')).toBe(
      'service-online-payment-all-services-50-deposit',
    );
    expect(
      serviceOnlinePaymentMultilingualEvalCaseId('all-services-50-deposit-hy'),
    ).toBe('service-online-payment-i18n-all-services-50-deposit-hy');
    expect(
      listServiceOnlinePaymentEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });
});
