import { AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_CASES } from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES,
  listProviderPushSetupEvalLocaleParityGaps,
  providerPushSetupMultilingualEvalCaseId,
} from './ai-provider-push-setup-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS } from './ai-provider-push-setup-multilingual.fixtures.js';
import { listProviderPushSetupLocaleParityGaps } from './ai-provider-push-setup-locale-parity.util.js';
import { rescueProviderPushSetupIntent } from './ai-provider-push-setup.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider push setup locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider push setup scenario', () => {
    expect(listProviderPushSetupLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider push setup i18n fixture row to an eval golden case', () => {
    expect(
      listProviderPushSetupEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider push setup i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES.find(
        (row) => row.id === providerPushSetupMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider push setup i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderPushSetupIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it('tags HY/RU provider push setup eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(11);
    expect(ruCases.length).toBe(11);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(hyCases.every((row) => row.expect.needsMultilingual === true)).toBe(
      true,
    );
  });
});
