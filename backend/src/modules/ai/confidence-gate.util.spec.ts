import {
  AI_SETTINGS_CONFIDENCE_GATE_SCENARIOS,
  CONFIDENCE_GATE_SCENARIOS,
} from './confidence-gate.fixtures.js';
import {
  DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
  DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
  evaluateConfidenceGate,
  resolveConfidenceGateThresholds,
  shouldEscalateToSemantic,
} from './confidence-gate.util.js';

describe('confidence-gate.util (pipe-1.3.2)', () => {
  it.each(CONFIDENCE_GATE_SCENARIOS)(
    '$id — shouldEscalateToSemantic=$expectedShouldEscalate',
    ({
      action,
      confidence,
      expectedShouldEscalate,
      expectedDecision,
    }) => {
      expect(shouldEscalateToSemantic(action, confidence)).toBe(
        expectedShouldEscalate,
      );

      const gate = evaluateConfidenceGate(action, confidence);
      expect(gate.shouldEscalateToSemantic).toBe(expectedShouldEscalate);
      expect(gate.decision).toBe(expectedDecision);
      expect(gate.action).toBe(action);
      expect(gate.confidence).toBe(confidence);
      expect(gate.lowThreshold).toBe(DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE);
      expect(gate.highThreshold).toBe(DEFAULT_SEMANTIC_SKIP_CONFIDENCE);
      expect(gate.reason.length).toBeGreaterThan(0);
    },
  );

  describe('resolveConfidenceGateThresholds (pipe-1.3.3)', () => {
    it.each(AI_SETTINGS_CONFIDENCE_GATE_SCENARIOS)(
      '$id',
      ({
        aiLow,
        aiHigh,
        sessionHighOverride,
        action,
        confidence,
        expectedShouldEscalate,
      }) => {
        const thresholds = resolveConfidenceGateThresholds(
          { low: aiLow, high: aiHigh },
          sessionHighOverride,
        );
        expect(thresholds.low).toBe(aiLow);
        expect(thresholds.high).toBe(sessionHighOverride ?? aiHigh);

        expect(
          shouldEscalateToSemantic(action, confidence, thresholds),
        ).toBe(expectedShouldEscalate);
      },
    );

    it('uses ai settings bands instead of util defaults when wired', () => {
      const thresholds = resolveConfidenceGateThresholds({
        low: 0.55,
        high: 0.85,
      });

      expect(
        shouldEscalateToSemantic('create_booking', 0.6, thresholds),
      ).toBe(false);
      expect(
        shouldEscalateToSemantic('create_booking', 0.6, {
          low: DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
          high: DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
        }),
      ).toBe(true);
    });
  });
});
