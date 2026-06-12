import {
  AI_SETTINGS_CONFIDENCE_GATE_SCENARIOS,
  CONFIDENCE_GATE_SCENARIOS,
  CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS,
} from './confidence-gate.fixtures.js';

describe('confidence-gate.fixtures (pipe-1.3.2)', () => {
  it('has unique scenario ids', () => {
    const ids = [
      ...CONFIDENCE_GATE_SCENARIOS.map((scenario) => scenario.id),
      ...AI_SETTINGS_CONFIDENCE_GATE_SCENARIOS.map((scenario) => scenario.id),
      ...CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS.map(
        (scenario) => scenario.id,
      ),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CONFIDENCE_GATE_SCENARIOS)(
    'scenario $id declares valid decision $expectedDecision',
    (scenario) => {
      expect(scenario.expectedDecision).toMatch(
        /^(skip_semantic|escalate_semantic|ambiguous_band)$/,
      );
      if (scenario.action === 'unknown' || scenario.confidence === undefined) {
        expect(scenario.expectedShouldEscalate).toBe(true);
      }
      if (
        typeof scenario.confidence === 'number' &&
        scenario.confidence >= 0.82 &&
        scenario.action !== 'unknown'
      ) {
        expect(scenario.expectedShouldEscalate).toBe(false);
      }
    },
  );
});
