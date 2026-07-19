import {
  AI_COMMAND_EVAL_PROVIDER_EXP_2_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES,
  listProviderExp2EvalLocaleParityGaps,
  providerExp2MultilingualEvalCaseId,
} from './ai-provider-exp-2-multilingual.eval.util.js';
import { PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS } from './ai-provider-exp-2-multilingual.fixtures.js';
import { listProviderExp2LocaleParityGaps } from './ai-provider-exp-2-locale-parity.util.js';
import {
  isCheckInClientPrompt,
  isMarkRunningLatePrompt,
  isMyStatsPrompt,
  isTeamFloorStatusPrompt,
  rescueProviderExp2Intent,
} from './ai-provider-exp-2.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider exp-2 locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN provider exp-2 scenario', () => {
    expect(listProviderExp2LocaleParityGaps()).toEqual([]);
  });

  it('maps every provider exp-2 i18n fixture row to an eval golden case', () => {
    expect(
      listProviderExp2EvalLocaleParityGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes provider exp-2 i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES.find(
      (row) => row.id === providerExp2MultilingualEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues provider exp-2 i18n prompt %s', (_id, scenario) => {
    expect(rescueProviderExp2Intent(scenario.prompt, 'unknown')).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'my_stats',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects my_stats i18n prompt %s', (_id, prompt) => {
    expect(isMyStatsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'team_floor_status',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects team_floor_status i18n prompt %s', (_id, prompt) => {
    expect(isTeamFloorStatusPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'check_in_client',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects check_in_client i18n prompt %s', (_id, prompt) => {
    expect(isCheckInClientPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.expectedAction === 'mark_running_late',
    ).map((scenario) => [scenario.id, scenario.prompt]),
  )('detects mark_running_late i18n prompt %s', (_id, prompt) => {
    expect(isMarkRunningLatePrompt(prompt)).toBe(true);
  });

  it('tags HY/RU provider exp-2 eval rows with provider surface and locale', () => {
    const hyCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EXP_2_CASES.filter(
        (row) => row.locale === 'hy',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      ),
    ];
    const ruCases = [
      ...AI_COMMAND_EVAL_PROVIDER_EXP_2_CASES.filter(
        (row) => row.locale === 'ru',
      ),
      ...AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      ),
    ];

    expect(hyCases.length).toBe(62);
    expect(ruCases.length).toBe(62);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
  });
});
