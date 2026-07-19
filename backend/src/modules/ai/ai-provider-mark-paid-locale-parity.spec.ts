import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_MARK_PAID_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES,
  listProviderMarkPaidEvalLocaleParityGaps,
  providerMarkPaidMultilingualEvalCaseId,
} from './ai-provider-mark-paid-multilingual.eval.util.js';
import { PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS } from './ai-provider-mark-paid-multilingual.fixtures.js';
import { listProviderMarkPaidLocaleParityGaps } from './ai-provider-mark-paid-locale-parity.util.js';
import {
  isProviderMarkPaidPrompt,
  rescueProviderBookingIntent,
} from './ai-provider-booking.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider mark_paid locale parity (acc-2.4 / ai-cmd-provider-5.0.3)', () => {
  it('ships HY and RU fixture siblings for every EN provider mark_paid scenario', () => {
    expect(listProviderMarkPaidLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider mark_paid i18n fixture row to an eval golden case', () => {
    expect(
      listProviderMarkPaidEvalLocaleParityGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider mark_paid i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES.find(
      (row) => row.id === providerMarkPaidMultilingualEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider mark_paid i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderBookingIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects mark_paid i18n prompt %s', (_id, prompt) => {
    expect(isProviderMarkPaidPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider mark_paid eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(11);
    expect(ruCases.length).toBe(11);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
