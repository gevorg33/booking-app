import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES,
  listProviderOpenShiftsEvalLocaleParityGaps,
  providerOpenShiftsMultilingualEvalCaseId,
} from './ai-provider-open-shifts-multilingual.eval.util.js';
import { PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS } from './ai-provider-open-shifts-multilingual.fixtures.js';
import { listProviderOpenShiftsLocaleParityGaps } from './ai-provider-open-shifts-locale-parity.util.js';
import {
  isSuggestWaitlistForGapPrompt,
  rescueProviderOpenShiftsIntent,
} from './ai-provider-open-shifts.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider open shifts locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider open shifts scenario', () => {
    expect(listProviderOpenShiftsLocaleParityGaps()).toEqual([]);
  });

  it('maps every provider open shifts i18n fixture row to an eval golden case', () => {
    expect(
      listProviderOpenShiftsEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider open shifts i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES.find(
        (row) => row.id === providerOpenShiftsMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider open shifts i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderOpenShiftsIntent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects suggest_waitlist_for_gap i18n prompt %s', (_id, prompt) => {
    expect(isSuggestWaitlistForGapPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider open shifts eval rows with provider surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(2);
    expect(ruCases.length).toBe(2);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_CASES.length).toBe(2);
  });
});
