import {
  AI_COMMAND_EVAL_PROVIDER_EARNINGS_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES,
  listProviderEarningsEvalLocaleParityGaps,
  providerEarningsMultilingualEvalCaseId,
} from './ai-provider-earnings-multilingual.eval.util.js';
import { PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS } from './ai-provider-earnings-multilingual.fixtures.js';
import { listProviderEarningsLocaleParityGaps } from './ai-provider-earnings-locale-parity.util.js';
import {
  isSummarizeMyAppointmentsPrompt,
  isSummarizeMyRevenuePrompt,
  rescueProviderEarningsIntent,
} from './ai-provider-earnings.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider earnings locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider earnings scenario', () => {
    expect(listProviderEarningsLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider earnings i18n fixture row to an eval golden case', () => {
    expect(
      listProviderEarningsEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider earnings i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES.find(
      (row) => row.id === providerEarningsMultilingualEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider earnings i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderEarningsIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'summarize_my_appointments',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects appointment count i18n prompt %s', (_id, prompt) => {
    expect(isSummarizeMyAppointmentsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'summarize_my_revenue',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects revenue i18n prompt %s', (_id, prompt) => {
    expect(isSummarizeMyRevenuePrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider earnings eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(16);
    expect(ruCases.length).toBe(16);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
