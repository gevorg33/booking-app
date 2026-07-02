import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES,
  listProviderTeamWhosNextEvalLocaleParityGaps,
  providerTeamWhosNextMultilingualEvalCaseId,
} from './ai-provider-team-whos-next-multilingual.eval.util.js';
import { PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-team-whos-next-multilingual.fixtures.js';
import { listProviderTeamWhosNextLocaleParityGaps } from './ai-provider-team-whos-next-locale-parity.util.js';
import { isTeamWhosNextPrompt } from '../provider-mobile/provider-team-whos-next.util.js';
import { rescueProviderTeamWhosNextIntent } from './ai-provider-team-whos-next.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai provider team whos next locale parity (acc-2.4)', () => {
  it('ships HY and RU fixture siblings for every EN team whos next scenario', () => {
    expect(listProviderTeamWhosNextLocaleParityGaps()).toEqual([]);
  });

  it('maps every team whos next i18n fixture row to an eval golden case', () => {
    expect(
      listProviderTeamWhosNextEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it.each(
    PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes team whos next i18n eval case %s', (_id, scenario) => {
    const evalCase =
      AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES.find(
        (row) =>
          row.id === providerTeamWhosNextMultilingualEvalCaseId(scenario),
      );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });

  it.each(
    PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('rescues team whos next i18n prompt %s', (_id, scenario) => {
    expect(
      rescueProviderTeamWhosNextIntent(scenario.prompt, 'unknown'),
    ).toEqual({
      action: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
    });
  });

  it.each(
    PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects team_whos_next i18n prompt %s', (_id, prompt) => {
    expect(isTeamWhosNextPrompt(prompt)).toBe(true);
  });

  it('tags HY/RU team whos next eval rows with provider surface and locale', () => {
    const hyCases =
      AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'hy',
      );
    const ruCases =
      AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES.filter(
        (row) => row.locale === 'ru',
      );

    expect(hyCases.length).toBe(2);
    expect(ruCases.length).toBe(2);
    expect(hyCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'provider')).toBe(true);
    expect(
      AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_CASES.length).toBe(2);
  });
});
