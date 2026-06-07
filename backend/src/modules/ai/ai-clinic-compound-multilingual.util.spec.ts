import {
  MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS,
  MULTILINGUAL_CLINIC_COMPOUND_RESCUE_EVAL_SCENARIOS,
  assertClinicCompoundMultilingualParity,
} from './ai-clinic-compound-multilingual.fixtures.js';
import {
  clinicCompoundMultilingualRescueScenarioToEvalCase,
  clinicCompoundMultilingualScenarioToEvalCase,
} from './ai-clinic-compound-multilingual.util.js';
import {
  decomposeClinicCompoundPrompt,
  isClinicCompoundPrompt,
  rescueClinicCompoundIntent,
} from './ai-clinic-compound.util.js';

describe('ai-clinic-compound-multilingual (i18n-clinic-v2-ai-7)', () => {
  it('has HY/RU parity for every clinic compound scenario', () => {
    const counts = assertClinicCompoundMultilingualParity();
    expect(counts.dashboard).toBe(24);
    expect(counts.customer).toBe(24);
    expect(counts.public).toBe(24);
    expect(MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS.length).toBe(72);
  });

  it.each(MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS)(
    'detects $locale compound $sourceScenarioId',
    ({ prompt, surface }) => {
      expect(isClinicCompoundPrompt(prompt, surface)).toBe(true);
    },
  );

  it.each(MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS)(
    'decomposes $locale compound $sourceScenarioId',
    ({ prompt, surface, orderedActions }) => {
      const steps = decomposeClinicCompoundPrompt(prompt, surface);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.map((step) => step.action)).toEqual(orderedActions);
    },
  );

  it.each(MULTILINGUAL_CLINIC_COMPOUND_RESCUE_EVAL_SCENARIOS)(
    'rescues misclassified $locale compound $sourceScenarioId',
    ({ prompt, misclassifiedAction }) => {
      expect(rescueClinicCompoundIntent(prompt, misclassifiedAction!)).toEqual({
        action: 'compound_intent',
        rescueReason: 'clinic_compound',
      });
    },
  );

  it('maps decomposition scenarios to eval cases', () => {
    const scenario = MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS.find(
      (entry) =>
        entry.sourceScenarioId === 'order-lipid-notify-maria' &&
        entry.locale === 'hy',
    )!;
    const evalCase = clinicCompoundMultilingualScenarioToEvalCase(scenario);
    expect(evalCase.locale).toBe('hy');
    expect(evalCase.expect.compoundSteps).toEqual([
      'create_test_order',
      'notify_patient_result_ready',
    ]);
    expect(evalCase.expect.needsMultilingual).toBe(true);
    expect(evalCase.expect.compoundSurface).toBe('dashboard');
  });

  it('localizes customer names for rescue eval cases', () => {
    const scenario = MULTILINGUAL_CLINIC_COMPOUND_RESCUE_EVAL_SCENARIOS.find(
      (entry) =>
        entry.sourceScenarioId === 'order-lipid-notify-maria' &&
        entry.locale === 'hy',
    )!;
    const evalCase =
      clinicCompoundMultilingualRescueScenarioToEvalCase(scenario);
    expect(evalCase.expect.rescueFromAction).toBe(
      'notify_patient_result_ready',
    );
  });

  it('maps rescue scenarios to eval cases', () => {
    const scenario = MULTILINGUAL_CLINIC_COMPOUND_RESCUE_EVAL_SCENARIOS[0];
    const evalCase =
      clinicCompoundMultilingualRescueScenarioToEvalCase(scenario);
    expect(evalCase.expect.rescuedAction).toBe('compound_intent');
    expect(evalCase.expect.rescueReason).toBe('clinic_compound');
    expect(evalCase.expect.needsMultilingual).toBe(true);
  });

  it('throws when multilingual parity is missing', () => {
    expect(() =>
      assertClinicCompoundMultilingualParity([
        {
          id: 'missing-translation',
          surface: 'dashboard',
          prompt: 'x',
          orderedActions: ['create_test_order', 'notify_patient_result_ready'],
        },
      ]),
    ).toThrow(/Clinic compound multilingual parity missing/);
  });
});
