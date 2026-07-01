import {
  AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES,
  listProviderClientContextEvalLocaleParityGaps,
  providerClientContextMultilingualEvalCaseId,
} from './ai-provider-client-context-multilingual.eval.util.js';
import { PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-client-context-multilingual.fixtures.js';
import { listProviderClientContextLocaleParityGaps } from './ai-provider-client-context-locale-parity.util.js';
import {
  isAddClientNotePrompt,
  isShowClientHistoryPrompt,
  isSummarizeClientPrompt,
  rescueProviderClientContextIntent,
} from './ai-provider-client-context.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider client context locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider client context scenario', () => {
    expect(listProviderClientContextLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider client context i18n fixture row to an eval golden case', () => {
    expect(
      listProviderClientContextEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider client context i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES.find(
        (row) =>
          row.id === providerClientContextMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider client context i18n prompt %s', (_id, scenario) => {
    expect(
      rescueProviderClientContextIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'summarize_client',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects summarize_client i18n prompt %s', (_id, prompt) => {
    expect(isSummarizeClientPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'show_client_history',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects show_client_history i18n prompt %s', (_id, prompt) => {
    expect(isShowClientHistoryPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'add_client_note',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects add_client_note i18n prompt %s', (_id, prompt) => {
    expect(isAddClientNotePrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider client context eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(28);
    expect(ruCases.length).toBe(28);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
