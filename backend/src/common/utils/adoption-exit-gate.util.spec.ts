import {
  ADOPTION_EXIT_GATE_SCENARIOS,
  buildAdoptionExitGate,
  computeLocaleActivationSpread,
} from './adoption-exit-gate.util.js';

describe('adoption-exit-gate.util', () => {
  it.each(ADOPTION_EXIT_GATE_SCENARIOS)('$id exit gate met=$expectMet', ({ input, expectMet }) => {
    expect(buildAdoptionExitGate(input).met).toBe(expectMet);
  });

  it('computes locale activation spread', () => {
    const spread = computeLocaleActivationSpread({
      en: { activationRate: 0.62, installs: 10 },
      hy: { activationRate: 0.6, installs: 8 },
      ru: { activationRate: 0.61, installs: 9 },
    });
    expect(spread).toBeCloseTo(0.02, 5);
  });
});
