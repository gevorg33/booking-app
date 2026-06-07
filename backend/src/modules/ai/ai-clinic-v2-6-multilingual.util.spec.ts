import {
  assertClinicV2MultilingualParity,
  MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS,
} from './ai-clinic-v2-6-multilingual.fixtures.js';
import { rescueClinicV2SurfaceScenario } from './ai-clinic-v2-6-multilingual.util.js';
import { CLINIC_V2_SURFACE_SCENARIOS } from './ai-clinic-v2-6.fixtures.js';
import { AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-clinic-v2-6 multilingual (i18n-clinic-v2-ai-6)', () => {
  it('has HY/RU translations for every clinic v2 surface scenario', () => {
    expect(assertClinicV2MultilingualParity()).toEqual({
      dashboard:
        CLINIC_V2_SURFACE_SCENARIOS.filter((s) => s.surface === 'dashboard')
          .length * 2,
      provider:
        CLINIC_V2_SURFACE_SCENARIOS.filter((s) => s.surface === 'provider')
          .length * 2,
      customer:
        CLINIC_V2_SURFACE_SCENARIOS.filter((s) => s.surface === 'customer')
          .length * 2,
      public:
        CLINIC_V2_SURFACE_SCENARIOS.filter((s) => s.surface === 'public')
          .length * 2,
    });
    expect(MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS).toHaveLength(
      CLINIC_V2_SURFACE_SCENARIOS.length * 2,
    );
  });

  it('passes deterministic eval golden cases', () => {
    const failures = AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES.flatMap(
      (evalCase) => {
        const result = evaluateDeterministicEvalCase(evalCase);
        return result.passed
          ? []
          : [{ id: evalCase.id, errors: result.errors }];
      },
    );
    expect(failures).toEqual([]);
  });

  it.each(MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS)(
    'rescues $locale $surface $sourceScenarioId → $expectedAction',
    ({ prompt, expectedAction, rescueReason }) => {
      const rescued = rescueClinicV2SurfaceScenario({ prompt, expectedAction });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason ?? expectedAction);
    },
  );
});
