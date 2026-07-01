import {
  AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES,
  listProviderDateFormatEvalLocaleParityGaps,
  providerDateFormatMultilingualEvalCaseId,
} from './ai-provider-date-format-multilingual.eval.util.js';
import { PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS } from './ai-provider-date-format-multilingual.fixtures.js';
import { listProviderDateFormatLocaleParityGaps } from './ai-provider-date-format-locale-parity.util.js';
import {
  isConfigureProviderPushDateFormatPrompt,
  isExplainProviderDateDisplayPrompt,
  rescueProviderDateFormatIntent,
} from './ai-provider-date-format.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider date-format locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider date-format scenario', () => {
    expect(listProviderDateFormatLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider date-format i18n fixture row to an eval golden case', () => {
    expect(
      listProviderDateFormatEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider date-format i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES.find(
        (row) => row.id === providerDateFormatMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider date-format i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderDateFormatIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'explain_provider_date_display',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects explain_provider_date_display i18n prompt %s', (_id, prompt) => {
    expect(isExplainProviderDateDisplayPrompt(prompt)).toBe(true);
    expect(isConfigureProviderPushDateFormatPrompt(prompt)).toBe(false);
  });

  it.each(
    PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'configure_provider_push_date_format',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )(
    'detects configure_provider_push_date_format i18n prompt %s',
    (_id, prompt) => {
      expect(isConfigureProviderPushDateFormatPrompt(prompt)).toBe(true);
      expect(isExplainProviderDateDisplayPrompt(prompt)).toBe(false);
    },
  );

  it('tags HY/RU provider date-format eval rows with provider surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(8);
    expect(ruCases.length).toBe(8);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES.length).toBe(6);
    expect(
      AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES.length,
    ).toBe(6);
  });
});
