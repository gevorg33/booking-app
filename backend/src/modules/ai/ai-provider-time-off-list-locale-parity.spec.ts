import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES,
  listProviderTimeOffListEvalLocaleParityGaps,
  providerTimeOffListMultilingualEvalCaseId,
} from './ai-provider-time-off-list-multilingual.eval.util.js';
import { PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS } from './ai-provider-time-off-list-multilingual.fixtures.js';
import { listProviderTimeOffListLocaleParityGaps } from './ai-provider-time-off-list-locale-parity.util.js';
import {
  isListMyTimeOffRequestsPrompt,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider time-off list locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider time-off list scenario', () => {
    expect(listProviderTimeOffListLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider time-off list i18n fixture row to an eval golden case', () => {
    expect(
      listProviderTimeOffListEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider time-off list i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES.find(
        (row) => row.id === providerTimeOffListMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider time-off list i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderTimeOffIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects list_my_time_off_requests i18n prompt %s', (_id, prompt) => {
    expect(isListMyTimeOffRequestsPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider time-off list eval rows with provider surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(4);
    expect(ruCases.length).toBe(4);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_CASES.length).toBe(4);
  });
});
