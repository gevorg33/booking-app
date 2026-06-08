import {
  ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES,
  ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES,
  FALSE_COMPOUND_GUARD_SCENARIOS,
  TRUE_COMPOUND_GUARD_SCENARIOS,
} from './ai-compound-precision.fixtures.js';
import {
  assessAmbiguityCorpusCompoundPrecision,
  buildCompoundPrecisionReport,
  evaluateFalseCompoundGuardScenario,
  evaluateTrueCompoundGuardScenario,
  isAvailabilityConjunctionSingleIntent,
  isDateTimeRangeConjunction,
  isDualEntityReadConjunction,
  isMultiServiceSingleBookingConjunction,
  isOrchestrationFallbackPrompt,
  shouldSuppressFalseCompound,
} from './ai-compound-precision.util.js';
import { buildAmbiguityCorpusEvalCases } from './eval/ai-command-eval.ambiguity.util.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from './intent-decomposition.util.js';

describe('ai-compound-precision.util (acc-3.9)', () => {
  it('documents minimum guard scenario counts', () => {
    expect(FALSE_COMPOUND_GUARD_SCENARIOS.length).toBeGreaterThanOrEqual(
      ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES,
    );
    expect(TRUE_COMPOUND_GUARD_SCENARIOS.length).toBeGreaterThanOrEqual(
      ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES,
    );
  });

  it.each(FALSE_COMPOUND_GUARD_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'false-compound guard %s',
    (_id, scenario) => {
      expect(shouldSuppressFalseCompound(scenario.prompt)).toBe(true);
      expect(
        evaluateFalseCompoundGuardScenario(
          scenario,
          decomposeDeterministicForSurface,
          isCompoundPrompt,
        ),
      ).toBe(true);
    },
  );

  it.each(TRUE_COMPOUND_GUARD_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'true-compound guard %s',
    (_id, scenario) => {
      expect(
        evaluateTrueCompoundGuardScenario(
          scenario,
          decomposeDeterministicForSurface,
          isCompoundPrompt,
        ),
      ).toBe(true);
    },
  );

  it('detects specialized false-compound patterns', () => {
    expect(
      isAvailabilityConjunctionSingleIntent(
        'Who is free tomorrow and who can do lashes',
      ),
    ).toBe(true);
    expect(
      isMultiServiceSingleBookingConjunction(
        'Book haircut and beard trim Tuesday 10am',
      ),
    ).toBe(true);
    expect(
      isDualEntityReadConjunction('Show appointments for Gevorg and Maria tomorrow'),
    ).toBe(true);
    expect(
      isDateTimeRangeConjunction('Cancel all appointments between 16:30 and 17:30'),
    ).toBe(true);
    expect(
      isOrchestrationFallbackPrompt(
        'Book massage with Gevorg tomorrow at 10, otherwise book whoever is free',
      ),
    ).toBe(true);
  });

  it('acc-3.9 — ambiguity corpus has zero false-compound decompositions', () => {
    const report = assessAmbiguityCorpusCompoundPrecision(
      buildAmbiguityCorpusEvalCases(),
      decomposeDeterministicForSurface,
    );
    expect(report.passed).toBe(true);
    expect(report.ambiguityFalseCompounds).toBe(0);
    expect(report.ambiguityCompoundExpectEmpty).toBeGreaterThanOrEqual(5);
  });

  it('acc-3.9 — compound precision report passes guard + ambiguity gates', () => {
    const report = buildCompoundPrecisionReport(
      decomposeDeterministicForSurface,
      isCompoundPrompt,
      buildAmbiguityCorpusEvalCases(),
    );
    expect(report.passed).toBe(true);
    expect(report.falseGuardPassed).toBeGreaterThanOrEqual(
      ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES,
    );
    expect(report.trueGuardPassed).toBeGreaterThanOrEqual(
      ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES,
    );
  });
});
