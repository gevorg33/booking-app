import {
  AI_COMMAND_EVAL_PROVIDER_EXP_3_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES,
  listProviderExp3EvalLocaleParityGaps,
  providerExp3MultilingualEvalCaseId,
} from './ai-provider-exp-3-multilingual.eval.util.js';
import { PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS } from './ai-provider-exp-3-multilingual.fixtures.js';
import { listProviderExp3LocaleParityGaps } from './ai-provider-exp-3-locale-parity.util.js';
import {
  isAddRetailToBookingPrompt,
  isBlockMyTimePrompt,
  isSendClientMessagePrompt,
  rescueProviderExp3Intent,
} from './ai-provider-exp-3.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider exp-3 locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider exp-3 scenario', () => {
    expect(listProviderExp3LocaleParityGaps()).toEqual([]);
  });

  it('maps every provider exp-3 i18n fixture row to an eval golden case', () => {
    expect(
      listProviderExp3EvalLocaleParityGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider exp-3 i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES.find(
      (row) => row.id === providerExp3MultilingualEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider exp-3 i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderExp3Intent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'add_retail_to_booking',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects add_retail_to_booking i18n prompt %s', (_id, prompt) => {
    expect(isAddRetailToBookingPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'send_client_message',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects send_client_message i18n prompt %s', (_id, prompt) => {
    expect(isSendClientMessagePrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'block_my_time',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects block_my_time i18n prompt %s', (_id, prompt) => {
    expect(isBlockMyTimePrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'request_time_off',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects request_time_off i18n prompt %s', (_id, prompt) => {
    expect(rescueProviderExp3Intent(prompt, 'unknown')?.action).toBe(
      'request_time_off',
    );
  });

  it('tags HY/RU provider exp-3 eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EXP_3_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EXP_3_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(12);
    expect(ruCases.length).toBe(12);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
