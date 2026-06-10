import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES,
  listProviderSessionTimeoutEvalLocaleParityGaps,
  providerSessionTimeoutMultilingualEvalCaseId,
} from './ai-provider-session-timeout-multilingual.eval.util.js';
import { PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS } from './ai-provider-session-timeout-multilingual.fixtures.js';
import { listProviderSessionTimeoutLocaleParityGaps } from './ai-provider-session-timeout-locale-parity.util.js';
import {
  isExplainProviderSessionTimeoutPrompt,
  rescueProviderSessionTimeoutIntent,
} from './ai-provider-session-timeout.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider session timeout locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider session timeout scenario', () => {
    expect(listProviderSessionTimeoutLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider session timeout i18n fixture row to an eval golden case', () => {
    expect(
      listProviderSessionTimeoutEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider session timeout i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES.find(
        (row) => row.id === providerSessionTimeoutMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider session timeout i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderSessionTimeoutIntent(scenario.prompt, 'unknown')).toEqual(
      {
        action: scenario.expectedAction,
        rescueReason: scenario.rescueReason,
      },
    );
  });

  it.each(
    PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects explain_provider_session_timeout i18n prompt %s', (_id, prompt) => {
    expect(isExplainProviderSessionTimeoutPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider session timeout eval rows with provider surface and locale', () => {
    const hyCases = AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'ru',
    );

    expect(hyCases.length).toBe(4);
    expect(ruCases.length).toBe(4);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES.length).toBe(4);
  });
});
